/**
 * Light deterministic normalization for evidence identity (Phase 2.1.1).
 *
 * Identity must not thrash on cosmetic/minified churn: no raw surrounding text,
 * byte offsets, chunk filenames, or build IDs in the id.
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
 * @param {string} path
 * @returns {string}
 */
export function normalizePath(path) {
  let p = String(path).trim();
  if (!p) return '/';

  if (/^https?:\/\//i.test(p)) {
    try {
      const u = new URL(p);
      p = u.pathname || '/';
    } catch {
      // fall through
    }
  }

  const q = p.indexOf('?');
  if (q >= 0) p = p.slice(0, q);
  const h = p.indexOf('#');
  if (h >= 0) p = p.slice(0, h);

  if (!p.startsWith('/')) p = `/${p}`;

  p = p.replace(/%([0-9A-Fa-f]{2})/g, (full, hex) => {
    const code = parseInt(hex, 16);
    if (
      (code >= 0x41 && code <= 0x5a) ||
      (code >= 0x61 && code <= 0x7a) ||
      (code >= 0x30 && code <= 0x39) ||
      code === 0x2d ||
      code === 0x2e ||
      code === 0x5f ||
      code === 0x7e
    ) {
      return String.fromCharCode(code);
    }
    return full.toUpperCase();
  });

  p = p.replace(/\/{2,}/g, '/');

  if (p.length > 1 && p.endsWith('/')) p = p.slice(0, -1);
  return p;
}

/**
 * Infer api family label from normalized path (metadata only — not identity).
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
 * Stable evidence ID from semantic components only.
 *
 * Primary structured_operation:
 *   `structured_operation:{METHOD}:{normalizedPath}`
 *   Discriminator appended ONLY when needed for genuinely distinct semantics
 *   within the same category+method+path (rare).
 *
 * Other categories:
 *   `category:{METHOD|-}:{path|-}:{discriminator}`
 *   Discriminator = structural kind (e.g. sails_socket_post, host:chat_socket)
 *   so distinct evidence kinds sharing a path do not collide.
 *
 * NEVER include: byte offsets, snippets, chunk filenames, source hashes, buildId, timestamps.
 *
 * @param {{
 *   category: string,
 *   path?: string | null,
 *   method?: string | null,
 *   discriminator?: string | null,
 *   structuralContext?: string | null,
 * }} parts
 * @returns {string}
 */
export function evidenceId(parts) {
  const category = parts.category || 'unknown';
  const method = normalizeMethod(parts.method) || '-';
  const pathPart =
    parts.path != null && parts.path !== '' ? normalizePath(parts.path) : '-';
  const rawDisc =
    parts.discriminator != null && parts.discriminator !== ''
      ? parts.discriminator
      : parts.structuralContext != null && parts.structuralContext !== ''
        ? parts.structuralContext
        : null;
  const disc = rawDisc ? String(rawDisc).replace(/\s+/g, ' ').trim() : null;

  if (category === 'structured_operation') {
    // Default OpenAPI-client discriminator is NOT part of identity.
    if (!disc || disc === 'openapi_client_request') {
      return `${category}:${method}:${pathPart}`;
    }
    return `${category}:${method}:${pathPart}:${disc}`;
  }

  return `${category}:${method}:${pathPart}:${disc || '-'}`;
}

/**
 * Documented identity rules object embedded in api-evidence.json for Phase 2.2.
 */
export const IDENTITY_RULES = Object.freeze({
  version: 2,
  structuredOperation: {
    components: ['category', 'normalizedMethod', 'normalizedPath'],
    optionalDiscriminator:
      'Only when two structured ops share method+path but are semantically distinct',
    defaultDiscriminatorExcluded: 'openapi_client_request',
  },
  otherCategories: {
    components: ['category', 'normalizedMethod', 'normalizedPath', 'discriminator'],
    discriminatorMeaning: 'Structural kind (e.g. sails_socket_post, host:chat_socket, template_literal)',
  },
  metadataExcludedFromId: [
    'byteOffset',
    'endOffset',
    'snippet',
    'sourcePath',
    'sourceSha256',
    'chunkFilename',
    'buildId',
    'extractedAt',
    'observationId',
    'minifiedSurroundingText',
  ],
  duplicatePolicy:
    'Same id → one evidence item with multiple provenance[] entries; never invent multiple operations',
  phase22Guidance:
    'Diff operations by id set only. Missing ids under incomplete/refuseRemoval status must NOT be classified as API removal.',
});

/**
 * @param {string} host
 * @param {string[]} suffixes
 */
export function hostMatchesSuffix(host, suffixes) {
  const h = String(host).toLowerCase().replace(/\.$/, '');
  return suffixes.some((s) => h === s || h.endsWith(`.${s}`));
}
