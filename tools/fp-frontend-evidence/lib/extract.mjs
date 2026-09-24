/**
 * Deterministic API / network evidence extraction from archived JS text.
 *
 * Core principle: prefer structured `{path,method}` client evidence.
 * Generic `/api/`, fetch, URL strings are supporting only — never auto-promote
 * to structured_operation.
 */

import {
  EVIDENCE_CATEGORY,
  FLOATPLANE_HOST_SUFFIXES,
  REJECTED_API_HOST_PATTERNS,
} from './constants.mjs';
import {
  normalizeMethod,
  normalizePath,
  apiFamilyFromPath,
  evidenceId,
  hostMatchesSuffix,
} from './normalize.mjs';

/**
 * @typedef {{
 *   id: string,
 *   category: string,
 *   path: string | null,
 *   pathNormalized: string | null,
 *   method: string | null,
 *   apiFamily: string | null,
 *   source: {
 *     path: string,
 *     sha256: string,
 *     role: string,
 *     byteOffset: number,
 *     endOffset: number,
 *     snippet: string,
 *   },
 *   request?: {
 *     contentType?: string | null,
 *     bodySerializer?: string | null,
 *     responseMapper?: string | null,
 *     hasQuery?: boolean,
 *     hasBody?: boolean,
 *     hasHeaders?: boolean,
 *   },
 *   structuralContext: string,
 *   notes?: string[],
 * }} EvidenceItem
 */

/**
 * Extract evidence from one JS source.
 *
 * @param {{
 *   text: string,
 *   sourcePath: string,
 *   sourceSha256: string,
 *   role?: string,
 * }} input
 * @returns {{
 *   items: EvidenceItem[],
 *   rejectedSignals: { raw: string, reason: string, sourcePath: string, byteOffset: number }[],
 *   warnings: string[],
 * }}
 */
