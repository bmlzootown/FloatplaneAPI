/**
 * Sanitize live API response bodies for durable sample storage + Fluxer alerts.
 *
 * Never retain tokens, emails, or other obvious PII. Truncate long strings /
 * arrays so samples stay reviewable and Discord-embed-friendly.
 *
 * Field-trees remain the structural source of truth; samples are optional
 * evidence for human-readable before/after alerts.
 */

/**
 * Max string length kept in a durable sanitized sample.
 * Keep ids/paths/titles intact; only clamp very long text bodies.
 */
export const MAX_SAMPLE_STRING = 4000;
/** Max array items retained at any level. */
export const MAX_SAMPLE_ARRAY = 4;
/** Soft JSON size for a full endpoint sample file. */
export const MAX_SAMPLE_JSON_CHARS = 48_000;
/** Max sibling keys kept when projecting a drift-focused fragment. */
export const MAX_FRAGMENT_SIBLINGS = 8;
/** Preferred creator for example content-post / content-creator samples. */
export const PREFERRED_CREATOR_ID = '59f94c0bdd241b70349eb72b'; // LinusTechTips
export const PREFERRED_CREATOR_LABEL = 'LinusTechTips';

/**
 * Deep-sanitize a JSON value for durable storage / alerts.
 * @param {unknown} value
 * @returns {unknown}
 */
export function sanitizeResponseBody(value) {
  const out = redactValue(value, '');
  const json = JSON.stringify(out);
  if (json && json.length > MAX_SAMPLE_JSON_CHARS) {
    return {
      _truncated: true,
      _originalChars: json.length,
      note: 'Sample truncated for size; field-tree remains authoritative.',
      preview: out,
    };
  }
  return out;
}

/**
 * Project a compact fragment around drifted paths from a sanitized body.
 * Used for Fluxer embeds (Discord field limits).
 *
 * @param {unknown} body sanitized or raw (will sanitize)
 * @param {{
 *   added?: string[],
 *   removed?: string[],
 *   typeChanged?: Array<string|{path?: string}>,
 * }} drift
 * @returns {object|null}
 */
export function projectDriftFragment(body, drift = {}) {
  if (body == null) return null;
  const sanitized = sanitizeResponseBody(body);
  if (sanitized == null || typeof sanitized !== 'object') return null;

  const paths = collectDriftPaths(drift);
  if (!paths.length) {
    return peekObject(sanitized, MAX_FRAGMENT_SIBLINGS);
  }

  // content-creator list responses are arrays — project first item.
  const isList = Array.isArray(sanitized);
  const rootObj = isList
    ? sanitized[0] && typeof sanitized[0] === 'object'
      ? sanitized[0]
      : null
    : sanitized;
  if (!rootObj || typeof rootObj !== 'object') {
    return peekObject(sanitized, MAX_FRAGMENT_SIBLINGS);
  }

  /** @type {Record<string, unknown>} */
  const frag = {};
  copyContextKeys(rootObj, frag);

  for (const path of paths.slice(0, 12)) {
    const norm = normalizePath(path);
    const val = getAtPath(rootObj, norm);
    if (val !== undefined) {
      setAtPath(frag, norm, cloneShallow(val));
    } else {
      // Ensure parent nest exists so removed fields can be restored beside it.
      ensureParentPath(frag, norm);
    }
    // Include a few scalar siblings on the immediate parent for context.
    const parentPath = parentOf(norm);
    const parentSrc = parentPath ? getAtPath(rootObj, parentPath) : rootObj;
    const parentDst = parentPath ? getAtPath(frag, parentPath) : frag;
    if (parentSrc && typeof parentSrc === 'object' && !Array.isArray(parentSrc) && parentDst) {
      ensureSiblingPeek(parentSrc, parentDst);
    }
  }

  if (isList) return { items: [frag] };
  return Object.keys(frag).length ? frag : peekObject(rootObj, MAX_FRAGMENT_SIBLINGS);
}

