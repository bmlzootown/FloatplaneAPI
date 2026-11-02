/**
 * Resolve Fluxer / Discord webhook URLs from env or Project store secret files.
 * Never log the URL value.
 */

import { access, readFile, constants } from 'node:fs/promises';
import {
  DEFAULT_DISCORD_WEBHOOK_STORE_PATH,
  DEFAULT_WEBHOOK_STORE_PATH,
  DISCORD_WEBHOOK_FILE_ENV_KEYS,
  DISCORD_WEBHOOK_URL_ENV_KEYS,
  TARGET_MODE_ALL,
  TARGET_MODE_TEST,
  WEBHOOK_FILE_ENV_KEYS,
  WEBHOOK_TARGET_DISCORD,
  WEBHOOK_TARGET_FLUXER,
  WEBHOOK_TARGET_IDS,
  WEBHOOK_URL_ENV_KEYS,
} from './constants.mjs';

/**
 * @param {string} raw
 * @returns {{ ok: true, url: string } | { ok: false, reason: string }}
 */
function parseHttpsUrlLine(raw) {
  const url = String(raw || '')
    .trim()
    .split(/\r?\n/)[0]
    ?.trim() || '';
  if (!url || url.startsWith('#')) {
    return { ok: false, reason: 'file-empty' };
  }
  if (!/^https:\/\//i.test(url)) {
    return { ok: false, reason: 'file-not-https' };
  }
  return { ok: true, url };
}

/**
 * @param {{
 *   env?: NodeJS.ProcessEnv,
 *   urlEnvKeys: string[],
 *   fileEnvKeys: string[],
 *   defaultStorePath: string,
 *   storePath?: string|null,
 *   url?: string|null,
 * }} opts
 */
async function resolveOneWebhook(opts) {
  const env = opts.env || process.env;

  if (opts.url && String(opts.url).trim()) {
    const parsed = parseHttpsUrlLine(opts.url);
    if (!parsed.ok) {
      return { ok: false, url: null, source: null, reason: parsed.reason };
    }
    return { ok: true, url: parsed.url, source: 'arg' };
  }

  for (const key of opts.urlEnvKeys) {
    const v = env[key];
    if (v && String(v).trim()) {
      const parsed = parseHttpsUrlLine(v);
      if (!parsed.ok) {
        return { ok: false, url: null, source: null, reason: parsed.reason };
      }
      return { ok: true, url: parsed.url, source: 'env' };
    }
  }

  const fileCandidates = [];
  for (const key of opts.fileEnvKeys) {
    if (env[key] && String(env[key]).trim()) {
      fileCandidates.push(String(env[key]).trim());
    }
  }
  if (opts.storePath) {
    // Explicit store path: try only that file (tests / overrides), not the Project default.
    fileCandidates.push(opts.storePath);
  } else {
    fileCandidates.push(opts.defaultStorePath);
  }

  for (const file of fileCandidates) {
    try {
      await access(file, constants.R_OK);
      const raw = await readFile(file, 'utf8');
      const parsed = parseHttpsUrlLine(raw);
      if (!parsed.ok) {
        return {
          ok: false,
          url: null,
          source: null,
          reason: parsed.reason,
        };
      }
      return { ok: true, url: parsed.url, source: 'file' };
    } catch {
      // try next
    }
  }

  return {
    ok: false,
    url: null,
    source: null,
    reason: 'webhook-unset',
  };
}

/**
 * Resolve Fluxer webhook URL (backward-compatible single-target helper).
 *
 * @param {{
 *   env?: NodeJS.ProcessEnv,
 *   storePath?: string|null,
 *   url?: string|null,
 * }} [opts]
 */
export async function resolveWebhookUrl(opts = {}) {
  return resolveOneWebhook({
    env: opts.env,
    urlEnvKeys: WEBHOOK_URL_ENV_KEYS,
    fileEnvKeys: WEBHOOK_FILE_ENV_KEYS,
    defaultStorePath: DEFAULT_WEBHOOK_STORE_PATH,
    storePath: opts.storePath,
    url: opts.url,
  });
}

/**
 * Resolve Discord production webhook URL.
 *
 * @param {{
 *   env?: NodeJS.ProcessEnv,
 *   storePath?: string|null,
 *   url?: string|null,
 * }} [opts]
 */
export async function resolveDiscordWebhookUrl(opts = {}) {
  return resolveOneWebhook({
    env: opts.env,
    urlEnvKeys: DISCORD_WEBHOOK_URL_ENV_KEYS,
    fileEnvKeys: DISCORD_WEBHOOK_FILE_ENV_KEYS,
    defaultStorePath: DEFAULT_DISCORD_WEBHOOK_STORE_PATH,
    storePath: opts.storePath,
    url: opts.url,
  });
}