export function extractEvidenceFromSource(input) {
  const text = input.text;
  const sourcePath = input.sourcePath;
  const sourceSha256 = input.sourceSha256;
  const role = input.role || 'chunk';

  /** @type {EvidenceItem[]} */
  const items = [];
  /** @type {{ raw: string, reason: string, sourcePath: string, byteOffset: number }[]} */
  const rejectedSignals = [];
  /** @type {string[]} */
  const warnings = [];

  const structuredKeys = new Set();

  // --- 1. Structured {path, method} OpenAPI-generator client ops ---
  // this.request({path:"/api/…",method:"GET|POST",…})
  const structuredRe =
    /\bthis\.request\s*\(\s*\{\s*path\s*:\s*(["'])(\/api\/[^"']+)\1\s*,\s*method\s*:\s*(["'])([A-Za-z]+)\3/g;
  let m;
  while ((m = structuredRe.exec(text)) !== null) {
    const pathRaw = m[2];
    const method = normalizeMethod(m[4]);
    if (!method) {
      warnings.push(`Unrecognized method ${m[4]} at ${sourcePath}:${m.index}`);
      continue;
    }
    const pathNormalized = normalizePath(pathRaw);
    const endOfCall = findMatchingParen(text, m.index + m[0].indexOf('('));
    const callEnd = endOfCall >= 0 ? endOfCall + 1 : Math.min(text.length, m.index + m[0].length + 200);
    const snippet = snippetAround(text, m.index, callEnd);

    const meta = extractRequestMeta(text, m.index, callEnd, pathRaw);

    const structuralContext = 'openapi_client_request';
    const id = evidenceId({
      category: EVIDENCE_CATEGORY.STRUCTURED_OPERATION,
      path: pathNormalized,
      method,
      structuralContext,
    });

    structuredKeys.add(`${method}:${pathNormalized}`);

    items.push({
      id,
      category: EVIDENCE_CATEGORY.STRUCTURED_OPERATION,
      path: pathRaw,
      pathNormalized,
      method,
      apiFamily: apiFamilyFromPath(pathNormalized),
      source: {
        path: sourcePath,
        sha256: sourceSha256,
        role,
        byteOffset: m.index,
        endOffset: callEnd,
        snippet,
      },
      request: meta,
      structuralContext,
    });
  }

  // Also method-first variant (not observed but supported)
  const structuredMethodFirstRe =
    /\bthis\.request\s*\(\s*\{\s*method\s*:\s*(["'])([A-Za-z]+)\1\s*,\s*path\s*:\s*(["'])(\/api\/[^"']+)\3/g;
  while ((m = structuredMethodFirstRe.exec(text)) !== null) {
    const method = normalizeMethod(m[2]);
    const pathRaw = m[4];
    if (!method) continue;
    const pathNormalized = normalizePath(pathRaw);
    if (structuredKeys.has(`${method}:${pathNormalized}`)) continue;
    const endOfCall = findMatchingParen(text, m.index + m[0].indexOf('('));
    const callEnd = endOfCall >= 0 ? endOfCall + 1 : Math.min(text.length, m.index + m[0].length + 200);
    const structuralContext = 'openapi_client_request';
    items.push({
      id: evidenceId({
        category: EVIDENCE_CATEGORY.STRUCTURED_OPERATION,
        path: pathNormalized,
        method,
        structuralContext,
      }),
      category: EVIDENCE_CATEGORY.STRUCTURED_OPERATION,
      path: pathRaw,
      pathNormalized,
      method,
      apiFamily: apiFamilyFromPath(pathNormalized),
      source: {
        path: sourcePath,
        sha256: sourceSha256,
        role,
        byteOffset: m.index,
        endOffset: callEnd,
        snippet: snippetAround(text, m.index, callEnd),
      },
      request: extractRequestMeta(text, m.index, callEnd, pathRaw),
      structuralContext,
    });
    structuredKeys.add(`${method}:${pathNormalized}`);
  }

  // --- 2. Realtime: Nm.socket.post(…) with path ternary / literals ---
  extractRealtime(text, sourcePath, sourceSha256, role, items, warnings);

  // --- 3. Chat / known host config URIs ---
  extractHosts(text, sourcePath, sourceSha256, role, items, rejectedSignals);

  // --- 4. URL templates /api/… in template literals ---
  extractUrlTemplates(text, sourcePath, sourceSha256, role, items, structuredKeys, rejectedSignals);

  // --- 5. Remaining /api/ string literals as supporting refs (never structured) ---
  extractApiStringLiterals(text, sourcePath, sourceSha256, role, items, structuredKeys, rejectedSignals);

  return { items, rejectedSignals, warnings };
}

/**
 * Structurally associated metadata from the same request({…}) call and
 * immediate return wrapper — not free-form nearby inference.
 *
 * @param {string} text
 * @param {number} start
 * @param {number} callEnd
 * @param {string} pathRaw
 */
function extractRequestMeta(text, start, callEnd, pathRaw) {
  const callSlice = text.slice(start, callEnd);
  /** @type {{ contentType?: string | null, bodySerializer?: string | null, responseMapper?: string | null, hasQuery?: boolean, hasBody?: boolean, hasHeaders?: boolean }} */
  const meta = {
    hasQuery: /[,:{]\s*query\s*:/.test(callSlice),
    hasBody: /[,:{]\s*body\s*:/.test(callSlice),
    hasHeaders: /[,:{]\s*headers\s*:/.test(callSlice),
    contentType: null,
    bodySerializer: null,
    responseMapper: null,
  };

  // Body serializer: body:(0,r.FooToJSON)(…) or body:r.FooToJSON(…)
  const bodySer = callSlice.match(
    /body\s*:\s*(?:\(\s*0\s*,\s*[A-Za-z_$][\w$]*\s*\.\s*([A-Za-z_$][\w$]*ToJSON)\s*\)|\s*([A-Za-z_$][\w$]*ToJSON)\s*)\s*\(/,
  );
  if (bodySer) {
    meta.bodySerializer = bodySer[1] || bodySer[2];
  }

  // Content-Type assigned to headers object in the same Raw method window (look-behind ≤400 chars,
  // only the assignment pattern tied to headers var used in this call).
  const headersVar = callSlice.match(/headers\s*:\s*([A-Za-z_$][\w$]*)/);
  if (headersVar) {
    const hv = headersVar[1];
    const lookBehind = text.slice(Math.max(0, start - 400), start);
    const ctRe = new RegExp(
      `${escapeRegExp(hv)}\\s*(?:\\[\\s*["']Content-Type["']\\s*\\]|\\.\\s*\\["Content-Type"\\])\\s*=\\s*["']([^"']+)["']`,
    );
    const ctM = lookBehind.match(ctRe);
    if (ctM) meta.contentType = ctM[1];
    // Also object literal form on headers in the call itself
  }
  const ctLit = callSlice.match(/["']Content-Type["']\s*:\s*["']([^"']+)["']/);
  if (ctLit) meta.contentType = ctLit[1];

  // Response mapper on immediate return after await this.request(…)
  const after = text.slice(callEnd, Math.min(text.length, callEnd + 180));
  const mapper = after.match(
    /(?:0\s*,\s*[A-Za-z_$][\w$]*\s*\.\s*([A-Za-z_$][\w$]*FromJSON)|([A-Za-z_$][\w$]*FromJSON))\s*\)/,
  );
  if (mapper) {
    meta.responseMapper = mapper[1] || mapper[2];
  }

  // Silence unused
  void pathRaw;
  return meta;
}

/**
 * @param {string} text
 * @param {string} sourcePath
 * @param {string} sourceSha256
 * @param {string} role
 * @param {EvidenceItem[]} items
 * @param {string[]} warnings
 */
function extractRealtime(text, sourcePath, sourceSha256, role, items, warnings) {
  // Nm.socket.post(r,{…}) where r is chosen from cookie vs tk paths
  const socketPostRe = /\.socket\.post\s*\(/g;
  let m;
  while ((m = socketPostRe.exec(text)) !== null) {
    const lookBehind = text.slice(Math.max(0, m.index - 250), m.index);
    const paths = [...lookBehind.matchAll(/["'](\/api\/[^"']*socket[^"']*)["']/g)].map((x) => x[1]);
    const uniquePaths = [...new Set(paths.map(normalizePath))];
    const callEnd = findMatchingParen(text, m.index + m[0].indexOf('('));
    const end = callEnd >= 0 ? callEnd + 1 : m.index + m[0].length;

    if (uniquePaths.length === 0) {
      items.push({
        id: evidenceId({
          category: EVIDENCE_CATEGORY.REALTIME_OPERATION,
          path: null,
          method: 'POST',
          structuralContext: 'sails_socket_post_unresolved_path',
        }),
        category: EVIDENCE_CATEGORY.REALTIME_OPERATION,
        path: null,
        pathNormalized: null,
        method: 'POST',
        apiFamily: null,
        source: {
          path: sourcePath,
          sha256: sourceSha256,
          role,
          byteOffset: m.index,
          endOffset: end,
          snippet: snippetAround(text, Math.max(0, m.index - 80), end),
        },
        structuralContext: 'sails_socket_post_unresolved_path',
        notes: ['socket.post call site without resolvable path literal in look-behind window'],
      });
      warnings.push(`socket.post without resolvable path at ${sourcePath}:${m.index}`);
      continue;
    }

    for (const pathNormalized of uniquePaths) {
      items.push({
        id: evidenceId({
          category: EVIDENCE_CATEGORY.REALTIME_OPERATION,
          path: pathNormalized,
          method: 'POST',
          structuralContext: 'sails_socket_post',
        }),
        category: EVIDENCE_CATEGORY.REALTIME_OPERATION,
        path: pathNormalized,
        pathNormalized,
        method: 'POST',
        apiFamily: apiFamilyFromPath(pathNormalized),
        source: {
          path: sourcePath,
          sha256: sourceSha256,
          role,
          byteOffset: m.index,
          endOffset: end,
          snippet: snippetAround(text, Math.max(0, m.index - 120), end),
        },
        structuralContext: 'sails_socket_post',
      });
    }
  }

  // chat:{socket:{uri:"https://chat.floatplane.com"
  const chatRe = /chat\s*:\s*\{\s*socket\s*:\s*\{\s*uri\s*:\s*(["'])(https?:\/\/[^"']+)\1/g;
  while ((m = chatRe.exec(text)) !== null) {
    const uri = m[2];
    items.push({
      id: evidenceId({
        category: EVIDENCE_CATEGORY.REALTIME_OPERATION,
        path: uri,
        method: null,
        structuralContext: 'chat_socket_uri',
      }),
      category: EVIDENCE_CATEGORY.REALTIME_OPERATION,
      path: uri,
      pathNormalized: normalizePath(uri),
      method: null,
      apiFamily: null,
      source: {
        path: sourcePath,
        sha256: sourceSha256,
        role,
        byteOffset: m.index,
        endOffset: m.index + m[0].length,
        snippet: snippetAround(text, m.index, m.index + m[0].length),
      },
      structuralContext: 'chat_socket_uri',
    });
  }
}

/**
 * @param {string} text
 * @param {string} sourcePath
 * @param {string} sourceSha256
 * @param {string} role
 * @param {EvidenceItem[]} items
 * @param {{ raw: string, reason: string, sourcePath: string, byteOffset: number }[]} rejectedSignals
 */
function extractHosts(text, sourcePath, sourceSha256, role, items, rejectedSignals) {
  const hostRe = /https?:\/\/([a-z0-9.-]+\.(?:floatplane\.com|floatplane\.tv|keyos\.com|twitch\.tv))[/"]?/gi;
  let m;
  const seen = new Set();
  while ((m = hostRe.exec(text)) !== null) {
    const host = m[1].toLowerCase();
    if (seen.has(host)) continue;
    seen.add(host);

    if (isRejectedApiHost(host)) {
      rejectedSignals.push({
        raw: m[0].replace(/["'/]+$/, ''),
        reason: 'non_floatplane_host',
        sourcePath,
        byteOffset: m.index,
      });
      continue;
    }

    if (!hostMatchesSuffix(host, FLOATPLANE_HOST_SUFFIXES)) continue;

    let roleHint = 'host';
    if (host.startsWith('chat.')) roleHint = 'chat_socket';
    else if (host.startsWith('auth.')) roleHint = 'auth';
    else if (host.startsWith('apm.')) roleHint = 'apm';
    else if (host.startsWith('status.')) roleHint = 'status';
    else if (host.startsWith('frontend.')) roleHint = 'frontend_cdn';

    items.push({
      id: evidenceId({
        category: EVIDENCE_CATEGORY.NETWORK_REFERENCE,
        path: `https://${host}`,
        method: null,
        structuralContext: `host:${roleHint}`,
      }),
      category: EVIDENCE_CATEGORY.NETWORK_REFERENCE,
      path: `https://${host}`,
      pathNormalized: null,
      method: null,
      apiFamily: null,
      source: {
        path: sourcePath,
        sha256: sourceSha256,
        role,
        byteOffset: m.index,
        endOffset: m.index + m[0].length,
        snippet: snippetAround(text, m.index, m.index + m[0].length),
      },
      structuralContext: `host:${roleHint}`,
      notes: [`hostRole=${roleHint}`],
    });
  }
}

/**
 * @param {string} text
 * @param {string} sourcePath
 * @param {string} sourceSha256
 * @param {string} role
 * @param {EvidenceItem[]} items
 * @param {Set<string>} structuredKeys
 * @param {{ raw: string, reason: string, sourcePath: string, byteOffset: number }[]} rejectedSignals
 */
function extractUrlTemplates(text, sourcePath, sourceSha256, role, items, structuredKeys, rejectedSignals) {
  // Template literals containing /api/
  const tmplRe = /`([^`]*\/api\/[^`]*)`/g;
  let m;
  while ((m = tmplRe.exec(text)) !== null) {
    const raw = m[1];
    // Only reject when an explicit vendor host URL appears; record that URL, not the whole template.
    const vendorUrl = raw.match(/https?:\/\/[a-z0-9.-]*(?:keyos\.com)[^\s`'"]*/i);
    if (vendorUrl) {
      rejectedSignals.push({
        raw: vendorUrl[0].slice(0, 200),
        reason: 'non_floatplane_host',
        sourcePath,
        byteOffset: m.index,
      });
      continue;
    }
    // Skip oversized templates that are clearly not URL builders (EME/codec blobs, etc.)
    if (raw.length > 300 && !/^[\s/]*\/api\//.test(raw) && !/\$\{/.test(raw.slice(0, 80))) {
      continue;
    }
    const pathPart = extractPathFromTemplate(raw);
    if (!pathPart) {
      items.push({
        id: evidenceId({
          category: EVIDENCE_CATEGORY.AMBIGUOUS_REFERENCE,
          path: raw.slice(0, 120),
          method: null,
          structuralContext: 'template_literal_api',
        }),
        category: EVIDENCE_CATEGORY.AMBIGUOUS_REFERENCE,
        path: raw.slice(0, 200),
        pathNormalized: null,
        method: null,
        apiFamily: null,
        source: {
          path: sourcePath,
          sha256: sourceSha256,
          role,
          byteOffset: m.index,
          endOffset: m.index + m[0].length,
          snippet: snippetAround(text, m.index, m.index + m[0].length),
        },
        structuralContext: 'template_literal_api',
      });
      continue;
    }
    const pathNormalized = normalizePath(pathPart.replace(/\$\{[^}]+\}/g, '{param}'));
    // Do not promote to structured even if path looks like an API path
    const method = null;
    if (structuredKeys.has(`GET:${pathNormalized}`) || structuredKeys.has(`POST:${pathNormalized}`)) {
      // Still record as url_template supporting signal with distinct id
    }
    items.push({
      id: evidenceId({
        category: EVIDENCE_CATEGORY.URL_TEMPLATE,
        path: pathNormalized,
        method,
        structuralContext: 'template_literal',
      }),
      category: EVIDENCE_CATEGORY.URL_TEMPLATE,
      path: pathPart,
      pathNormalized,
      method,
      apiFamily: apiFamilyFromPath(pathNormalized),
      source: {
        path: sourcePath,
        sha256: sourceSha256,
        role,
        byteOffset: m.index,
        endOffset: m.index + m[0].length,
        snippet: snippetAround(text, m.index, m.index + m[0].length),
      },
      structuralContext: 'template_literal',
    });
  }
}

/**
 * Bare string literals with /api/ that were not already structured ops.
 * Categorized as network_reference or ambiguous; never structured_operation.
 *
 * @param {string} text
 * @param {string} sourcePath
 * @param {string} sourceSha256
 * @param {string} role
 * @param {EvidenceItem[]} items
 * @param {Set<string>} structuredKeys
 * @param {{ raw: string, reason: string, sourcePath: string, byteOffset: number }[]} rejectedSignals
 */
function extractApiStringLiterals(text, sourcePath, sourceSha256, role, items, structuredKeys, rejectedSignals) {
  const seenPaths = new Set(
    items
      .filter((i) => i.pathNormalized && i.category !== EVIDENCE_CATEGORY.NETWORK_REFERENCE)
      .map((i) => i.pathNormalized),
  );

  const strRe = /(["'])(https?:\/\/[^"']*\/api\/[^"']+|\/api\/[^"']+)\1/g;
  let m;
  while ((m = strRe.exec(text)) !== null) {
    const raw = m[2];
    if (looksLikeRejectedVendorUrl(raw)) {
      rejectedSignals.push({
        raw: raw.slice(0, 200),
        reason: 'non_floatplane_host',
        sourcePath,
        byteOffset: m.index,
      });
      continue;
    }

    // Skip if this string is inside a this.request({path:"…"}) we already counted —
    // structured extractor already recorded it. Check look-behind for path:"
    const behind = text.slice(Math.max(0, m.index - 12), m.index);
    if (/path\s*:\s*$/.test(behind)) {
      continue;
    }

    let pathNormalized;
    let category = EVIDENCE_CATEGORY.NETWORK_REFERENCE;
    let structuralContext = 'string_literal_api';

    if (/^https?:\/\//i.test(raw)) {
      try {
        const u = new URL(raw);
        if (isRejectedApiHost(u.host)) {
          rejectedSignals.push({
            raw,
            reason: 'non_floatplane_host',
            sourcePath,
            byteOffset: m.index,
          });
          continue;
        }
        pathNormalized = normalizePath(u.pathname);
        if (!hostMatchesSuffix(u.host, FLOATPLANE_HOST_SUFFIXES)) {
          category = EVIDENCE_CATEGORY.AMBIGUOUS_REFERENCE;
          structuralContext = 'absolute_api_url_unknown_host';
        }
      } catch {
        category = EVIDENCE_CATEGORY.AMBIGUOUS_REFERENCE;
        pathNormalized = null;
      }
    } else {
      pathNormalized = normalizePath(raw.split('?')[0]);
    }

    if (pathNormalized && seenPaths.has(pathNormalized)) continue;
    if (pathNormalized) seenPaths.add(pathNormalized);

    // If the path matches a structured op path, keep as network_reference supporting only
    items.push({
      id: evidenceId({
        category,
        path: pathNormalized || raw.slice(0, 80),
        method: null,
        structuralContext,
      }),
      category,
      path: raw,
      pathNormalized: pathNormalized || null,
      method: null,
      apiFamily: pathNormalized ? apiFamilyFromPath(pathNormalized) : null,
      source: {
        path: sourcePath,
        sha256: sourceSha256,
        role,
        byteOffset: m.index,
        endOffset: m.index + m[0].length,
        snippet: snippetAround(text, m.index, m.index + m[0].length),
      },
      structuralContext,
    });
  }
}

/** @param {string} host */
function isRejectedApiHost(host) {
  const h = host.toLowerCase();
  return REJECTED_API_HOST_PATTERNS.some((re) => re.test(h));
}

/** @param {string} raw */
function looksLikeRejectedVendorUrl(raw) {
  // Require an explicit vendor API host — avoid bare "fairplay." / codec substrings.
  return /https?:\/\/[a-z0-9.-]*(?:keyos\.com|twitch\.tv)\b/i.test(raw);
}

/** @param {string} raw */
function extractPathFromTemplate(raw) {
  // Prefer first /api/… segment; replace ${…} with {param}
  const idx = raw.indexOf('/api/');
  if (idx < 0) return null;
  let path = raw.slice(idx).split(/[\s'"]/)[0];
  // trim trailing template junk
  path = path.replace(/[?,&#].*$/, (rest) => (rest.startsWith('?') ? '' : ''));
  // Keep query-less path; strip ?…
  const q = path.indexOf('?');
  if (q >= 0) path = path.slice(0, q);
  return path || null;
}

/**
 * Find index of matching closing paren for '(' at openIdx.
 * @param {string} text
 * @param {number} openIdx
 */
function findMatchingParen(text, openIdx) {
  if (openIdx < 0 || text[openIdx] !== '(') return -1;
  let depth = 0;
  let inStr = null;
  let escape = false;
  for (let i = openIdx; i < text.length; i++) {
    const ch = text[i];
    if (inStr) {
      if (escape) {
        escape = false;
        continue;
      }
      if (ch === '\\') {
        escape = true;
        continue;
      }
      if (ch === inStr) inStr = null;
      continue;
    }
    if (ch === '"' || ch === "'" || ch === '`') {
      inStr = ch;
      continue;
    }
    if (ch === '(') depth++;
    else if (ch === ')') {
      depth--;
      if (depth === 0) return i;
    }
  }
  return -1;
}

/**
 * @param {string} text
 * @param {number} start
 * @param {number} end
 */
function snippetAround(text, start, end) {
  const s = Math.max(0, start);
  const e = Math.min(text.length, Math.max(end, start + 1));
  let snip = text.slice(s, Math.min(e, s + 240));
  snip = snip.replace(/\s+/g, ' ').trim();
  if (e - s > 240) snip += '…';
  return snip;
}

/** @param {string} s */
function escapeRegExp(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Merge and sort evidence items for stable output.
 * Deduplicate by id, keeping first (which should be equivalent semantically).
 * @param {EvidenceItem[]} items
 */
export function dedupeAndSortEvidence(items) {
  const byId = new Map();
  for (const item of items) {
    if (!byId.has(item.id)) {
      byId.set(item.id, item);
    } else {
      // Merge call-site as additional note only if different source offset
      const existing = byId.get(item.id);
      if (
        existing.source.byteOffset !== item.source.byteOffset ||
        existing.source.path !== item.source.path
      ) {
        const notes = existing.notes ? [...existing.notes] : [];
        notes.push(
          `also_at:${item.source.path}@${item.source.byteOffset}`,
        );
        existing.notes = notes;
      }
    }
  }
  return [...byId.values()].sort((a, b) => {
    if (a.category !== b.category) return a.category.localeCompare(b.category);
    const pa = a.pathNormalized || a.path || '';
    const pb = b.pathNormalized || b.path || '';
    if (pa !== pb) return pa.localeCompare(pb);
    const ma = a.method || '';
    const mb = b.method || '';
    if (ma !== mb) return ma.localeCompare(mb);
    return a.id.localeCompare(b.id);
  });
}

/**
 * Count structured operations (unique method+path).
 * @param {EvidenceItem[]} items
 */
export function countStructuredOperations(items) {
  const keys = new Set();
  for (const item of items) {
    if (item.category !== EVIDENCE_CATEGORY.STRUCTURED_OPERATION) continue;
    if (!item.method || !item.pathNormalized) continue;
    keys.add(`${item.method}:${item.pathNormalized}`);
  }
  return keys.size;
}
