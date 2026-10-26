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
/**
 * Soft cap per webhook POST body. Discord embed content is also bounded
 * (~6000 chars / embed); we pack/split rather than silently truncating JSON.
 */
export const MAX_PAYLOAD_CHARS = 18000;
/** Discord hard-ish total characters across one embed's text parts */
export const MAX_EMBED_TOTAL_CHARS = 6000;
/** Discord max fields per embed */
export const MAX_EMBED_FIELDS = 25;
/** Discord max embeds per message */
export const MAX_EMBEDS_PER_MESSAGE = 10;

export const TOOL_ID = 'fp-notify';
export const TOOL_VERSION = '1.6.0';

export const DEFAULT_USERNAME = 'FloatplaneAPI Watch';

/** Known webhook target ids */
export const WEBHOOK_TARGET_FLUXER = 'fluxer';
export const WEBHOOK_TARGET_DISCORD = 'discord';
export const WEBHOOK_TARGET_IDS = [WEBHOOK_TARGET_FLUXER, WEBHOOK_TARGET_DISCORD];

/**
 * Production / live notify: fan out to every configured target.
 * Test / draft / preview / smoke format posts: Fluxer only (never Discord).
 */
export const TARGET_MODE_ALL = 'all';
export const TARGET_MODE_TEST = 'test';

/** Env vars checked (first non-empty wins) for the Fluxer webhook URL string */
export const WEBHOOK_URL_ENV_KEYS = ['FLUXER_WEBHOOK_URL', 'FP_FLUXER_WEBHOOK_URL'];

/** Env vars for a file that contains only the Fluxer webhook URL (trimmed) */
export const WEBHOOK_FILE_ENV_KEYS = [
  'FLUXER_WEBHOOK_URL_FILE',
  'FP_FLUXER_WEBHOOK_FILE',
];

/** Env vars for Discord production webhook URL string */
export const DISCORD_WEBHOOK_URL_ENV_KEYS = [
  'DISCORD_WEBHOOK_URL',
  'FP_DISCORD_WEBHOOK_URL',
];

/** Env vars for a file that contains only the Discord webhook URL */
export const DISCORD_WEBHOOK_FILE_ENV_KEYS = [
  'DISCORD_WEBHOOK_URL_FILE',
  'FP_DISCORD_WEBHOOK_FILE',
];

/**
 * Default Project-store secret path for Fluxer (this Floatplane API Watch project).
 * Prefer env override in other environments.
 */
export const DEFAULT_WEBHOOK_STORE_PATH =
  '/cursor/stores/bc-fa3a528a-7e46-4d0e-a9de-c45e84b52445/secrets/fluxer-webhook.url';

/** Default Project-store secret path for Discord production alerts */
export const DEFAULT_DISCORD_WEBHOOK_STORE_PATH =
  '/cursor/stores/bc-fa3a528a-7e46-4d0e-a9de-c45e84b52445/secrets/discord-webhook.url';

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