/**
 * Build a before-fragment when no prior capture sample exists:
 * start from the after body fragment and re-insert removed / prior-typed fields.
 *
 * Values for restored fields come from typeHints (never invented OpenAPI fields
 * beyond the observed drift paths).
 *
 * @param {unknown} afterBody
 * @param {{
 *   added?: string[],
 *   removed?: string[],
 *   typeChanged?: Array<{path?: string, from?: string|string[], to?: string|string[]}>,
 *   typeHints?: Record<string, string|string[]>,
 * }} drift
 */
export function reconstructBeforeFragment(afterBody, drift = {}) {
  const afterFrag = projectDriftFragment(afterBody, drift);
  if (!afterFrag) return null;
  const before = structuredClone(afterFrag);
  const root = before.items && typeof before.items[0] === 'object' ? before.items[0] : before;
  if (!root || typeof root !== 'object') return before;

  // Group removed `foo.bar[].leaf` paths into array-item reconstructions.
  /** @type {Map<string, string[]>} */
  const arrayItemFields = new Map();
  /** @type {string[]} */
  const scalarRemoved = [];

  for (const path of drift.removed || []) {
    if (!path || path === '$') continue;
    const m = String(path).match(/^(.*)\[\]\.(.+)$/);
    if (m) {
      const arrayPath = normalizePath(m[1]);
      const leaf = m[2];
      if (!arrayItemFields.has(arrayPath)) arrayItemFields.set(arrayPath, []);
      arrayItemFields.get(arrayPath).push(leaf);
      // Keep type hint keyed by original path for leaf typing.
      continue;
    }
    scalarRemoved.push(path);
  }

  for (const [arrayPath, leaves] of arrayItemFields) {
    /** @type {Record<string, unknown>} */
    const item = {};
    for (const leaf of leaves) {
      const full = `${arrayPath}[].${leaf}`;
      // typeHints may use either dotted form
      const hint =
        drift.typeHints?.[full] ||
        drift.typeHints?.[`${arrayPath}.${leaf}`] ||
        drift.typeHints?.[leaf];
      item[leaf] = placeholderForType(full, hint);
    }
    setAtPath(root, arrayPath, [item]);
  }

  for (const path of scalarRemoved) {
    setAtPath(root, normalizePath(path), placeholderForType(path, drift.typeHints?.[path]));
  }

  for (const t of drift.typeChanged || []) {
    const path = typeof t === 'string' ? t : t?.path;
    if (!path || path === '$') continue;
    const arrayPath = normalizePath(String(path).replace(/\[\]$/, ''));
    // If we already rebuilt the array from removed child paths, skip.
    if (arrayItemFields.has(arrayPath)) continue;
    const fromType = typeof t === 'object' ? t.from : drift.typeHints?.[`${path}__from`];
    if (String(path).endsWith('[]') && normalizeType(fromType) === 'object') {
      setAtPath(root, arrayPath, [{}]);
    } else if (!String(path).includes('[]')) {
      setAtPath(root, normalizePath(path), placeholderForType(path, fromType || 'string'));
    }
  }

  return before;
}

/**
 * Prefer LinusTechTips when present among subscribed creator ids.
 * @param {string[]} creatorIds
 * @param {string} [preferredId]
 * @returns {string[]}
 */
export function orderCreatorIdsPreferPreferred(creatorIds, preferredId = PREFERRED_CREATOR_ID) {
  const ids = [...new Set((creatorIds || []).filter(Boolean))];
  if (!preferredId || !ids.includes(preferredId)) return ids;
  return [preferredId, ...ids.filter((id) => id !== preferredId)];
}

/**
 * True when a content body looks like LinusTechTips (id or title/urlname).
 * @param {unknown} body content-post object or content-creator list
 */
