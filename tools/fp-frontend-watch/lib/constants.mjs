/** Phase 1 Floatplane frontend watch — shared constants. */

export const SCHEMA_VERSION = 1;

export const DEFAULT_HOMEPAGE_URL = 'https://www.floatplane.com/';
export const FRONTEND_CDN_ORIGIN = 'https://frontend.floatplane.com';

export const USER_AGENT =
  'FloatplaneAPIWatch/0.1 (+phase1-frontend-watch; https://github.com/bmlzootown/FloatplaneAPI)';

/** Exit codes for the CLI. */
export const EXIT = Object.freeze({
  UNCHANGED: 0,
  FAILURE: 1,
  CHANGED: 2,
});

/** Angular-era bundle names (legacy layout under /{version}/). */
export const LEGACY_ANGULAR_BUNDLES = Object.freeze([
  'runtime.js',
  'polyfills.js',
  'scripts.js',
  'main.js',
]);
