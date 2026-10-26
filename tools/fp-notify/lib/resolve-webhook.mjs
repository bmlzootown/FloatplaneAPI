/**
 * Resolve Fluxer webhook URL from env or Project store secret file.
 * Never log the URL value.
 */

import { access, readFile, constants } from 'node:fs/promises';
import {
  DEFAULT_WEBHOOK_STORE_PATH,
  WEBHOOK_FILE_ENV_KEYS,
  WEBHOOK_URL_ENV_KEYS,
} from './constants.mjs';

/**
 * @param {{
 *   env?: NodeJS.ProcessEnv,
 *   storePath?: string|null,
 *   url?: string|null,
 * }} [opts]
 * @returns {Promise<{
 *   ok: boolean,
 *   url: string|null,
 *   source: 'arg'|'env'|'file'|null,
 *   reason?: string,
 * }>}
 */
export async function resolveWebhookUrl(opts = {}) {
  const env = opts.env || process.env;

  if (opts.url && String(opts.url).trim()) {
    return { ok: true, url: String(opts.url).trim(), source: 'arg' };
  }

  for (const key of WEBHOOK_URL_ENV_KEYS) {
    const v = env[key];
    if (v && String(v).trim()) {
      return { ok: true, url: String(v).trim(), source: 'env' };
    }
  }

  const fileCandidates = [];
  for (const key of WEBHOOK_FILE_ENV_KEYS) {
    if (env[key] && String(env[key]).trim()) {
      fileCandidates.push(String(env[key]).trim());
    }
  }
  if (opts.storePath) {
    // Explicit store path: try only that file (tests / overrides), not the Project default.
    fileCandidates.push(opts.storePath);
  } else {
    fileCandidates.push(DEFAULT_WEBHOOK_STORE_PATH);
  }

  for (const file of fileCandidates) {
    try {
      await access(file, constants.R_OK);
      const raw = await readFile(file, 'utf8');
      const url = raw.trim().split(/\r?\n/)[0]?.trim() || '';
      if (!url || url.startsWith('#')) {
        return {
          ok: false,
          url: null,
          source: null,
          reason: 'file-empty',
        };
      }
      if (!/^https:\/\//i.test(url)) {
        return {
          ok: false,
          url: null,
          source: null,
          reason: 'file-not-https',
        };
      }
      return { ok: true, url, source: 'file' };
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