export function bodyLooksLikePreferredCreator(body, preferredId = PREFERRED_CREATOR_ID) {
  if (!body || typeof body !== 'object') return false;
  const items = Array.isArray(body) ? body : body.blogPosts || body.posts || body.items || [body];
  for (const item of items.slice(0, 3)) {
    if (!item || typeof item !== 'object') continue;
    const creator = item.creator;
    if (typeof creator === 'string' && creator === preferredId) return true;
    if (creator && typeof creator === 'object') {
      if (creator.id === preferredId) return true;
      const title = String(creator.title || creator.urlname || '').toLowerCase();
      if (title.includes('linustechtips') || title === 'ltt') return true;
    }
    if (item.channel?.creator === preferredId) return true;
  }
  return false;
}

function redactValue(value, path) {
  if (value == null) return null;
  if (Array.isArray(value)) {
    return value.slice(0, MAX_SAMPLE_ARRAY).map((v, i) => redactValue(v, `${path}[${i}]`));
  }
  if (typeof value === 'object') {
    /** @type {Record<string, unknown>} */
    const out = {};
    for (const [k, v] of Object.entries(value)) {
      const child = path ? `${path}.${k}` : k;
      if (isSensitiveKey(k)) {
        out[k] = typeof v === 'string' ? '[redacted]' : redactSensitiveShape(v);
        continue;
      }
      out[k] = redactValue(v, child);
    }
    return out;
  }
  if (typeof value === 'string') {
    if (looksLikeToken(value)) return '[redacted]';
    if (looksLikeEmail(value)) return '[redacted-email]';
    // Explicit clamp only for very long prose — never mid-cut short ids/paths.
    if (value.length > MAX_SAMPLE_STRING) {
      return `${value.slice(0, MAX_SAMPLE_STRING)}[truncated]`;
    }
    return value;
  }
  if (typeof value === 'number' || typeof value === 'boolean') return value;
  return String(value);
}

function redactSensitiveShape(v) {
  if (v == null) return '[redacted]';
  if (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean') return '[redacted]';
  if (Array.isArray(v)) return ['[redacted]'];
  return { redacted: true };
}

function isSensitiveKey(key) {
  const k = String(key).toLowerCase();
  return (
    k.includes('token') ||
    k.includes('secret') ||
    k.includes('password') ||
    k.includes('authorization') ||
    k.includes('cookie') ||
    k === 'email' ||
    k === 'ip' ||
    k.endsWith('email') ||
    k.includes('refresh') ||
    k.includes('dpop') ||
    k === 'ssn' ||
    k.includes('phone')
  );
}

function looksLikeToken(s) {
  if (s.startsWith('eyJ')) return true;
  if (/^[A-Za-z0-9_-]{40,}$/.test(s)) return true;
  return false;
}

function looksLikeEmail(s) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}

function collectDriftPaths(drift) {
  const out = [];
  for (const p of drift.removed || []) if (p) out.push(String(p));
  for (const p of drift.added || []) if (p) out.push(String(p));
  for (const t of drift.typeChanged || []) {
    const p = typeof t === 'string' ? t : t?.path;
    if (p) out.push(String(p));
  }
  return out;
}

function normalizePath(path) {
  return String(path)
    .replace(/^\$\[\]\./, '')
    .replace(/^\$\./, '')
    .replace(/^\$/, '')
    .replace(/\[\]/g, '');
}

function parentOf(path) {
  const parts = splitPath(path);
  if (parts.length < 2) return '';
  return parts.slice(0, -1).join('.');
}

function getAtPath(root, path) {
  const parts = splitPath(path);
  let cur = root;
  for (const p of parts) {
    if (cur == null) return undefined;
    if (Array.isArray(cur)) {
      cur = cur[0];
      if (cur == null) return undefined;
      // Fall through to treat `p` as key on first element when path had [].
    }
    if (typeof cur !== 'object') return undefined;
    if (!(p in cur) && Array.isArray(cur[p])) {
      cur = cur[p];
      continue;
    }
    if (!(p in cur)) return undefined;
    cur = cur[p];
  }
  return cur;
}

