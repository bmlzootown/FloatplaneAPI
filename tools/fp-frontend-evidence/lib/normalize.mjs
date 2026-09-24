/**
 * Light deterministic normalization for evidence identity.
 * No aggressive AST erase; no AI.
 */

const HTTP_METHODS = new Set([
  'GET',
  'POST',
  'PUT',
  'PATCH',
  'DELETE',
  'HEAD',
  'OPTIONS',
]);

/**
 * Normalize HTTP method for identity. Returns null if not a known method.
 * @param {string | null | undefined} method
 * @returns {string | null}
 */
export function normalizeMethod(method) {
  if (method == null || method === '') return null;
  const m = String(method).trim().toUpperCase();
  return HTTP_METHODS.has(m) ? m : null;
}

/**
 * Normalize a path template for identity comparison.
 * - Ensure leading slash
 * - Decode trivial percent-escapes of unreserved chars
 * - Collapse duplicate slashes (except protocol — paths only)
 * - Strip trailing slash except for root
 * - Keep `{param}` / `:param` style templates as-is (after slash normalize)
 * - Do NOT strip query string keys into the path; callers should split
 *
 * @param {string} path
 * @returns {string}
 */
export function normalizePath(path) {
  let p = String(path).trim();
  if (!p) return '/';

  // Absolute URLs → pathname (+ keep path templates)
  if (/^https?:\/\//i.test(p)) {
    try {
      const u = new URL(p);
      p = u.pathname || '/';
    } catch {
      // fall through
    }
  }

  // Strip fragment / query from path identity
  const q = p.indexOf('?');
  if (q >= 0) p = p.slice(0, q);
  const h = p.indexOf('#');
  if (h >= 0) p = p.slice(0, h);

  if (!p.startsWith('/')) p = `/${p}`;

  // Decode trivial escapes (%2F stays encoded to avoid changing structure)
  p = p.replace(/%([0-9A-Fa-f]{2})/g, (full, hex) => {
    const code = parseInt(hex, 16);
    // Decode unreserved / common safe chars only
    if (
      (code >= 0x41 && code <= 0x5a) || // A-Z
      (code >= 0x61 && code <= 0x7a) || // a-z
      (code >= 0x30 && code <= 0x39) || // 0-9
      code === 0x2d || // -
      code === 0x2e || // .
      code === 0x5f || // _
      code === 0x7e // ~
    ) {
      return String.fromCharCode(code);
    }
    return full.toUpperCase();
  });

  // Collapse duplicate slashes
  p = p.replace(/\/{2,}/g, '/');

  if (p.length > 1 && p.endsWith('/')) p = p.slice(0, -1);
  return p;
}

/**
 * Infer api family label from normalized path (metadata only).
 * @param {string} pathNormalized
 * @returns {string}
 */
export function apiFamilyFromPath(pathNormalized) {
  const p = pathNormalized.toLowerCase();
  if (p.startsWith('/api/acp/')) return 'acp';
  if (p.startsWith('/api/cms/')) return 'cms';
  if (p.startsWith('/api/connect') || p.startsWith('/api/v2/connect')) return 'connect';
  if (p.startsWith('/api/v3/')) return 'v3';
  if (p.startsWith('/api/v2/')) return 'v2';
  if (p.startsWith('/api/')) return 'other';
  return 'non_api';
}

/**
 * Stable evidence ID from semantic components (NOT solely filename/offset/buildId/timestamp).
 *
 * Identity components: category + normalized path + method + structural context key.
 * Metadata (offsets, snippets, sha256, buildId) must not change the id.
 *
 * @param {{
 *   category: string,
 *   path?: string | null,
 *   method?: string | null,
 *   structuralContext?: string | null,
 * }} parts
 * @returns {string}
 */
export function evidenceId(parts) {
  const category = parts.category || 'unknown';
  const method = normalizeMethod(parts.method) || '-';
  const pathPart = parts.path != null && parts.path !== ''
    ? normalizePath(parts.path)
    : '-';
  const ctx = (parts.structuralContext || '-').replace(/\s+/g, ' ').trim() || '-';
  return `${category}:${method}:${pathPart}:${ctx}`;
}

/**
 * @param {string} host
 * @param {string[]} suffixes
 */
export function hostMatchesSuffix(host, suffixes) {
  const h = String(host).toLowerCase().replace(/\.$/, '');
  return suffixes.some((s) => h === s || h.endsWith(`.${s}`));
}
