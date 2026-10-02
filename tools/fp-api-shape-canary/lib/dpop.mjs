/**
 * Minimal DPoP (RFC 9449) helper for fp-tv-app extended security.
 *
 * Frontend evidence: USE_DPOP === usesExtendedSecurity === true for clientId fp-tv-app.
 * Token + resource requests require a DPoP proof JWT (ES256 / P-256).
 */

import { webcrypto } from 'node:crypto';
import { randomBytes, createHash } from 'node:crypto';

const subtle = webcrypto.subtle;

/**
 * @returns {Promise<{ publicKey: CryptoKey, privateKey: CryptoKey, publicJwk: JsonWebKey, privateJwk: JsonWebKey }>}
 */
export async function generateDpopKeyPair() {
  const pair = await subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, [
    'sign',
    'verify',
  ]);
  const publicJwk = await subtle.exportKey('jwk', pair.publicKey);
  const privateJwk = await subtle.exportKey('jwk', pair.privateKey);
  // Strip private material from public jwk for JWT header
  const publicOnly = {
    kty: publicJwk.kty,
    crv: publicJwk.crv,
    x: publicJwk.x,
    y: publicJwk.y,
  };
  return {
    publicKey: pair.publicKey,
    privateKey: pair.privateKey,
    publicJwk: publicOnly,
    privateJwk,
  };
}

/**
 * Import a persisted JWK key pair.
 * @param {{ publicJwk: JsonWebKey, privateJwk: JsonWebKey }} stored
 */
export async function importDpopKeyPair(stored) {
  const publicKey = await subtle.importKey(
    'jwk',
    stored.publicJwk,
    { name: 'ECDSA', namedCurve: 'P-256' },
    true,
    ['verify'],
  );
  const privateKey = await subtle.importKey(
    'jwk',
    stored.privateJwk,
    { name: 'ECDSA', namedCurve: 'P-256' },
    true,
    ['sign'],
  );
  return {
    publicKey,
    privateKey,
    publicJwk: {
      kty: stored.publicJwk.kty,
      crv: stored.publicJwk.crv,
      x: stored.publicJwk.x,
      y: stored.publicJwk.y,
    },
    privateJwk: stored.privateJwk,
  };
}

/**
 * Create a DPoP proof JWT and return the header value.
 * @param {{
 *   keyPair: { publicJwk: JsonWebKey, privateKey: CryptoKey },
 *   htm: string,
 *   htu: string | URL,
 *   accessToken?: string | null,
 *   nonce?: string | null,
 * }} opts
 */
export async function createDpopProof(opts) {
  const url = typeof opts.htu === 'string' ? new URL(opts.htu) : opts.htu;
  const htu = `${url.origin}${url.pathname}`;
  const header = {
    alg: 'ES256',
    typ: 'dpop+jwt',
    jwk: opts.keyPair.publicJwk,
  };
  /** @type {Record<string, unknown>} */
  const payload = {
    iat: Math.floor(Date.now() / 1000),
    jti: base64Url(randomBytes(16)),
    htm: opts.htm.toUpperCase(),
    htu,
  };
  if (opts.nonce) payload.nonce = opts.nonce;
  if (opts.accessToken) {
    payload.ath = base64Url(createHash('sha256').update(opts.accessToken, 'ascii').digest());
  }

  const data = `${base64UrlJson(header)}.${base64UrlJson(payload)}`;
  const sig = await subtle.sign(
    { name: 'ECDSA', hash: 'SHA-256' },
    opts.keyPair.privateKey,
    new TextEncoder().encode(data),
  );
  return `${data}.${base64Url(Buffer.from(sig))}`;
}

/**
 * Attach DPoP proof to headers; returns Authorization scheme for bound tokens.
 * @param {{
 *   headers: Record<string, string>,
 *   keyPair: { publicJwk: JsonWebKey, privateKey: CryptoKey },
 *   method: string,
 *   url: string | URL,
 *   accessToken?: string | null,
 *   nonce?: string | null,
 * }} opts
 */
export async function attachDpopHeaders(opts) {
  const proof = await createDpopProof({
    keyPair: opts.keyPair,
    htm: opts.method,
    htu: opts.url,
    accessToken: opts.accessToken || null,
    nonce: opts.nonce || null,
  });
  opts.headers.dpop = proof;
  if (opts.accessToken) {
    opts.headers.authorization = `DPoP ${opts.accessToken}`;
  }
  return opts.headers;
}

/**
 * Read dpop-nonce from a fetch Response (case-insensitive).
 * @param {{ headers?: { get?: (name: string) => string | null } } | null} res
 */
export function readDpopNonce(res) {
  try {
    return res?.headers?.get?.('dpop-nonce') || res?.headers?.get?.('DPoP-Nonce') || null;
  } catch {
    return null;
  }
}

/** @param {object} obj */
function base64UrlJson(obj) {
  return base64Url(Buffer.from(JSON.stringify(obj), 'utf8'));
}

/** @param {Buffer|Uint8Array} buf */
function base64Url(buf) {
  return Buffer.from(buf)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}
