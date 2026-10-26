/**
 * High-level: resolve webhook target(s) → build payload from decision → POST on change.
 *
 * Production / live: fan out to Fluxer + Discord.
 * Discord gets an extra public-safe sanitize pass (user-self / subscription PII);
 * Fluxer (private) keeps the richer private samples.
 * Test / draft / smoke (`test: true` or targets=test): Fluxer only — never Discord.
 */

import { buildNotifyPayload, shouldNotify } from './payloads.mjs';
import { postWebhook } from './post.mjs';
import { resolveWebhookTargets } from './resolve-webhook.mjs';
import { payloadForWebhookTarget } from './discord-public-sanitize.mjs';
import { TOOL_ID, TOOL_VERSION } from './constants.mjs';

/**
 * @param {{
 *   decision: object,
 *   prUrl?: string|null,
 *   notifyOnAuth?: boolean,
 *   dryRun?: boolean,
 *   url?: string|null,
 *   storePath?: string|null,
 *   discordUrl?: string|null,
 *   discordStorePath?: string|null,
 *   targets?: string|string[]|null,
 *   test?: boolean,
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

  const resolved = await resolveWebhookTargets({
    env: opts.env,
    storePath: opts.storePath,
    url: opts.url,
    discordUrl: opts.discordUrl,
    discordStorePath: opts.discordStorePath,
    targets: opts.targets,
    test: opts.test,
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
      targetMode: resolved.mode,
      requestedTargets: resolved.requested,
      missingTargets: resolved.missing,
      hint:
        'Set FLUXER_WEBHOOK_URL / DISCORD_WEBHOOK_URL or write HTTPS URLs to Project secrets/{fluxer,discord}-webhook.url',
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
      targetMode: resolved.mode,
    };
  }

  const payloads = built.payloads?.length ? built.payloads : [built.payload];
  /** @type {object[]} */
  const deliveries = [];

  for (const target of resolved.targets) {
    /** @type {object[]} */
    const posts = [];
    for (const payload of payloads) {
      const posted = await postWebhook({
        url: target.url,
        payload: payloadForWebhookTarget(target.id, payload),
        fetchImpl: opts.fetchImpl,
        dryRun: opts.dryRun,
      });
      posts.push(posted);
      if (!posted.ok && !posted.skipped) break;
    }
    const last = posts[posts.length - 1] || {};
    const allOk = posts.every((p) => p.ok);
    deliveries.push({
      id: target.id,
      source: target.source,
      ok: allOk,
      skipped: Boolean(last.skipped),
      dryRun: Boolean(last.dryRun),
      webhook: last.webhook,
      status: last.status ?? null,
      bytes: posts.reduce((n, p) => n + (p.bytes || 0), 0),
      messages: posts.length,
      error: posts.find((p) => p.error)?.error || null,
      reason: last.reason || null,
    });
  }

  const allOk = deliveries.every((d) => d.ok);
  const anySkipped = deliveries.every((d) => d.skipped);
  const last = deliveries[deliveries.length - 1] || {};

  return {
    schemaVersion: 1,
    toolId: TOOL_ID,
    toolVersion: TOOL_VERSION,
    notified: allOk,
    skipped: anySkipped,
    dryRun: Boolean(opts.dryRun),
    lane: built.lane,
    action: decision.action,
    targetMode: resolved.mode,
    requestedTargets: resolved.requested,
    missingTargets: resolved.missing,
    targets: deliveries.map((d) => ({
      id: d.id,
      source: d.source,
      ok: d.ok,
      status: d.status,
      webhook: d.webhook,
      messages: d.messages,
      error: d.error,
    })),
    // Backward-compatible single-target summary (first delivery).
    source: deliveries[0]?.source || null,
    webhook: last.webhook || deliveries[0]?.webhook || null,
    status: last.status ?? deliveries[0]?.status ?? null,
    bytes: deliveries.reduce((n, d) => n + (d.bytes || 0), 0),
    messages: deliveries.reduce((n, d) => n + (d.messages || 0), 0),
    error: deliveries.find((d) => d.error)?.error || null,
    reason: deliveries.find((d) => !d.ok)?.reason || null,
  };
}
