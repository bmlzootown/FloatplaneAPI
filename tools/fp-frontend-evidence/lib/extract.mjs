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
 *   sourcePath: string,
 *   sourceSha256: string,
 *   role: string,
 *   byteOffset: number,
 *   endOffset: number,
 *   snippet: string,
 * }} ProvenanceLocation
 *
 * @typedef {{
 *   id: string,
 *   category: string,
 *   path: string | null,
 *   pathNormalized: string | null,
 *   method: string | null,
 *   apiFamily: string | null,
 *   provenance: ProvenanceLocation[],
 *   request?: {
 *     contentType?: string | null,
 *     bodySerializer?: string | null,
 *     responseMapper?: string | null,
 *     hasQuery?: boolean,
 *     hasBody?: boolean,
 *     hasHeaders?: boolean,
 *   },
 *   structuralKind: string,
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
 *   rejectedSignals: object[],
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
  /** @type {object[]} */
  const rejectedSignals = [];
  /** @type {string[]} */
  const warnings = [];

  const structuredKeys = new Set();

  function prov(byteOffset, endOffset, snippet) {
    return {
      sourcePath,
      sourceSha256,
      role,
      byteOffset,
      endOffset,
      snippet,
    };
  }

  // --- 1. Structured {path, method} OpenAPI-generator client ops ---
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
    const structuralKind = 'openapi_client_request';
    const id = evidenceId({
      category: EVIDENCE_CATEGORY.STRUCTURED_OPERATION,
      path: pathNormalized,
      method,
      discriminator: structuralKind,
    });

    structuredKeys.add(`${method}:${pathNormalized}`);

    items.push({
      id,
      category: EVIDENCE_CATEGORY.STRUCTURED_OPERATION,
      path: pathRaw,
      pathNormalized,
      method,
      apiFamily: apiFamilyFromPath(pathNormalized),
      provenance: [prov(m.index, callEnd, snippet)],
      request: meta,
      structuralKind,
    });
  }

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
    const structuralKind = 'openapi_client_request';
    items.push({
      id: evidenceId({
        category: EVIDENCE_CATEGORY.STRUCTURED_OPERATION,
        path: pathNormalized,
        method,
        discriminator: structuralKind,
      }),
      category: EVIDENCE_CATEGORY.STRUCTURED_OPERATION,
      path: pathRaw,
      pathNormalized,
      method,
      apiFamily: apiFamilyFromPath(pathNormalized),
      provenance: [prov(m.index, callEnd, snippetAround(text, m.index, callEnd))],
      request: extractRequestMeta(text, m.index, callEnd, pathRaw),
      structuralKind,
    });
    structuredKeys.add(`${method}:${pathNormalized}`);
  }

  extractRealtime(text, sourcePath, sourceSha256, role, items, warnings, prov);
  extractHosts(text, sourcePath, sourceSha256, role, items, rejectedSignals, prov);
  extractUrlTemplates(text, sourcePath, sourceSha256, role, items, structuredKeys, rejectedSignals, prov);
  extractApiStringLiterals(text, sourcePath, sourceSha256, role, items, structuredKeys, rejectedSignals, prov);

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
 * @param {(byteOffset: number, endOffset: number, snippet: string) => object} prov
 */
