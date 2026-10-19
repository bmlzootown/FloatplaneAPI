/**
 * Discord/Fluxer size helpers — keep payloads short.
 */

import {
  MAX_CONTENT,
  MAX_EMBED_DESCRIPTION,
  MAX_EMBED_TITLE,
  MAX_FIELD_VALUE,
} from './constants.mjs';

/**
 * @param {string} text
 * @param {number} max
 */
export function truncate(text, max) {
  const s = text == null ? '' : String(text);
  if (s.length <= max) return s;
  if (max <= 1) return '…';
  return `${s.slice(0, max - 1)}…`;
}

export function truncContent(s) {
  return truncate(s, MAX_CONTENT);
}

export function truncTitle(s) {
  return truncate(s, MAX_EMBED_TITLE);
}

export function truncDescription(s) {
  return truncate(s, MAX_EMBED_DESCRIPTION);
}

export function truncField(s) {
  return truncate(s, MAX_FIELD_VALUE);
}

/**
 * Format a capped bullet list of paths with remaining count.
 * @param {string[]} paths
 * @param {number} max
 * @param {string} [prefix]
 */
export function formatPathList(paths, max, prefix = '') {
  const list = paths || [];
  if (!list.length) return '';
  const shown = list.slice(0, max);
  const lines = shown.map((p) => `${prefix}\`${p}\``);
  const rest = list.length - shown.length;
  if (rest > 0) lines.push(`… +${rest} more`);
  return lines.join('\n');
}