/**
 * Normalize CLI / API target selection.
 *
 * - `all` / production (default): Fluxer + Discord
 * - `test` / `--test`: Fluxer only (format/smoke/draft — never Discord)
 * - `fluxer` | `discord`: single target
 * - comma list: explicit set
 *
 * @param {string|string[]|null|undefined} targets
 * @param {{ test?: boolean }} [opts]
 * @returns {{ mode: string, ids: string[] }}
 */
export function selectWebhookTargetIds(targets, opts = {}) {
  if (opts.test) {
    return { mode: TARGET_MODE_TEST, ids: [WEBHOOK_TARGET_FLUXER] };
  }

  if (targets == null || targets === '' || targets === TARGET_MODE_ALL) {
    return { mode: TARGET_MODE_ALL, ids: [...WEBHOOK_TARGET_IDS] };
  }

  if (targets === TARGET_MODE_TEST) {
    return { mode: TARGET_MODE_TEST, ids: [WEBHOOK_TARGET_FLUXER] };
  }

  const raw = Array.isArray(targets)
    ? targets
    : String(targets)
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

  const ids = [];
  for (const id of raw) {
    const normalized = String(id).toLowerCase();
    if (normalized === TARGET_MODE_ALL) {
      return { mode: TARGET_MODE_ALL, ids: [...WEBHOOK_TARGET_IDS] };
    }
    if (normalized === TARGET_MODE_TEST) {
      return { mode: TARGET_MODE_TEST, ids: [WEBHOOK_TARGET_FLUXER] };
    }
    if (!WEBHOOK_TARGET_IDS.includes(normalized)) {
      throw new Error(
        `Unknown webhook target "${id}" (expected fluxer, discord, all, or test)`,
      );
    }
    if (!ids.includes(normalized)) ids.push(normalized);
  }

  if (!ids.length) {
    return { mode: TARGET_MODE_ALL, ids: [...WEBHOOK_TARGET_IDS] };
  }

  return {
    mode: ids.length === WEBHOOK_TARGET_IDS.length ? TARGET_MODE_ALL : ids.join(','),
    ids,
  };
}

/**
 * Resolve one or more webhook targets for notify fan-out.
 *
 * @param {{
 *   env?: NodeJS.ProcessEnv,
 *   targets?: string|string[]|null,
 *   test?: boolean,
 *   url?: string|null,
 *   storePath?: string|null,
 *   discordUrl?: string|null,
 *   discordStorePath?: string|null,
 * }} [opts]
 * @returns {Promise<{
 *   ok: boolean,
 *   mode: string,
 *   requested: string[],
 *   targets: Array<{ id: string, url: string, source: string }>,
 *   missing: Array<{ id: string, reason: string }>,
 *   reason?: string,
 * }>}
 */
export async function resolveWebhookTargets(opts = {}) {
  const selected = selectWebhookTargetIds(opts.targets, { test: opts.test });
  /** @type {Array<{ id: string, url: string, source: string }>} */
  const targets = [];
  /** @type {Array<{ id: string, reason: string }>} */
  const missing = [];

  for (const id of selected.ids) {
    if (id === WEBHOOK_TARGET_FLUXER) {
      // Single-url / storePath overrides apply to Fluxer only (legacy CLI).
      const resolved = await resolveWebhookUrl({
        env: opts.env,
        url: opts.url,
        storePath: opts.storePath,
      });
      if (resolved.ok && resolved.url) {
        targets.push({
          id,
          url: resolved.url,
          source: resolved.source || 'file',
        });
      } else {
        missing.push({ id, reason: resolved.reason || 'webhook-unset' });
      }
      continue;
    }

    if (id === WEBHOOK_TARGET_DISCORD) {
      const resolved = await resolveDiscordWebhookUrl({
        env: opts.env,
        url: opts.discordUrl,
        storePath: opts.discordStorePath,
      });
      if (resolved.ok && resolved.url) {
        targets.push({
          id,
          url: resolved.url,
          source: resolved.source || 'file',
        });
      } else {
        missing.push({ id, reason: resolved.reason || 'webhook-unset' });
      }
    }
  }

  if (!targets.length) {
    return {
      ok: false,
      mode: selected.mode,
      requested: selected.ids,
      targets: [],
      missing,
      reason: missing[0]?.reason || 'webhook-unset',
    };
  }

  return {
    ok: true,
    mode: selected.mode,
    requested: selected.ids,
    targets,
    missing,
  };
}

/** Redact a URL for safe logging (never include token path segments). */
export function redactWebhookUrl(url) {
  if (!url) return '(unset)';
  try {
    const u = new URL(url);
    return `${u.origin}/…(redacted)`;
  } catch {
    return '(invalid-url)';
  }
}
