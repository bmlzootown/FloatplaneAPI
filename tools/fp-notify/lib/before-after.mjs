/**
 * Build focused before → after JSON snippets for shape-drift Fluxer alerts.
 *
 * Prefer real sanitized live samples when present on the endpoint summary
 * (`sampleBefore` / `sampleAfter` from canary captures). Otherwise synthesize
 * a minimal illustrative fragment from field paths.
 */

import { MAX_FIELD_VALUE } from './constants.mjs';
import { truncate } from './truncate.mjs';

/** Max paths to fold into one before/after fragment */
export const MAX_SNIPPET_PATHS = 6;
/** Soft cap for illustrative JSON pretty-print inside one embed field */
export const MAX_SNIPPET_JSON_CHARS = 420;
/** Larger cap when showing live sanitized capture bodies (still fits Discord field). */
export const MAX_LIVE_JSON_CHARS = 780;

/**
 * @param {object|null|undefined} ep endpoint drift summary
 * @returns {{
 *   source: 'capture'|'illustrative'|'none',
 *   label: string,
 *   before: object|null,
 *   after: object|null,
 *   markdown: string,
 * }}
 */
export function buildBeforeAfter(ep) {
  if (!ep) {
    return emptyResult();
  }

  if (ep.sampleBefore != null || ep.sampleAfter != null) {
    const before = sanitizeSample(ep.sampleBefore);
    const after = sanitizeSample(ep.sampleAfter);
    if (before != null || after != null) {
      const label = 'Before → after (live sanitized response)';
      return {
        source: 'capture',
        label,
        before: before ?? null,
        after: after ?? null,
        markdown: formatBeforeAfterMarkdown({
          before,
          after,
          label,
          maxJsonChars: MAX_LIVE_JSON_CHARS,
        }),
      };
    }
  }

  const added = asPathArray(ep.added);
  const removed = asPathArray(ep.removed);
  const typeChanged = asTypeChangedArray(ep.typeChanged);
  if (!added.length && !removed.length && !typeChanged.length) {
    return emptyResult();
  }

  const typeHints = { ...(ep.typeHints || {}) };
  for (const t of typeChanged) {
    if (typeof t === 'object' && t?.path) {
      if (t.from != null) typeHints[`${t.path}__from`] = t.from;
      if (t.to != null) typeHints[`${t.path}__to`] = t.to;
      if (t.to != null) typeHints[t.path] = t.to;
    }
  }

  const before = {};
  const after = {};
  let pathCount = 0;

  for (const path of removed) {
    if (pathCount >= MAX_SNIPPET_PATHS) break;
    if (path === '$') continue;
    setAtPath(before, path, placeholderFor(path, typeHints[path] || 'boolean'));
    pathCount += 1;
  }
  for (const path of added) {
    if (pathCount >= MAX_SNIPPET_PATHS) break;
    if (path === '$') continue;
    setAtPath(after, path, placeholderFor(path, typeHints[path] || 'string'));
    pathCount += 1;
  }
  for (const t of typeChanged) {
    if (pathCount >= MAX_SNIPPET_PATHS) break;
    const path = typeof t === 'string' ? t : t?.path;
    if (!path || path === '$') continue;
    const fromType = typeof t === 'object' ? t.from : typeHints[`${path}__from`];
    const toType = typeof t === 'object' ? t.to : typeHints[`${path}__to`] || typeHints[path];
    setAtPath(before, path, placeholderFor(path, fromType || 'string'));
    setAtPath(after, path, placeholderFor(path, toType || 'string'));
    pathCount += 1;
  }

  // Keep parent object present on the side that lost keys so the nest is visible.
  ensureParents(before, [...removed, ...typeChanged.map((t) => (typeof t === 'string' ? t : t?.path)).filter(Boolean)]);
  ensureParents(after, [...added, ...removed, ...typeChanged.map((t) => (typeof t === 'string' ? t : t?.path)).filter(Boolean)]);

  if (!Object.keys(before).length && !Object.keys(after).length) {
    return emptyResult();
  }

  return {
    source: 'illustrative',
    label: 'Before → after (illustrative; field-trees only — not a live body)',
    before: Object.keys(before).length ? before : null,
    after: Object.keys(after).length ? after : null,
    markdown: formatBeforeAfterMarkdown({
      before: Object.keys(before).length ? before : null,
      after: Object.keys(after).length ? after : null,
      label: 'Before → after (illustrative; field-trees only — not a live body)',
    }),
  };
}

/**
 * Discord embed field value for before/after (truncated to field limit).
 * Prefer {@link formatBeforeAfterFields} when posting embeds so live samples
 * can use separate Before/After fields within Discord caps.
 * @param {object|null|undefined} ep
 */
export function formatBeforeAfterField(ep) {
  const built = buildBeforeAfter(ep);
  if (built.source === 'none') return '';
  return truncate(built.markdown, MAX_FIELD_VALUE);
}

/**
 * Embed fields for before/after. Live samples get separate Before/After fields
 * so more of the sanitized body fits under Discord's 1024-char field cap.
 * @param {object|null|undefined} ep
 * @returns {{ name: string, value: string, inline: boolean }[]}
 */
