/**
 * Durable auth: DPoP-bound refresh_token grant + local session persistence.
 *
 * Evidence (frontend build 4.5.22-316-d74397b):
 * - refreshAccessToken requires DPoP handle when USE_DPOP (fp-tv-app usesExtendedSecurity)
 * - setOAuthTokenFromResponse reads refresh_expires_in as a finite lifetime
 * - offline_access appears in OIDC scopes_supported; not referenced in archived frontend JS
 */

import { OIDC, USER_AGENT } from './constants.mjs';
import { attachDpopHeaders, readDpopNonce } from './dpop.mjs';
import { discoverOidc } from './device-flow.mjs';

/**
 * Normalize token-endpoint success JSON into a redacted-safe session patch.
 * Never invent fields — only copy what Keycloak returned.
 * @param {Record<string, unknown>} json
 * @param {{ dpopKeyPair: object, obtainedAtMs?: number }} opts
 */
export function normalizeTokenResponse(json, opts) {
  const obtainedAtMs = opts.obtainedAtMs ?? Date.now();
  const expiresIn =
    typeof json.expires_in === 'number'
      ? json.expires_in
      : json.expires_in != null
        ? Number(json.expires_in)
        : null;
  const refreshExpiresIn =
    typeof json.refresh_expires_in === 'number'
      ? json.refresh_expires_in
      : json.refresh_expires_in != null
        ? Number(json.refresh_expires_in)
        : null;
  const accessExpiresAtMs =
    expiresIn != null && Number.isFinite(expiresIn)
      ? obtainedAtMs + expiresIn * 1000
      : null;
  const refreshExpiresAtMs =
    refreshExpiresIn != null && Number.isFinite(refreshExpiresIn) && refreshExpiresIn > 0
      ? obtainedAtMs + refreshExpiresIn * 1000
      : null;

  return {
    accessToken: String(json.access_token),
    refreshToken: json.refresh_token ? String(json.refresh_token) : null,
    tokenType: json.token_type ? String(json.token_type) : 'DPoP',
    scope: json.scope != null ? String(json.scope) : null,
    expiresIn: Number.isFinite(expiresIn) ? expiresIn : null,
    refreshExpiresIn: Number.isFinite(refreshExpiresIn) ? refreshExpiresIn : null,
    accessExpiresAtMs,
    refreshExpiresAtMs,
    sessionState: json.session_state != null ? String(json.session_state) : null,
    obtainedAtMs,
    dpopKeyPair: opts.dpopKeyPair,
    /** Raw keys observed (for evidence; values not retained except lifetimes). */
    responseKeys: Object.keys(json).sort(),
  };
}

/**
 * Redacted lifetime snapshot suitable for commits / reports (no secrets).
 * @param {ReturnType<typeof normalizeTokenResponse> | object} session
 * @param {{ label?: string, refreshTokenRotated?: boolean|null }} [extra]
 */
export function redactAuthLifetime(session, extra = {}) {
  return {
    label: extra.label || null,
    obtainedAt: session.obtainedAtMs
      ? new Date(session.obtainedAtMs).toISOString()
      : null,
    expiresIn: session.expiresIn ?? null,
    refreshExpiresIn: session.refreshExpiresIn ?? null,
    accessExpiresAt: session.accessExpiresAtMs
      ? new Date(session.accessExpiresAtMs).toISOString()
      : null,
    refreshExpiresAt: session.refreshExpiresAtMs
      ? new Date(session.refreshExpiresAtMs).toISOString()
      : null,
    hasRefreshToken: Boolean(session.refreshToken),
    scope: session.scope || null,
    sessionStatePresent: Boolean(session.sessionState),
    responseKeys: session.responseKeys || null,
    refreshTokenRotated: extra.refreshTokenRotated ?? null,
    dpopRequired: true,
  };
}

/**
 * Exchange refresh_token for new access (+ optional rotated refresh) with DPoP.
 * @param {{
 *   refreshToken: string,
 *   dpopKeyPair: { publicJwk: object, privateKey: CryptoKey, privateJwk?: object },
 *   clientId?: string,
 *   discovery?: Awaited<ReturnType<typeof discoverOidc>>,
 *   fetchImpl?: typeof fetch,
 *   now?: () => number,
 * }} opts
 */
export async function refreshAccessToken(opts) {
  if (!opts.refreshToken) throw new Error('No refresh token available');
  if (!opts.dpopKeyPair) throw new Error('Missing DPoP key pair for refresh token request');

  const fetchImpl = opts.fetchImpl || fetch;
  const discovery = opts.discovery || (await discoverOidc({ fetchImpl }));
  const clientId = opts.clientId || OIDC.clientId;
  const now = opts.now || (() => Date.now());
  /** @type {string|null} */
  let dpopNonce = null;

  for (let attempt = 0; attempt < 3; attempt++) {
    const body = new URLSearchParams();
    body.set('grant_type', OIDC.grantTypeRefreshToken);
    body.set('refresh_token', opts.refreshToken);
    body.set('client_id', clientId);

    /** @type {Record<string, string>} */
    const headers = {
      'content-type': 'application/x-www-form-urlencoded',
      accept: 'application/json',
      'user-agent': USER_AGENT,
    };
    await attachDpopHeaders({
      headers,
      keyPair: opts.dpopKeyPair,
      method: 'POST',
      url: discovery.tokenEndpoint,
      nonce: dpopNonce,
    });

    const res = await fetchImpl(discovery.tokenEndpoint, {
      method: 'POST',
      headers,
      body,
    });
    const nonceHeader = readDpopNonce(res);
    if (nonceHeader) dpopNonce = nonceHeader;
    const json = await res.json().catch(() => ({}));

    if (res.ok && json.access_token) {
      return normalizeTokenResponse(json, {
        dpopKeyPair: opts.dpopKeyPair,
        obtainedAtMs: now(),
      });
    }

    const err = json.error || `HTTP ${res.status}`;
    if (err === 'use_dpop_nonce' || (err === 'invalid_dpop_proof' && nonceHeader)) {
      continue;
    }
    const desc = json.error_description ? `: ${json.error_description}` : '';
    const e = new Error(`refresh_token grant failed: ${err}${desc}`);
    e.code = err;
    e.httpStatus = res.status;
    throw e;
  }
  throw new Error('refresh_token grant failed: dpop nonce retry exhausted');
}

/**
 * Whether the access token should be refreshed before a probe.
 * @param {{ accessExpiresAtMs?: number|null, refreshToken?: string|null }} session
 * @param {{ skewMs?: number, nowMs?: number }} [opts]
 */
export function accessNeedsRefresh(session, opts = {}) {
  if (!session?.refreshToken) return false;
  const skewMs = opts.skewMs ?? 60_000;
  const nowMs = opts.nowMs ?? Date.now();
  if (session.accessExpiresAtMs == null) {
    // Unknown expiry — refresh opportunistically when we have a refresh token.
    return true;
  }
  return nowMs + skewMs >= session.accessExpiresAtMs;
}

/**
 * Whether refresh is already past its wall-clock expiry (re-login required).
 * @param {{ refreshExpiresAtMs?: number|null, refreshToken?: string|null }} session
 * @param {{ nowMs?: number }} [opts]
 */
export function refreshIsExpired(session, opts = {}) {
  if (!session?.refreshToken) return true;
  if (session.refreshExpiresAtMs == null) return false;
  const nowMs = opts.nowMs ?? Date.now();
  return nowMs >= session.refreshExpiresAtMs;
}
