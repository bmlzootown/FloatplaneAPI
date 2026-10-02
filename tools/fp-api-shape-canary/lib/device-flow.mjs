/**
 * OIDC discovery + Keycloak device authorization grant helpers.
 *
 * Frontend TV client requires PKCE (USE_CODE_CHALLENGE): code_challenge_method=S256
 * on device authorization, and code_verifier on the token poll.
 */

import { createHash, randomBytes } from 'node:crypto';
import { OIDC, USER_AGENT } from './constants.mjs';

/**
 * Generate a PKCE code_verifier (43–128 chars, unreserved).
 * @param {number} [bytes]
 */
export function generateCodeVerifier(bytes = 32) {
  return base64Url(randomBytes(bytes));
}

/**
 * S256 code_challenge for a verifier.
 * @param {string} verifier
 */
export function generateCodeChallenge(verifier) {
  return base64Url(createHash('sha256').update(verifier, 'ascii').digest());
}

/** @param {Buffer} buf */
function base64Url(buf) {
  return buf
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

/**
 * @param {{ fetchImpl?: typeof fetch, wellKnownUrl?: string }} [opts]
 */
export async function discoverOidc(opts = {}) {
  const fetchImpl = opts.fetchImpl || fetch;
  const url = opts.wellKnownUrl || OIDC.wellKnownUrl;
  const res = await fetchImpl(url, {
    method: 'GET',
    headers: { accept: 'application/json', 'user-agent': USER_AGENT },
  });
  if (!res.ok) {
    throw new Error(`OIDC discovery failed: HTTP ${res.status} for ${url}`);
  }
  const doc = await res.json();
  if (!doc.device_authorization_endpoint) {
    throw new Error('OIDC discovery missing device_authorization_endpoint');
  }
  if (!doc.token_endpoint) {
    throw new Error('OIDC discovery missing token_endpoint');
  }
  const grants = doc.grant_types_supported || [];
  if (!grants.includes(OIDC.grantTypeDeviceCode)) {
    throw new Error(`OIDC discovery missing grant ${OIDC.grantTypeDeviceCode}`);
  }
  return {
    issuer: doc.issuer,
    deviceAuthorizationEndpoint: doc.device_authorization_endpoint,
    tokenEndpoint: doc.token_endpoint,
    scopesSupported: doc.scopes_supported || [],
    grantTypesSupported: grants,
    raw: doc,
  };
}

/**
 * Start device authorization (public client — no client_secret; PKCE required).
 * @param {{
 *   discovery: Awaited<ReturnType<typeof discoverOidc>>,
 *   clientId?: string,
 *   scope?: string,
 *   fetchImpl?: typeof fetch,
 *   codeVerifier?: string,
 * }} opts
 */
export async function requestDeviceAuthorization(opts) {
  const fetchImpl = opts.fetchImpl || fetch;
  const clientId = opts.clientId || OIDC.clientId;
  const scope = opts.scope || OIDC.defaultScope;
  const codeVerifier = opts.codeVerifier || generateCodeVerifier();
  const codeChallenge = generateCodeChallenge(codeVerifier);
  const body = new URLSearchParams();
  body.set('client_id', clientId);
  if (scope) body.set('scope', scope);
  // Required by fp-tv-app (frontend USE_CODE_CHALLENGE / Keycloak public client)
  body.set('code_challenge_method', 'S256');
  body.set('code_challenge', codeChallenge);

  const res = await fetchImpl(opts.discovery.deviceAuthorizationEndpoint, {
    method: 'POST',
    headers: {
      'content-type': 'application/x-www-form-urlencoded',
      accept: 'application/json',
      'user-agent': USER_AGENT,
    },
    body,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = json.error || `HTTP ${res.status}`;
    const desc = json.error_description ? `: ${json.error_description}` : '';
    throw new Error(`device authorization failed: ${err}${desc}`);
  }
  if (!json.device_code || !json.user_code) {
    throw new Error('device authorization response missing device_code/user_code');
  }
  return {
    deviceCode: json.device_code,
    userCode: json.user_code,
    verificationUri: json.verification_uri || json.verification_uri_complete,
    verificationUriComplete: json.verification_uri_complete || null,
    expiresIn: Number(json.expires_in) || 600,
    interval: Number(json.interval) || 5,
    codeVerifier,
  };
}

/**
 * Poll token endpoint until authorized, expired, or aborted.
 * @param {{
 *   discovery: Awaited<ReturnType<typeof discoverOidc>>,
 *   deviceCode: string,
 *   clientId?: string,
 *   codeVerifier?: string,
 *   intervalSec?: number,
 *   expiresInSec?: number,
 *   fetchImpl?: typeof fetch,
 *   sleep?: (ms: number) => Promise<void>,
 *   now?: () => number,
 *   onPoll?: (info: { status: string, attempt: number }) => void,
 *   signal?: AbortSignal,
 * }} opts
 */
export async function pollDeviceToken(opts) {
  const fetchImpl = opts.fetchImpl || fetch;
  const sleep = opts.sleep || ((ms) => new Promise((r) => setTimeout(r, ms)));
  const now = opts.now || (() => Date.now());
  const clientId = opts.clientId || OIDC.clientId;
  let intervalMs = Math.max(1, (opts.intervalSec ?? 5) * 1000);
  const deadline = now() + Math.max(1, opts.expiresInSec ?? 600) * 1000;
  let attempt = 0;

  while (now() < deadline) {
    if (opts.signal?.aborted) {
      throw new Error('device token poll aborted');
    }
    attempt += 1;
    const body = new URLSearchParams();
    body.set('grant_type', OIDC.grantTypeDeviceCode);
    body.set('device_code', opts.deviceCode);
    body.set('client_id', clientId);
    if (opts.codeVerifier) body.set('code_verifier', opts.codeVerifier);

    const res = await fetchImpl(opts.discovery.tokenEndpoint, {
      method: 'POST',
      headers: {
        'content-type': 'application/x-www-form-urlencoded',
        accept: 'application/json',
        'user-agent': USER_AGENT,
      },
      body,
    });
    const json = await res.json().catch(() => ({}));

    if (res.ok && json.access_token) {
      opts.onPoll?.({ status: 'authorized', attempt });
      return {
        accessToken: json.access_token,
        refreshToken: json.refresh_token || null,
        expiresIn: json.expires_in ?? null,
        tokenType: json.token_type || 'Bearer',
        scope: json.scope || null,
      };
    }

    const err = json.error || `HTTP ${res.status}`;
    opts.onPoll?.({ status: err, attempt });

    if (err === 'authorization_pending') {
      await sleep(intervalMs);
      continue;
    }
    if (err === 'slow_down') {
      intervalMs += 5000;
      await sleep(intervalMs);
      continue;
    }
    if (err === 'expired_token' || err === 'access_denied') {
      throw new Error(`device token poll ended: ${err}${json.error_description ? `: ${json.error_description}` : ''}`);
    }
    throw new Error(
      `device token poll failed: ${err}${json.error_description ? `: ${json.error_description}` : ''}`,
    );
  }
  throw new Error('device token poll timed out');
}
