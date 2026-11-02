/**
 * POST Discord/Fluxer-compatible webhook payload.
 * Never logs the webhook URL.
 */

import { MAX_PAYLOAD_CHARS } from './constants.mjs';
import { redactWebhookUrl } from './resolve-webhook.mjs';

/**
 * @param {{
 *   url: string,
 *   payload: object,
 *   fetchImpl?: typeof fetch,
 *   dryRun?: boolean,
 * }} opts
 */
export async function postWebhook(opts) {
  const fetchImpl = opts.fetchImpl || globalThis.fetch;
  if (!opts.url) {
    return { ok: false, skipped: true, reason: 'no-url' };
  }
  if (!opts.payload || typeof opts.payload !== 'object') {
    return { ok: false, skipped: true, reason: 'no-payload' };
  }

  const body = JSON.stringify(opts.payload);
  if (body.length > MAX_PAYLOAD_CHARS) {
    // Do not silently replace sample JSON with a stub. Caller should pack /
    // split via packShapePayloads; refuse oversized single posts explicitly.
    return {
      ok: false,
      skipped: false,
      reason: 'payload-too-large',
      error: `payload ${body.length} chars exceeds soft cap ${MAX_PAYLOAD_CHARS} — split samples into continued fields/messages`,
      bytes: body.length,
      webhook: redactWebhookUrl(opts.url),
    };
  }

  if (opts.dryRun) {
    return {
      ok: true,
      dryRun: true,
      bytes: body.length,
      webhook: redactWebhookUrl(opts.url),
    };
  }

  if (typeof fetchImpl !== 'function') {
    return { ok: false, error: 'fetch-unavailable' };
  }

  const res = await fetchImpl(opts.url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
  });

  // Discord/Fluxer: 204 No Content, or 200 when ?wait=true
  if (res.status === 204 || res.status === 200 || res.status === 201) {
    return {
      ok: true,
      status: res.status,
      bytes: body.length,
      webhook: redactWebhookUrl(opts.url),
    };
  }

  let detail = '';
  try {
    detail = (await res.text()).slice(0, 200);
  } catch {
    detail = '';
  }
  return {
    ok: false,
    status: res.status,
    error: detail || `http_${res.status}`,
    webhook: redactWebhookUrl(opts.url),
  };
}
