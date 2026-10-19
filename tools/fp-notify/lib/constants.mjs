/**
 * Fluxer / Discord-compatible webhook limits and secret resolution defaults.
 * Never log webhook URLs or tokens.
 */

/** Discord/Fluxer content max */
export const MAX_CONTENT = 2000;
/** Embed description max */
export const MAX_EMBED_DESCRIPTION = 4096;
/** Embed field value max */
export const MAX_FIELD_VALUE = 1024;
/** Embed title max */
export const MAX_EMBED_TITLE = 256;
/** Soft cap for total JSON payload body we send */
export const MAX_PAYLOAD_CHARS = 5500;

export const TOOL_ID = 'fp-notify';
export const TOOL_VERSION = '1.1.0';

export const DEFAULT_USERNAME = 'FloatplaneAPI Watch';

/** Env vars checked (first non-empty wins) for the webhook URL string */
export const WEBHOOK_URL_ENV_KEYS = ['FLUXER_WEBHOOK_URL', 'FP_FLUXER_WEBHOOK_URL'];

/** Env vars for a file that contains only the webhook URL (trimmed) */
export const WEBHOOK_FILE_ENV_KEYS = [
  'FLUXER_WEBHOOK_URL_FILE',
  'FP_FLUXER_WEBHOOK_FILE',
];

/**
 * Default Project-store secret path (this Floatplane API Watch project).
 * Prefer env override in other environments.
 */
export const DEFAULT_WEBHOOK_STORE_PATH =
  '/cursor/stores/bc-fa3a528a-7e46-4d0e-a9de-c45e84b52445/secrets/fluxer-webhook.url';

/** Actions that warrant a change notification (not noop/failure). */
export const CHANGE_NOTIFY_ACTIONS = new Set([
  'open_shape_pr',
  'update_shape_pr',
  'open_monitor_pr',
  'update_monitor_pr',
]);

/** Optional useful alerts (off unless --also-auth / notifyOnAuth). */
export const AUTH_NOTIFY_ACTIONS = new Set(['needs_auth']);

export const COLOR_SHAPE_DRIFT = 0xe67e22; // orange
export const COLOR_FRONTEND = 0x3498db; // blue
export const COLOR_AUTH = 0xe74c3c; // red

/** Max field paths listed per endpoint in shape alerts */
export const MAX_PATHS_PER_KIND = 8;
/** Max endpoints to detail in one embed */
export const MAX_ENDPOINTS_IN_EMBED = 6;
