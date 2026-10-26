/**
 * Build focused before → after JSON snippets for shape-drift Fluxer alerts.
 *
 * Prefer real sanitized live samples when present on the endpoint summary
 * (`sampleBefore` / `sampleAfter` from canary captures). Otherwise synthesize
 * a minimal illustrative fragment from field paths.
 *
 * Never silently ellipsize mid-JSON. If a body exceeds one Discord field
 * (~1024), split into sequential fields with explicit "continued" labels.
 */

import { MAX_FIELD_VALUE, MAX_EMBED_TITLE } from './constants.mjs';
import { truncate } from './truncate.mjs';

/** Max paths to fold into one before/after fragment */
export const MAX_SNIPPET_PATHS = 6;

/** Overhead for ```json fences around a chunk */
const JSON_FENCE_OVERHEAD = '```json\n'.length + '\n```'.length;
/** Reserve for an optional footnote line under the fence */
const FOOTNOTE_RESERVE = 48;

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
        markdown: formatBeforeAfterMarkdown({ before, after, label }),
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
 * Legacy single-field formatter (may still truncate markdown for tiny previews).
 * Prefer {@link formatBeforeAfterFields}.
 * @param {object|null|undefined} ep
 */
export function formatBeforeAfterField(ep) {
  const fields = formatBeforeAfterFields(ep);
  if (!fields.length) return '';
  return fields.map((f) => `**${f.name}**\n${f.value}`).join('\n');
}

/**
 * Embed fields for before/after.
 *
 * - Full sanitized JSON is preserved (no mid-JSON `…`).
 * - If both sides fit in one field each → consecutive `inline: true` (side-by-side).
 * - If either side needs multiple chunks → full-width sequential fields
 *   named `Before (live sanitized) 1/2`, `… 2/2`, with `_continued_` notes.
 *
 * @param {object|null|undefined} ep
 * @returns {{ name: string, value: string, inline: boolean }[]}
 */
export function formatBeforeAfterFields(ep) {
  const built = buildBeforeAfter(ep);
  if (built.source === 'none') return [];

  const live = built.source === 'capture';
  const beforeLabel = live ? 'Before (live sanitized)' : 'Before (illustrative)';
  const afterLabel = live ? 'After (live sanitized)' : 'After (illustrative)';
  const footnote = live ? '' : '_Illustrative — field-trees only_';

  const beforeFields = built.before != null
    ? jsonValueToFields(built.before, beforeLabel, footnote)
    : [];
  const afterFields = built.after != null
    ? jsonValueToFields(built.after, afterLabel, footnote)
    : [];

  const sideBySide =
    beforeFields.length === 1 &&
    afterFields.length === 1;

  if (sideBySide) {
    return [
      { ...beforeFields[0], inline: true },
      { ...afterFields[0], inline: true },
    ];
  }

  // Multi-chunk: keep full-width so continued parts stay readable.
  return [
    ...beforeFields.map((f) => ({ ...f, inline: false })),
    ...afterFields.map((f) => ({ ...f, inline: false })),
  ];
}

/**
 * Split a JSON value into one or more embed fields without silent truncation.
 * @param {unknown} value
 * @param {string} baseName
 * @param {string} [footnote]
 * @returns {{ name: string, value: string, inline: boolean }[]}
 */
export function jsonValueToFields(value, baseName, footnote = '') {
  const jsonText = JSON.stringify(value, null, 2);
  const footnoteLen = footnote ? footnote.length + 1 : 0;
  const maxInner = MAX_FIELD_VALUE - JSON_FENCE_OVERHEAD - Math.max(footnoteLen, FOOTNOTE_RESERVE);
  const chunks = splitTextPreserveLines(jsonText, Math.max(64, maxInner));
  const total = chunks.length;

  return chunks.map((chunk, i) => {
    const name =
      total === 1
        ? baseName
        : `${baseName} ${i + 1}/${total}`;
    const parts = ['```json', chunk, '```'];
    if (total > 1 && i < total - 1) {
      parts.push('_continued_');
    } else if (footnote) {
      parts.push(footnote);
    }
    const valueStr = parts.join('\n');
    // Hard Discord cap: never exceed; splitTextPreserveLines should prevent this.
    if (valueStr.length > MAX_FIELD_VALUE) {
      // Last resort: drop footnote/continued and keep fences + as much JSON as fits,
      // but still mark continued explicitly if we had to cut (should be rare).
      const hard = ['```json', chunk.slice(0, maxInner), '```', '_continued_'].join('\n');
      return {
        name: truncate(name, MAX_EMBED_TITLE),
        value: hard.slice(0, MAX_FIELD_VALUE),
        inline: false,
      };
    }
    return {
      name: truncate(name, MAX_EMBED_TITLE),
      value: valueStr,
      inline: false,
    };
  });
}