export function formatBeforeAfterFields(ep) {
  const built = buildBeforeAfter(ep);
  if (built.source === 'none') return [];

  if (built.source === 'capture' && (built.before != null || built.after != null)) {
    /** @type {{ name: string, value: string, inline: boolean }[]} */
    const fields = [];
    const cap = MAX_LIVE_JSON_CHARS;
    if (built.before != null) {
      fields.push({
        name: 'Before (live sanitized)',
        value: truncJsonField(built.before, cap),
        inline: false,
      });
    }
    if (built.after != null) {
      fields.push({
        name: 'After (live sanitized)',
        value: truncJsonField(built.after, cap),
        inline: false,
      });
    }
    return fields;
  }

  return [
    {
      name: 'Example response fragment',
      value: truncate(built.markdown, MAX_FIELD_VALUE),
      inline: false,
    },
  ];
}

/**
 * @param {{
 *   before?: object|null,
 *   after?: object|null,
 *   label: string,
 *   maxJsonChars?: number,
 * }} opts
 */
export function formatBeforeAfterMarkdown(opts) {
  const maxJson = opts.maxJsonChars ?? MAX_SNIPPET_JSON_CHARS;
  const lines = [`**${opts.label}**`];
  if (opts.before != null) {
    lines.push('**Before**');
    lines.push('```json');
    lines.push(prettyJson(opts.before, maxJson));
    lines.push('```');
  }
  if (opts.after != null) {
    lines.push('**After**');
    lines.push('```json');
    lines.push(prettyJson(opts.after, maxJson));
    lines.push('```');
  }
  if (opts.before != null && opts.after == null) {
    lines.push('_Field(s) no longer present in the observed response._');
  }
  if (opts.before == null && opts.after != null) {
    lines.push('_Field(s) newly observed in the response._');
  }
  return lines.join('\n');
}

function truncJsonField(value, maxJson) {
  const body = ['```json', prettyJson(value, maxJson), '```'].join('\n');
  return truncate(body, MAX_FIELD_VALUE);
}

function emptyResult() {
  return {
    source: 'none',
    label: '',
    before: null,
    after: null,
    markdown: '',
  };
}

function prettyJson(value, maxChars = MAX_SNIPPET_JSON_CHARS) {
  let s = JSON.stringify(value, null, 2);
  if (s.length > maxChars) {
    s = `${s.slice(0, maxChars - 1)}…`;
  }
  return s;
}

/**
 * Redact obvious secrets / PII-ish keys recursively; keep structure.
 * @param {unknown} value
 */
export function sanitizeSample(value) {
  if (value == null) return null;
  return redactValue(value, '');
}

function redactValue(value, path) {
  if (value == null) return null;
  if (Array.isArray(value)) {
    return value.slice(0, 3).map((v, i) => redactValue(v, `${path}[${i}]`));
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
    if (value.length > 80) return `${value.slice(0, 77)}…`;
    return value;
  }
  if (typeof value === 'number' || typeof value === 'boolean') return value;
  return String(value);
}

function redactSensitiveShape(v) {
  if (v == null) return '[redacted]';
  if (typeof v === 'string') return '[redacted]';
  if (typeof v === 'number' || typeof v === 'boolean') return '[redacted]';
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
    k.includes('dpop')
  );
}

function looksLikeToken(s) {
  if (s.startsWith('eyJ')) return true; // JWT
  if (/^[A-Za-z0-9_-]{40,}$/.test(s)) return true;
  return false;
}

/**
 * @param {object} root
 * @param {string} path dotted path; `[]` segments ignored for object nests
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

function ensureParents(root, paths) {
  for (const path of paths) {
    if (!path || path === '$') continue;
    const parts = splitPath(path);
    if (parts.length < 2) continue;
    let cur = root;
    for (let i = 0; i < parts.length - 1; i++) {
      const p = parts[i];
      if (cur[p] == null || typeof cur[p] !== 'object' || Array.isArray(cur[p])) {
        cur[p] = {};
      }
      cur = cur[p];
    }
  }
}

function splitPath(path) {
  return String(path)
    .replace(/\[\]/g, '')
    .split('.')
    .map((p) => p.trim())
    .filter((p) => p && p !== '$');
}

/**
 * @param {string} path
 * @param {string|string[]|undefined} typeHint
 */
export function placeholderFor(path, typeHint) {
  const t = normalizeType(typeHint);
  if (t === 'boolean') return true;
  if (t === 'number') return 0;
  if (t === 'null') return null;
  if (t === 'array') return [];
  if (t === 'object') return {};
  // Mild name heuristics when type unknown (still illustrative placeholders).
  const leaf = String(path).split('.').pop() || '';
  if (/^(is|has|can|discoverable|visible|enabled|active)/i.test(leaf)) return true;
  if (/count|order|index|height|width|size|duration/i.test(leaf)) return 0;
  return '…';
}

function normalizeType(typeHint) {
  if (Array.isArray(typeHint)) {
    const nonNull = typeHint.map(String).filter((x) => x !== 'null');
    return nonNull[0] || String(typeHint[0] || 'string');
  }
  if (typeHint == null) return 'string';
  return String(typeHint);
}

function asPathArray(v) {
  if (!v) return [];
  if (Array.isArray(v)) {
    if (!v.length) return [];
    if (typeof v[0] === 'string') return v;
    return v.map((x) => (typeof x === 'string' ? x : x?.path || JSON.stringify(x)));
  }
  if (typeof v === 'number') return [];
  return [];
}

function asTypeChangedArray(v) {
  if (!v) return [];
  if (Array.isArray(v)) return v;
  return [];
}
