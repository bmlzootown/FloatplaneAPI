/**
 * Phase 3.0 authenticated API response-shape canary — constants.
 *
 * OIDC clientId / realm / issuer are taken from frontend archive evidence
 * (build 4.5.22-316-d74397b entry JS: baseUrl auth.floatplane.com, realm floatplane,
 * clientId fp-tv-app) and public OIDC discovery. Do not invent alternate clients.
 */

export const TOOL_ID = 'fp-api-shape-canary';
export const TOOL_VERSION = '3.0.0';
export const SCHEMA_VERSION = 1;

/** Custom User-Agent for read-only probes (identify the watch project). */
export const USER_AGENT = 'FloatplaneAPI-Watch/3.0 (api-shape-canary; read-only)';

export const API_BASE_URL = 'https://www.floatplane.com';

/**
 * Keycloak / OIDC — evidence-backed defaults.
 * Discovery: https://auth.floatplane.com/realms/floatplane/.well-known/openid-configuration
 */
export const OIDC = Object.freeze({
  issuer: 'https://auth.floatplane.com/realms/floatplane',
  wellKnownUrl:
    'https://auth.floatplane.com/realms/floatplane/.well-known/openid-configuration',
  /** Frontend TV device-auth config: clientId:"fp-tv-app" */
  clientId: 'fp-tv-app',
  realm: 'floatplane',
  baseUrl: 'https://auth.floatplane.com',
  /**
   * Minimal scopes for device login. Operators may widen via --scope.
   * offline_access is optional (refresh); not required for one-shot capture.
   */
  defaultScope: 'openid',
  grantTypeDeviceCode: 'urn:ietf:params:oauth:grant-type:device_code',
});

/** Evidence notes committed beside captures for auditability. */
export const OIDC_EVIDENCE = Object.freeze({
  clientIdSource:
    'artifacts/frontend/4.5.22-316-d74397b/.../js/index-BZVDPgzb.js — o_={baseUrl:"https://auth.floatplane.com",realm:"floatplane",clientId:"fp-tv-app",...}',
  deviceGrantSource:
    'OIDC discovery grant_types_supported includes urn:ietf:params:oauth:grant-type:device_code; device_authorization_endpoint present (observed 2026-10-02)',
});

/**
 * Fixed read-only allowlist (Phase 3.0). Order matters for id discovery.
 * No writes. No /delivery/info. No Hydravion.
 */
export const ALLOWLIST = Object.freeze([
  {
    id: 'user-self',
    method: 'GET',
    path: '/api/v3/user/self',
    role: 'token-sanity',
    auth: 'bearer',
  },
  {
    id: 'user-subscriptions',
    method: 'GET',
    path: '/api/v3/user/subscriptions',
    role: 'pick-creator',
    auth: 'bearer',
  },
  {
    id: 'content-creator',
    method: 'GET',
    path: '/api/v3/content/creator',
    role: 'list-shape + post-id',
    auth: 'bearer',
    /** Query built at runtime: id, limit=1 */
    queryKeys: ['id', 'limit'],
  },
  {
    id: 'content-post',
    method: 'GET',
    path: '/api/v3/content/post',
    role: 'primary-canary',
    auth: 'bearer',
    queryKeys: ['id'],
  },
  {
    id: 'content-video',
    method: 'GET',
    path: '/api/v3/content/video',
    role: 'optional-attachment',
    auth: 'bearer',
    optional: true,
    queryKeys: ['id'],
  },
]);

/** Unauthenticated companion (list shape only; detail post remains 403). */
export const UNAUTH_LIST = Object.freeze({
  id: 'content-creator-unauth',
  method: 'GET',
  path: '/api/v3/content/creator',
  role: 'unauth-list-companion',
  auth: 'none',
  /** Creator id used in assessment unauth sample (Linus Tech Tips). */
  defaultCreatorId: '59f94c0bdd241b70349eb72b',
});

export const EXIT = Object.freeze({
  SUCCESS: 0,
  FAILURE: 1,
  /** Structural drift vs baseline */
  DRIFT: 2,
  /** Missing token / needs human device approval */
  NEEDS_AUTH: 3,
});

export const DEFAULT_ARTIFACTS_ROOT = 'artifacts/api-shape';
export const DEFAULT_TOKEN_FILE = 'state/api-shape-token.local';
/** Combined access token + DPoP key material (gitignored). Prefer over bare token file. */
export const DEFAULT_AUTH_FILE = 'state/api-shape-auth.local.json';
export const BASELINES_DIR = 'baselines';
export const CAPTURES_DIR = 'captures';
