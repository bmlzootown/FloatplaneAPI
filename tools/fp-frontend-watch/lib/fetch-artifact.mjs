import { USER_AGENT } from './constants.mjs';
import { validateArtifact } from './validate-artifact.mjs';

/**
 * @typedef {(url: string, init?: { headers?: Record<string, string>, redirect?: string }) => Promise<{
 *   status: number,
 *   headers: { get: (name: string) => string | null },
 *   arrayBuffer: () => Promise<ArrayBuffer>,
 *   url: string,
 * }>} FetchLike
 */

/**
 * Fetch one artifact with validation. Does not follow cross-host surprises
 * beyond what the injected fetch provides; default fetch follows redirects.
 *
 * @param {string} url
 * @param {string} relativePath
 * @param {{ fetchImpl?: FetchLike, userAgent?: string, maxBytes?: number }} [opts]
 */
export async function fetchArtifact(url, relativePath, opts = {}) {
  const fetchImpl = opts.fetchImpl || globalThis.fetch;
  if (typeof fetchImpl !== 'function') {
    throw new Error('No fetch implementation available');
  }

  const userAgent = opts.userAgent || USER_AGENT;
  const maxBytes = opts.maxBytes ?? 40 * 1024 * 1024;

  const response = await fetchImpl(url, {
    headers: { 'user-agent': userAgent, accept: '*/*' },
    redirect: 'follow',
  });

  const contentType = response.headers.get('content-type');
  const finalUrl = response.url || url;

  // Guard Content-Length when present before buffering.
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
 * Fetch homepage HTML for discovery.
 * @param {string} homepageUrl
 * @param {{ fetchImpl?: FetchLike, userAgent?: string, maxBytes?: number }} [opts]
 */
export async function fetchHomepage(homepageUrl, opts = {}) {
  const fetchImpl = opts.fetchImpl || globalThis.fetch;
  const userAgent = opts.userAgent || USER_AGENT;
  const maxBytes = opts.maxBytes ?? 2 * 1024 * 1024;

  const response = await fetchImpl(homepageUrl, {
    headers: {
      'user-agent': userAgent,
      accept: 'text/html,application/xhtml+xml;q=0.9,*/*;q=0.8',
    },
    redirect: 'follow',
  });

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
  // www ↔ apex is fine; other hosts are not.
  const allowed = new Set([requestedHost, requestedHost.replace(/^www\./, ''), `www.${requestedHost.replace(/^www\./, '')}`]);
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

  const text = buffer.toString('utf8');
  return {
    url: homepageUrl,
    finalUrl,
    status: response.status,
    contentType: response.headers.get('content-type'),
    body: buffer,
    text,
    sha256: (await import('./hash.mjs')).sha256(buffer),
    bytes: buffer.length,
  };
}
