/**
 * High-level: resolve webhook → build payload from decision → POST on change only.
 */

import { buildNotifyPayload, shouldNotify } from './payloads.mjs';
import { postWebhook } from './post.mjs';
import { resolveWebhookUrl } from './resolve-webhook.mjs';
import { TOOL_ID, TOOL_VERSION } from './constants.mjs';

/**
 * @param {{
 *   decision: object,
 *   prUrl?: string|null,
 *   notifyOnAuth?: boolean,
 *   dryRun?: boolean,
 *   url?: string|null,
 *   storePath?: string|null,
 *   env?: NodeJS.ProcessEnv,
 *   fetchImpl?: typeof fetch,
 *   username?: string,
 * }} opts
 */
export async function notifyFromDecision(opts) {
  const decision = opts.decision;
  if (!decision || typeof decision !== 'object') {
    return {
      schemaVersion: 1,
      toolId: TOOL_ID,
      toolVersion: TOOL_VERSION,
      notified: false,
      skipped: true,
      reason: 'missing-decision',
    };
  }

  if (!shouldNotify(decision, { notifyOnAuth: opts.notifyOnAuth })) {
    return {
      schemaVersion: 1,
      toolId: TOOL_ID,
      toolVersion: TOOL_VERSION,
      notified: false,
      skipped: true,
      reason: `action_${decision.action || 'missing'}`,
      action: decision.action || null,
    };
  }

  const resolved = await resolveWebhookUrl({
    env: opts.env,
    storePath: opts.storePath,
    url: opts.url,
  });

  if (!resolved.ok) {
    return {
      schemaVersion: 1,
      toolId: TOOL_ID,
      toolVersion: TOOL_VERSION,
      notified: false,
      skipped: true,
      reason: resolved.reason || 'webhook-unset',
      action: decision.action,
      hint:
        'Set FLUXER_WEBHOOK_URL or write HTTPS URL to Project secrets/fluxer-webhook.url',
    };
  }

  const built = buildNotifyPayload(decision, {
    prUrl: opts.prUrl,
    notifyOnAuth: opts.notifyOnAuth,
    username: opts.username,
  });

  if (built.skipped) {
    return {
      schemaVersion: 1,
      toolId: TOOL_ID,
      toolVersion: TOOL_VERSION,
      notified: false,
      skipped: true,
      reason: built.reason,
      action: decision.action,
    };
  }

  const payloads = built.payloads?.length ? built.payloads : [built.payload];
  /** @type {object[]} */
  const posts = [];
  for (const payload of payloads) {
    const posted = await postWebhook({
      url: resolved.url,
      payload,
      fetchImpl: opts.fetchImpl,
      dryRun: opts.dryRun,
    });
    posts.push(posted);
    if (!posted.ok && !posted.skipped) break;
  }

  const last = posts[posts.length - 1] || {};
  const allOk = posts.every((p) => p.ok);
  return {
    schemaVersion: 1,
    toolId: TOOL_ID,
    toolVersion: TOOL_VERSION,
    notified: allOk,
    skipped: Boolean(last.skipped),
    dryRun: Boolean(last.dryRun),
    lane: built.lane,
    action: decision.action,
    source: resolved.source,
    webhook: last.webhook,
    status: last.status ?? null,
    bytes: posts.reduce((n, p) => n + (p.bytes || 0), 0),
    messages: posts.length,
    error: posts.find((p) => p.error)?.error || null,
    reason: last.reason || null,
  };
}
