import { sha256 } from './hash.mjs';

/**
 * Validate a downloaded artifact body + response metadata.
 * Rejects HTTP errors, empty bodies, HTML-as-JS, and unexpected content types.
 *
 * @param {{
 *   path: string,
 *   status: number,
 *   contentType: string | null,
 *   body: Buffer,
 *   finalUrl: string,
 *   requestedUrl: string,
 * }} input
 */
export function validateArtifact(input) {
  const { path, status, contentType, body, finalUrl, requestedUrl } = input;

  if (!Number.isInteger(status) || status < 200 || status >= 300) {
    throw new ArtifactError(`HTTP ${status} for ${path} (${requestedUrl})`);
  }

  if (!body || body.length === 0) {
    throw new ArtifactError(`Empty response body for ${path}`);
  }

  // Unexpected redirects to a different host are treated as invalid.
  if (finalUrl) {
    let requested;
    let final;
    try {
      requested = new URL(requestedUrl);
      final = new URL(finalUrl);
    } catch {
      throw new ArtifactError(`Invalid URL while fetching ${path}`);
    }
    if (requested.host !== final.host) {
      throw new ArtifactError(
        `Unexpected cross-host redirect for ${path}: ${requested.host} → ${final.host}`,
      );
    }
  }

  const ct = (contentType || '').split(';')[0].trim().toLowerCase();
  const kind = classifyPath(path);

  if (kind === 'javascript') {
    if (ct && !isJsContentType(ct) && !isOctetStream(ct)) {
      throw new ArtifactError(
        `Unexpected Content-Type for JS artifact ${path}: ${contentType}`,
      );
    }
    if (looksLikeHtmlBuffer(body)) {
      throw new ArtifactError(`HTML received where JavaScript expected for ${path}`);
    }
  } else if (kind === 'manifest') {
    if (ct && !isJsonishContentType(ct) && !isOctetStream(ct) && ct !== 'text/plain') {
      throw new ArtifactError(
        `Unexpected Content-Type for manifest ${path}: ${contentType}`,
      );
    }
    if (looksLikeHtmlBuffer(body)) {
      throw new ArtifactError(`HTML received where manifest JSON expected for ${path}`);
    }
    try {
      JSON.parse(body.toString('utf8'));
    } catch {
      throw new ArtifactError(`Manifest ${path} is not valid JSON`);
    }
  } else if (kind === 'html') {
    if (!looksLikeHtmlBuffer(body)) {
      throw new ArtifactError(`Expected HTML for ${path}`);
    }
  }

  return {
    path,
    url: requestedUrl,
    finalUrl: finalUrl || requestedUrl,
    sha256: sha256(body),
    bytes: body.length,
    contentType: contentType || null,
  };
}

/** @param {string} path */
function classifyPath(path) {
  if (path.endsWith('.js')) return 'javascript';
  if (path.endsWith('.webmanifest') || path.endsWith('.json')) return 'manifest';
  if (path.endsWith('.html') || path.endsWith('.htm')) return 'html';
  return 'other';
}

/** @param {string} ct */
function isJsContentType(ct) {
  return (
    ct === 'application/javascript' ||
    ct === 'text/javascript' ||
    ct === 'application/x-javascript'
  );
}

/** @param {string} ct */
function isJsonishContentType(ct) {
  return (
    ct === 'application/json' ||
    ct === 'application/manifest+json' ||
    ct.endsWith('+json')
  );
}

/** @param {string} ct */
function isOctetStream(ct) {
  return ct === 'application/octet-stream';
}

/** @param {Buffer} body */
function looksLikeHtmlBuffer(body) {
  const sample = body.subarray(0, Math.min(body.length, 512)).toString('utf8').toLowerCase();
  const trimmed = sample.trimStart();
  return (
    trimmed.startsWith('<!doctype html') ||
    trimmed.startsWith('<html') ||
    (trimmed.startsWith('<') && sample.includes('<html'))
  );
}

export class ArtifactError extends Error {
  /** @param {string} message */
  constructor(message) {
    super(message);
    this.name = 'ArtifactError';
  }
}
