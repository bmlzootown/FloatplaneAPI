import {
  USER_AGENT,
  DEFAULT_HOMEPAGE_TIMEOUT_MS,
  DEFAULT_ARTIFACT_TIMEOUT_MS,
  DEFAULT_FETCH_RETRIES,
  DEFAULT_RETRY_BACKOFF_MS,
} from './constants.mjs';
import { validateArtifact } from './validate-artifact.mjs';
import { sha256 } from './hash.mjs';

/**
 * @typedef {(url: string, init?: {
 *   headers?: Record<string, string>,
 *   redirect?: string,
 *   signal?: AbortSignal,
 * }) => Promise<{
 *   status: number,
 *   headers: { get: (name: string) => string | null },
 *   arrayBuffer: () => Promise<ArrayBuffer>,
 *   url: string,
 * }>} FetchLike
 */

/**
 * @param {string} url
 * @param {string} relativePath
 * @param {{
 *   fetchImpl?: FetchLike,
 *   userAgent?: string,
 *   maxBytes?: number,
 *   timeoutMs?: number,
 *   retries?: number,
 *   retryBackoffMs?: number,
 * }} [opts]
 */
export async function fetchArtifact(url, relativePath, opts = {}) {
  const fetchImpl = opts.fetchImpl || globalThis.fetch;
  if (typeof fetchImpl !== 'function') {
    throw new Error('No fetch implementation available');
  }

  const userAgent = opts.userAgent || USER_AGENT;
  const maxBytes = opts.maxBytes ?? 40 * 1024 * 1024;
  const timeoutMs = opts.timeoutMs ?? DEFAULT_ARTIFACT_TIMEOUT_MS;
  const retries = opts.retries ?? DEFAULT_FETCH_RETRIES;
  const retryBackoffMs = opts.retryBackoffMs ?? DEFAULT_RETRY_BACKOFF_MS;

  const response = await fetchWithRetries(
    fetchImpl,
    url,
    {
      headers: { 'user-agent': userAgent, accept: '*/*' },
      redirect: 'follow',
    },
    { timeoutMs, retries, retryBackoffMs, label: `artifact ${relativePath}` },
  );

  const contentType = response.headers.get('content-type');
  const finalUrl = response.url || url;

  const contentLength = response.headers.get('content-length');
  if (contentLength != null && Number(contentLength) > maxBytes) {
    throw new Error(
      `Artifact ${relativePath} Content-Length ${contentLength} exceeds maxBytes ${maxBytes}`,
    );
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  if (buffer.length > maxBytes) {
    throw new Error(
      `Artifact ${relativePath} body ${buffer.length} exceeds maxBytes ${maxBytes}`,
    );
  }

  const meta = validateArtifact({
    path: relativePath,
    status: response.status,
    contentType,
    body: buffer,
    finalUrl,
    requestedUrl: url,
  });

  return { ...meta, body: buffer };
}

/**
 * @param {string} homepageUrl
 * @param {{
 *   fetchImpl?: FetchLike,
 *   userAgent?: string,
 *   maxBytes?: number,
 *   timeoutMs?: number,
 *   retries?: number,
 *   retryBackoffMs?: number,
 * }} [opts]
 */
export async function fetchHomepage(homepageUrl, opts = {}) {
  const fetchImpl = opts.fetchImpl || globalThis.fetch;
  const userAgent = opts.userAgent || USER_AGENT;
  const maxBytes = opts.maxBytes ?? 2 * 1024 * 1024;
  const timeoutMs = opts.timeoutMs ?? DEFAULT_HOMEPAGE_TIMEOUT_MS;
  const retries = opts.retries ?? DEFAULT_FETCH_RETRIES;
  const retryBackoffMs = opts.retryBackoffMs ?? DEFAULT_RETRY_BACKOFF_MS;

  const response = await fetchWithRetries(
    fetchImpl,
    homepageUrl,
    {
      headers: {
        'user-agent': userAgent,
        accept: 'text/html,application/xhtml+xml;q=0.9,*/*;q=0.8',
      },
      redirect: 'follow',
    },
    { timeoutMs, retries, retryBackoffMs, label: 'homepage' },
  );

  if (!Number.isInteger(response.status) || response.status < 200 || response.status >= 300) {
    throw new Error(`Homepage HTTP ${response.status} for ${homepageUrl}`);
  }

  const finalUrl = response.url || homepageUrl;
  let requestedHost;
  let finalHost;
  try {
    requestedHost = new URL(homepageUrl).host;
    finalHost = new URL(finalUrl).host;
  } catch {
    throw new Error(`Invalid homepage URL: ${homepageUrl}`);
  }
  const allowed = new Set([
    requestedHost,
    requestedHost.replace(/^www\./, ''),
    `www.${requestedHost.replace(/^www\./, '')}`,
  ]);
  if (!allowed.has(finalHost)) {
    throw new Error(`Unexpected homepage redirect to host ${finalHost}`);
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  if (buffer.length === 0) {
    throw new Error('Homepage response body is empty');
  }
  if (buffer.length > maxBytes) {
    throw new Error(`Homepage body exceeds maxBytes ${maxBytes}`);
  }

  return {
    url: homepageUrl,
    finalUrl,
    status: response.status,
    contentType: response.headers.get('content-type'),
    body: buffer,
    text: buffer.toString('utf8'),
    sha256: sha256(buffer),
    bytes: buffer.length,
  };
}

/**
 * @param {FetchLike} fetchImpl
 * @param {string} url
 * @param {object} init
 * @param {{ timeoutMs: number, retries: number, retryBackoffMs: number, label: string }} ctl
 */
async function fetchWithRetries(fetchImpl, url, init, ctl) {
  let lastErr;
  const attempts = Math.max(0, ctl.retries) + 1;
  for (let i = 0; i < attempts; i++) {
    const signal = AbortSignal.timeout(ctl.timeoutMs);
    try {
      const response = await fetchImpl(url, { ...init, signal });
      // Retry only transient HTTP statuses when body wasn't consumed yet.
      if (isTransientStatus(response.status) && i < attempts - 1) {
        lastErr = new Error(`${ctl.label} HTTP ${response.status} for ${url}`);
        await sleep(ctl.retryBackoffMs * (i + 1));
        continue;
      }
      return response;
    } catch (err) {
      lastErr = err instanceof Error ? err : new Error(String(err));
      if (!isTransientError(lastErr) || i >= attempts - 1) {
        if (lastErr.name === 'TimeoutError' || lastErr.name === 'AbortError') {
          throw new Error(`${ctl.label} timed out after ${ctl.timeoutMs}ms (${url})`);
        }
        throw lastErr;
      }
      await sleep(ctl.retryBackoffMs * (i + 1));
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error(String(lastErr));
}

/** @param {number} status */
function isTransientStatus(status) {
  return status === 408 || status === 425 || status === 429 || status === 502 || status === 503 || status === 504;
}

/** @param {Error} err */
function isTransientError(err) {
  const msg = err.message.toLowerCase();
  return (
    err.name === 'TimeoutError' ||
    err.name === 'AbortError' ||
    msg.includes('fetch failed') ||
    msg.includes('econnreset') ||
    msg.includes('etimedout') ||
    msg.includes('socket hang up') ||
    msg.includes('network')
  );
}

/** @param {number} ms */
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