function extractRealtime(text, sourcePath, sourceSha256, role, items, warnings, prov) {
  const socketPostRe = /\.socket\.post\s*\(/g;
  let m;
  while ((m = socketPostRe.exec(text)) !== null) {
    const lookBehind = text.slice(Math.max(0, m.index - 250), m.index);
    const paths = [...lookBehind.matchAll(/["'](\/api\/[^"']*socket[^"']*)["']/g)].map((x) => x[1]);
    const uniquePaths = [...new Set(paths.map(normalizePath))];
    const callEnd = findMatchingParen(text, m.index + m[0].indexOf('('));
    const end = callEnd >= 0 ? callEnd + 1 : m.index + m[0].length;
    const kind = uniquePaths.length === 0 ? 'sails_socket_post_unresolved_path' : 'sails_socket_post';

    if (uniquePaths.length === 0) {
      items.push({
        id: evidenceId({
          category: EVIDENCE_CATEGORY.REALTIME_OPERATION,
          path: null,
          method: 'POST',
          discriminator: kind,
        }),
        category: EVIDENCE_CATEGORY.REALTIME_OPERATION,
        path: null,
        pathNormalized: null,
        method: 'POST',
        apiFamily: null,
        provenance: [prov(m.index, end, snippetAround(text, Math.max(0, m.index - 80), end))],
        structuralKind: kind,
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
          discriminator: 'sails_socket_post',
        }),
        category: EVIDENCE_CATEGORY.REALTIME_OPERATION,
        path: pathNormalized,
        pathNormalized,
        method: 'POST',
        apiFamily: apiFamilyFromPath(pathNormalized),
        provenance: [prov(m.index, end, snippetAround(text, Math.max(0, m.index - 120), end))],
        structuralKind: 'sails_socket_post',
      });
    }
  }

  const chatRe = /chat\s*:\s*\{\s*socket\s*:\s*\{\s*uri\s*:\s*(["'])(https?:\/\/[^"']+)\1/g;
  while ((m = chatRe.exec(text)) !== null) {
    const uri = m[2];
    items.push({
      id: evidenceId({
        category: EVIDENCE_CATEGORY.REALTIME_OPERATION,
        path: uri,
        method: null,
        discriminator: 'chat_socket_uri',
      }),
      category: EVIDENCE_CATEGORY.REALTIME_OPERATION,
      path: uri,
      pathNormalized: normalizePath(uri),
      method: null,
      apiFamily: null,
      provenance: [prov(m.index, m.index + m[0].length, snippetAround(text, m.index, m.index + m[0].length))],
      structuralKind: 'chat_socket_uri',
    });
  }
}

/**
 * Build a structured external/vendor reject record (never fetched as a chunk).
 * @param {string} raw
 * @param {string} sourcePath
 * @param {number} byteOffset
 */
function externalVendorReject(raw, sourcePath, byteOffset) {
  let host = null;
  try {
    host = new URL(raw.startsWith('http') ? raw : `https://${raw}`).host;
  } catch {
    const hm = raw.match(/https?:\/\/([^/'"?\s]+)/i);
    host = hm ? hm[1] : null;
  }
  return {
    raw: String(raw).slice(0, 300),
    reason: 'external_vendor_url',
    classification: 'out_of_build_root',
    whyNotFollowed: 'cross_origin_vendor_host',
    host,
    sourcePath,
    byteOffset,
    fetched: false,
    parserFailure: false,
  };
}

/**
 * @param {string} text
 * @param {string} sourcePath
 * @param {string} sourceSha256
 * @param {string} role
 * @param {EvidenceItem[]} items
 * @param {object[]} rejectedSignals
 * @param {(byteOffset: number, endOffset: number, snippet: string) => object} prov
 */
function extractHosts(text, sourcePath, sourceSha256, role, items, rejectedSignals, prov) {
  const hostRe = /https?:\/\/([a-z0-9.-]+\.(?:floatplane\.com|floatplane\.tv|keyos\.com|twitch\.tv))[/"]?/gi;
  let m;
  const seen = new Set();
  while ((m = hostRe.exec(text)) !== null) {
    const host = m[1].toLowerCase();
    if (seen.has(host)) continue;
    seen.add(host);

    if (isRejectedApiHost(host)) {
      rejectedSignals.push(externalVendorReject(m[0].replace(/["'/]+$/, ''), sourcePath, m.index));
      continue;
    }

    if (!hostMatchesSuffix(host, FLOATPLANE_HOST_SUFFIXES)) continue;

    let roleHint = 'host';
    if (host.startsWith('chat.')) roleHint = 'chat_socket';
    else if (host.startsWith('auth.')) roleHint = 'auth';
    else if (host.startsWith('apm.')) roleHint = 'apm';
    else if (host.startsWith('status.')) roleHint = 'status';
    else if (host.startsWith('frontend.')) roleHint = 'frontend_cdn';

    const kind = `host:${roleHint}`;
    items.push({
      id: evidenceId({
        category: EVIDENCE_CATEGORY.NETWORK_REFERENCE,
        path: `https://${host}`,
        method: null,
        discriminator: kind,
      }),
      category: EVIDENCE_CATEGORY.NETWORK_REFERENCE,
      path: `https://${host}`,
      pathNormalized: null,
      method: null,
      apiFamily: null,
      provenance: [prov(m.index, m.index + m[0].length, snippetAround(text, m.index, m.index + m[0].length))],
      structuralKind: kind,
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
 * @param {object[]} rejectedSignals
 * @param {(byteOffset: number, endOffset: number, snippet: string) => object} prov
 */
function extractUrlTemplates(text, sourcePath, sourceSha256, role, items, structuredKeys, rejectedSignals, prov) {
  const tmplRe = /`([^`]*\/api\/[^`]*)`/g;
  let m;
  while ((m = tmplRe.exec(text)) !== null) {
    const raw = m[1];
    const vendorUrl = raw.match(/https?:\/\/[a-z0-9.-]*(?:keyos\.com)[^\s`'"]*/i);
    if (vendorUrl) {
      rejectedSignals.push(externalVendorReject(vendorUrl[0], sourcePath, m.index));
      continue;
    }
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
          discriminator: 'template_literal_api',
        }),
        category: EVIDENCE_CATEGORY.AMBIGUOUS_REFERENCE,
        path: raw.slice(0, 200),
        pathNormalized: null,
        method: null,
        apiFamily: null,
        provenance: [prov(m.index, m.index + m[0].length, snippetAround(text, m.index, m.index + m[0].length))],
        structuralKind: 'template_literal_api',
      });
      continue;
    }
    const pathNormalized = normalizePath(pathPart.replace(/\$\{[^}]+\}/g, '{param}'));
    items.push({
      id: evidenceId({
        category: EVIDENCE_CATEGORY.URL_TEMPLATE,
        path: pathNormalized,
        method: null,
        discriminator: 'template_literal',
      }),
      category: EVIDENCE_CATEGORY.URL_TEMPLATE,
      path: pathPart,
      pathNormalized,
      method: null,
      apiFamily: apiFamilyFromPath(pathNormalized),
      provenance: [prov(m.index, m.index + m[0].length, snippetAround(text, m.index, m.index + m[0].length))],
      structuralKind: 'template_literal',
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
 * @param {object[]} rejectedSignals
 * @param {(byteOffset: number, endOffset: number, snippet: string) => object} prov
 */
function extractApiStringLiterals(text, sourcePath, sourceSha256, role, items, structuredKeys, rejectedSignals, prov) {
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
      rejectedSignals.push(externalVendorReject(raw, sourcePath, m.index));
      continue;
    }

    const behind = text.slice(Math.max(0, m.index - 12), m.index);
    if (/path\s*:\s*$/.test(behind)) {
      continue;
    }

    let pathNormalized;
    let category = EVIDENCE_CATEGORY.NETWORK_REFERENCE;
    let structuralKind = 'string_literal_api';

    if (/^https?:\/\//i.test(raw)) {
      try {
        const u = new URL(raw);
        if (isRejectedApiHost(u.host)) {
          rejectedSignals.push(externalVendorReject(raw, sourcePath, m.index));
          continue;
        }
        pathNormalized = normalizePath(u.pathname);
        if (!hostMatchesSuffix(u.host, FLOATPLANE_HOST_SUFFIXES)) {
          category = EVIDENCE_CATEGORY.AMBIGUOUS_REFERENCE;
          structuralKind = 'absolute_api_url_unknown_host';
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

    items.push({
      id: evidenceId({
        category,
        path: pathNormalized || raw.slice(0, 80),
        method: null,
        discriminator: structuralKind,
      }),
      category,
      path: raw,
      pathNormalized: pathNormalized || null,
      method: null,
      apiFamily: pathNormalized ? apiFamilyFromPath(pathNormalized) : null,
      provenance: [prov(m.index, m.index + m[0].length, snippetAround(text, m.index, m.index + m[0].length))],
      structuralKind,
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
  return /https?:\/\/[a-z0-9.-]*(?:keyos\.com|twitch\.tv)\b/i.test(raw);
}

/** @param {string} raw */
function extractPathFromTemplate(raw) {
  const idx = raw.indexOf('/api/');
  if (idx < 0) return null;
  let path = raw.slice(idx).split(/[\s'"]/)[0];
  path = path.replace(/[?,&#].*$/, (rest) => (rest.startsWith('?') ? '' : ''));
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
 * Merge by semantic id: one operation, multiple provenance locations.
 * @param {EvidenceItem[]} items
 */
export function dedupeAndSortEvidence(items) {
  const byId = new Map();
  for (const item of items) {
    const provList = item.provenance
      ? [...item.provenance]
      : item.source
        ? [
            {
              sourcePath: item.source.path,
              sourceSha256: item.source.sha256,
              role: item.source.role,
              byteOffset: item.source.byteOffset,
              endOffset: item.source.endOffset,
              snippet: item.source.snippet,
            },
          ]
        : [];

    if (!byId.has(item.id)) {
      const copy = { ...item, provenance: provList };
      delete copy.source;
      delete copy.structuralContext;
      if (!copy.structuralKind && item.structuralContext) {
        copy.structuralKind = item.structuralContext;
      }
      byId.set(item.id, copy);
      continue;
    }

    const existing = byId.get(item.id);
    for (const p of provList) {
      const dup = existing.provenance.some(
        (e) =>
          e.sourcePath === p.sourcePath &&
          e.byteOffset === p.byteOffset &&
          e.endOffset === p.endOffset,
      );
      if (!dup) existing.provenance.push(p);
    }
    // Prefer first non-empty request meta
    if (!existing.request && item.request) existing.request = item.request;
  }

  for (const item of byId.values()) {
    item.provenance.sort((a, b) => {
      if (a.sourcePath !== b.sourcePath) return a.sourcePath.localeCompare(b.sourcePath);
      return a.byteOffset - b.byteOffset;
    });
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

export function countStructuredOperations(items) {
  const keys = new Set();
  for (const item of items) {
    if (item.category !== EVIDENCE_CATEGORY.STRUCTURED_OPERATION) continue;
    if (!item.method || !item.pathNormalized) continue;
    keys.add(`${item.method}:${item.pathNormalized}`);
  }
  return keys.size;
}