function ensureParentPath(root, path) {
  const parts = splitPath(path);
  if (parts.length < 2) return;
  let cur = root;
  for (let i = 0; i < parts.length - 1; i++) {
    const p = parts[i];
    if (cur[p] == null || typeof cur[p] !== 'object' || Array.isArray(cur[p])) {
      cur[p] = {};
    }
    cur = cur[p];
  }
}

function ensureSiblingPeek(srcObj, dstObj) {
  const keys = Object.keys(srcObj);
  let n = 0;
  for (const k of keys) {
    if (k in dstObj) continue;
    if (isSensitiveKey(k)) continue;
    const v = srcObj[k];
    if (v != null && typeof v === 'object') continue;
    dstObj[k] = cloneShallow(v);
    n += 1;
    if (n >= 3) break;
  }
}

function copyContextKeys(source, out) {
  if (!source || typeof source !== 'object' || Array.isArray(source)) return;
  for (const k of ['id', 'guid', 'title', 'type', 'urlname']) {
    if (source[k] != null && !(k in out)) out[k] = cloneShallow(source[k]);
  }
}

function peekObject(value, maxKeys) {
  if (Array.isArray(value)) {
    return { items: value.slice(0, 1).map((v) => peekObject(v, maxKeys)) };
  }
  if (!value || typeof value !== 'object') return value;
  /** @type {Record<string, unknown>} */
  const out = {};
  let n = 0;
  for (const [k, v] of Object.entries(value)) {
    if (isSensitiveKey(k)) continue;
    out[k] = cloneShallow(v);
    n += 1;
    if (n >= maxKeys) break;
  }
  return out;
}

function cloneShallow(v) {
  if (v == null) return null;
  if (Array.isArray(v)) {
    return v.slice(0, MAX_SAMPLE_ARRAY).map((x) => {
      if (x != null && typeof x === 'object' && !Array.isArray(x)) {
        return peekObject(x, MAX_FRAGMENT_SIBLINGS);
      }
      if (typeof x === 'string' && x.length > MAX_SAMPLE_STRING) {
        return `${x.slice(0, MAX_SAMPLE_STRING)}[truncated]`;
      }
      return x;
    });
  }
  if (typeof v === 'object') return peekObject(v, MAX_FRAGMENT_SIBLINGS);
  if (typeof v === 'string' && v.length > MAX_SAMPLE_STRING) {
    return `${v.slice(0, MAX_SAMPLE_STRING)}[truncated]`;
  }
  return v;
}

function splitPath(path) {
  return String(path)
    .replace(/\[\]/g, '')
    .split('.')
    .map((p) => p.trim())
    .filter((p) => p && p !== '$');
}

/**
 * @param {object} root
 * @param {string} path
 * @param {unknown} value
 */
export function setAtPath(root, path, value) {
  const parts = splitPath(path);
  if (!parts.length) return;
  let cur = root;
  for (let i = 0; i < parts.length - 1; i++) {
    const p = parts[i];
    if (cur[p] == null || typeof cur[p] !== 'object' || Array.isArray(cur[p])) {
      cur[p] = {};
    }
    cur = cur[p];
  }
  cur[parts[parts.length - 1]] = value;
}

function placeholderForType(path, typeHint) {
  const t = normalizeType(typeHint);
  if (t === 'boolean') return true;
  if (t === 'number') return 0;
  if (t === 'null') return null;
  if (t === 'array') return [];
  if (t === 'object') return {};
  const leaf = String(path).split('.').pop() || '';
  if (/^(is|has|can|discoverable|visible|enabled|active)/i.test(leaf)) return true;
  if (/count|order|index|height|width|size|duration/i.test(leaf)) return 0;
  if (/path|url|src/i.test(leaf)) return '[prior path]';
  // Explicit prior-value marker for reconstructed before-fragments — not truncation.
  return '[prior]';
}

function normalizeType(typeHint) {
  if (Array.isArray(typeHint)) {
    const nonNull = typeHint.map(String).filter((x) => x !== 'null');
    return nonNull[0] || String(typeHint[0] || 'string');
  }
  if (typeHint == null) return 'string';
  return String(typeHint);
}
