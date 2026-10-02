/**
 * Read-only allowlisted Floatplane REST probes (Bearer or unauthenticated).
 */

import { API_BASE_URL, USER_AGENT } from './constants.mjs';

/**
 * @param {{
 *   method?: string,
 *   path: string,
 *   query?: Record<string, string | number | undefined | null>,
 *   accessToken?: string | null,
 *   fetchImpl?: typeof fetch,
 *   baseUrl?: string,
 * }} opts
 */
export async function apiGetJson(opts) {
  const fetchImpl = opts.fetchImpl || fetch;
  const base = opts.baseUrl || API_BASE_URL;
  const full = new URL(
    opts.path.startsWith('http') ? opts.path : `${base.replace(/\/$/, '')}${opts.path}`,
  );
  for (const [k, v] of Object.entries(opts.query || {})) {
    if (v === undefined || v === null || v === '') continue;
    full.searchParams.set(k, String(v));
  }

  /** @type {Record<string, string>} */
  const headers = {
    accept: 'application/json',
    'user-agent': USER_AGENT,
  };
  if (opts.accessToken) {
    headers.authorization = `Bearer ${opts.accessToken}`;
  }

  const res = await fetchImpl(full.toString(), {
    method: opts.method || 'GET',
    headers,
  });
  const text = await res.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = null;
  }
  return {
    ok: res.ok,
    status: res.status,
    url: full.toString(),
    json,
    rawTextLength: text.length,
  };
}

/**
 * Never log Authorization headers or tokens.
 * @param {string} token
 */
export function redactToken(token) {
  if (!token) return '(empty)';
  if (token.length <= 12) return '***';
  return `${token.slice(0, 4)}…${token.slice(-4)} (len=${token.length})`;
}

/**
 * Pick a creator id from subscriptions payload (shape-tolerant).
 * @param {unknown} body
 * @returns {string|null}
 */
export function pickCreatorIdFromSubscriptions(body) {
  if (!body) return null;
  const list = Array.isArray(body) ? body : body.items || body.subscriptions || null;
  if (!Array.isArray(list) || list.length === 0) return null;
  const first = list[0];
  if (!first || typeof first !== 'object') return null;
  return (
    first.creator?.id ||
    first.creatorId ||
    first.id ||
    first.plan?.creatorId ||
    null
  );
}

/**
 * Pick first blog post id from creator list response.
 * @param {unknown} body
 * @returns {string|null}
 */
export function pickPostIdFromCreatorList(body) {
  if (!body) return null;
  const list = Array.isArray(body)
    ? body
    : body.blogPosts || body.posts || body.items || null;
  if (!Array.isArray(list) || list.length === 0) return null;
  const first = list[0];
  if (!first || typeof first !== 'object') return null;
  return first.id || first.blogPostId || null;
}

/**
 * Pick first video attachment id from post detail if present.
 * @param {unknown} body
 * @returns {string|null}
 */
export function pickVideoAttachmentId(body) {
  if (!body || typeof body !== 'object') return null;
  const vids = body.videoAttachments;
  if (!Array.isArray(vids) || vids.length === 0) return null;
  const first = vids[0];
  if (typeof first === 'string') return first;
  if (first && typeof first === 'object') return first.id || null;
  return null;
}