/**
 * Split text into chunks ≤ maxChars, preferring newline boundaries.
 * Never inserts `…` into the content; continuation is signaled by field names.
 * @param {string} text
 * @param {number} maxChars
 * @returns {string[]}
 */
export function splitTextPreserveLines(text, maxChars) {
  if (!text) return [''];
  if (text.length <= maxChars) return [text];

  const lines = text.split('\n');
  /** @type {string[]} */
  const chunks = [];
  /** @type {string[]} */
  let cur = [];
  let curLen = 0;

  const flush = () => {
    if (!cur.length) return;
    chunks.push(cur.join('\n'));
    cur = [];
    curLen = 0;
  };

  for (const line of lines) {
    if (line.length > maxChars) {
      // Extremely long single line: split explicitly (no ellipsis in content).
      flush();
      for (let i = 0; i < line.length; i += maxChars) {
        chunks.push(line.slice(i, i + maxChars));
      }
      continue;
    }
    const nextLen = cur.length === 0 ? line.length : curLen + 1 + line.length;
    if (cur.length && nextLen > maxChars) {
      flush();
    }
    cur.push(line);
    curLen = cur.join('\n').length;
  }
  flush();
  return chunks.length ? chunks : [''];
}

/**
 * @param {{
 *   before?: object|null,
 *   after?: object|null,
 *   label: string,
 * }} opts
 */
export function formatBeforeAfterMarkdown(opts) {
  const lines = [`**${opts.label}**`];
  if (opts.before != null) {
    lines.push('**Before**');
    lines.push('```json');
    lines.push(JSON.stringify(opts.before, null, 2));
    lines.push('```');
  }
  if (opts.after != null) {
    lines.push('**After**');
    lines.push('```json');
    lines.push(JSON.stringify(opts.after, null, 2));
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

function emptyResult() {
  return {
    source: 'none',
    label: '',
    before: null,
    after: null,
    markdown: '',
  };
}

/**
 * Redact secrets / PII; do **not** mid-string-truncate ordinary values
 * (ids, paths, titles stay intact for display samples).
 * @param {unknown} value
 */
export function sanitizeSample(value) {
  if (value == null) return null;
  return redactValue(value);
}

function redactValue(value) {
  if (value == null) return null;
  if (Array.isArray(value)) {
    return value.map((v) => redactValue(v));
  }
  if (typeof value === 'object') {
    /** @type {Record<string, unknown>} */
    const out = {};
    for (const [k, v] of Object.entries(value)) {
      if (isSensitiveKey(k)) {
        out[k] = typeof v === 'string' ? '[redacted]' : redactSensitiveShape(v);
        continue;
      }
      out[k] = redactValue(v);
    }
    return out;
  }
  if (typeof value === 'string') {
    if (looksLikeToken(value)) return '[redacted]';
    if (looksLikeEmail(value)) return '[redacted-email]';
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
    k.includes('dpop')
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
  const leaf = String(path).split('.').pop() || '';
  if (/^(is|has|can|discoverable|visible|enabled|active)/i.test(leaf)) return true;
  if (/count|order|index|height|width|size|duration/i.test(leaf)) return 0;
  if (/path|url|src/i.test(leaf)) return '[prior path]';
  // Explicit prior-value marker — never a mid-string ellipsis.
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
