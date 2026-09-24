/**
 * Stable change IDs for Phase 2.2 (§9).
 *
 * Based on semantic facts only — never buildId, timestamp, chunk filename, or offset.
 */

import { normalizeMethod, normalizePath } from '../normalize.mjs';
import { CHANGE_CATEGORY } from './constants.mjs';

/**
 * @param {{
 *   category: string,
 *   evidenceCategory?: string | null,
 *   path?: string | null,
 *   method?: string | null,
 *   methodsBefore?: string[] | null,
 *   methodsAfter?: string[] | null,
 *   property?: string | null,
 *   evidenceId?: string | null,
 * }} parts
 * @returns {string}
 */
export function changeId(parts) {
  const cat = parts.category || 'unknown';
  const evCat = parts.evidenceCategory || '-';
  const pathPart =
    parts.path != null && parts.path !== ''
      ? normalizePath(parts.path)
      : '-';

  if (cat === CHANGE_CATEGORY.METHOD_SET_CHANGED) {
    const before = normalizeMethodSet(parts.methodsBefore);
    const after = normalizeMethodSet(parts.methodsAfter);
    return `chg:${cat}:${pathPart}:${before}->${after}`;
  }

  if (
    cat === CHANGE_CATEGORY.REQUEST_CONSTRUCTION_CHANGED ||
    cat === CHANGE_CATEGORY.AUTH_EVIDENCE_CHANGED ||
    cat === CHANGE_CATEGORY.RESPONSE_MAPPER_CHANGED
  ) {
    const method = normalizeMethod(parts.method) || '-';
    const prop = parts.property || '-';
    return `chg:${cat}:${evCat}:${method}:${pathPart}:${prop}`;
  }

  if (cat === CHANGE_CATEGORY.PROVENANCE_MOVED) {
    const id = parts.evidenceId || `${evCat}:${normalizeMethod(parts.method) || '-'}:${pathPart}`;
    return `chg:${cat}:${id}`;
  }

  // added / disappeared / weak / realtime — key by evidence id when available
  if (parts.evidenceId) {
    return `chg:${cat}:${parts.evidenceId}`;
  }

  const method = normalizeMethod(parts.method) || '-';
  return `chg:${cat}:${evCat}:${method}:${pathPart}`;
}

/**
 * @param {string[] | null | undefined} methods
 * @returns {string}
 */
export function normalizeMethodSet(methods) {
  if (!methods || methods.length === 0) return '-';
  return [...new Set(methods.map((m) => normalizeMethod(m) || String(m).toUpperCase()))]
    .sort()
    .join('|');
}
