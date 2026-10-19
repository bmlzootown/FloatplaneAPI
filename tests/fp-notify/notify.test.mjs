import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  buildNotifyPayload,
  formatEndpointExample,
  shouldNotify,
} from '../../tools/fp-notify/lib/payloads.mjs';
import { notifyFromDecision } from '../../tools/fp-notify/lib/notify.mjs';
import { resolveWebhookUrl, redactWebhookUrl } from '../../tools/fp-notify/lib/resolve-webhook.mjs';
import { MAX_FIELD_VALUE } from '../../tools/fp-notify/lib/constants.mjs';
import { truncField } from '../../tools/fp-notify/lib/truncate.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TMP = path.join(__dirname, '.tmp-notify');

before(async () => {
  await rm(TMP, { recursive: true, force: true });
  await mkdir(TMP, { recursive: true });
});

after(async () => {
  await rm(TMP, { recursive: true, force: true });
});

describe('shouldNotify', () => {
  it('notifies only on change PR actions by default', () => {
    assert.equal(shouldNotify({ action: 'noop' }), false);
    assert.equal(shouldNotify({ action: 'report_failure' }), false);
    assert.equal(shouldNotify({ action: 'open_shape_pr' }), true);
    assert.equal(shouldNotify({ action: 'update_shape_pr' }), true);
    assert.equal(shouldNotify({ action: 'open_monitor_pr' }), true);
    assert.equal(shouldNotify({ action: 'update_monitor_pr' }), true);
    assert.equal(shouldNotify({ action: 'needs_auth' }), false);
    assert.equal(shouldNotify({ action: 'needs_auth' }, { notifyOnAuth: true }), true);
  });
});

describe('shape payload examples', () => {
  it('includes concrete removed/added field paths', () => {
    const decision = {
      action: 'open_shape_pr',
      reason: 'structural_drift',
      captureId: 'c-test',
      decidedAt: '2026-10-19T03:00:00.000Z',
      capture: {
        captureId: 'c-test',
        byEndpoint: {
          'content-post': {
            hasDrift: true,
            added: ['creator.newField'],
            removed: ['creator.discoverable'],
            typeChanged: [{ path: 'id', from: 'string', to: 'number' }],
          },
        },
      },
    };
    const built = buildNotifyPayload(decision, {
      prUrl: 'https://github.com/bmlzootown/FloatplaneAPI/pull/13',
    });
    assert.equal(built.skipped, false);
    assert.equal(built.lane, 'shape');
    const embed = built.payload.embeds[0];
    assert.match(embed.title, /shape/i);
    const ep = embed.fields.find((f) => f.name === 'content-post');
    assert.ok(ep);
    assert.match(ep.value, /creator\.discoverable/);
    assert.match(ep.value, /creator\.newField/);
    assert.match(ep.value, /id/);
    assert.ok(JSON.stringify(built.payload).length < 5500);
  });

  it('formatEndpointExample caps path lists; field trunc respects Discord limit', () => {
    const many = Array.from({ length: 20 }, (_, i) => `field.${i}`);
    const text = formatEndpointExample({
      hasDrift: true,
      added: many,
      removed: [],
      typeChanged: [],
    });
    assert.match(text, /\+\d+ more/);
    assert.ok(truncField(text).length <= MAX_FIELD_VALUE);
  });
});

describe('frontend payload', () => {
  it('summarizes build without inventing API claims', () => {
    const built = buildNotifyPayload(
      {
        action: 'update_monitor_pr',
        reason: 'phase1_drives_pr_phase2_enriches_body',
        orchestratorId: 'phase2.3-frontend-evidence-orchestrate',
        phase1: { action: 'update_monitor_pr', buildId: '4.5.25-340-92712da' },
        pendingObservations: [{ buildId: '4.5.25-340-92712da', observationId: 'abc' }],
        commitSequence: {
          commits: [
            {
              step: 'observe',
              phase: 'phase1',
              message: 'Observe Floatplane frontend 4.5.25-340-92712da',
            },
          ],
        },
        analyses: [{ observationId: 'abc', comparisonStatus: 'changed', counts: { added: 2 } }],
      },
      { prUrl: 'https://github.com/bmlzootown/FloatplaneAPI/pull/10' },
    );
    assert.equal(built.skipped, false);
    assert.equal(built.lane, 'frontend');
    const desc = built.payload.embeds[0].description;
    assert.match(desc, /not a server API claim/i);
    assert.doesNotMatch(desc, /OpenAPI schema changed/i);
    assert.match(JSON.stringify(built.payload), /4\.5\.25-340-92712da/);
  });
});

describe('resolve + notify', () => {
  it('redacts webhook URLs', () => {
    assert.equal(
      redactWebhookUrl('https://fluxer.example/api/v1/webhooks/123/sekrettoken'),
      'https://fluxer.example/…(redacted)',
    );
  });

  it('resolves from store file and skips when unset', async () => {
    const unset = await resolveWebhookUrl({
      env: {},
      storePath: path.join(TMP, 'missing.url'),
    });
    assert.equal(unset.ok, false);
    assert.equal(unset.reason, 'webhook-unset');

    const file = path.join(TMP, 'hook.url');
    await writeFile(file, 'https://fluxer.example/api/v1/webhooks/1/tok\n', { mode: 0o600 });
    const ok = await resolveWebhookUrl({ env: {}, storePath: file });
    assert.equal(ok.ok, true);
    assert.equal(ok.source, 'file');
    assert.equal(ok.url.startsWith('https://'), true);
  });

  it('notifyFromDecision skips noop and posts on change', async () => {
    const skipped = await notifyFromDecision({
      decision: { action: 'noop' },
      env: { FLUXER_WEBHOOK_URL: 'https://example.test/hook' },
    });
    assert.equal(skipped.skipped, true);
    assert.equal(skipped.notified, false);

    let postedBody = null;
    const fetchImpl = async (url, init) => {
      assert.match(url, /^https:\/\//);
      postedBody = JSON.parse(init.body);
      return { status: 204, text: async () => '' };
    };

    const posted = await notifyFromDecision({
      decision: {
        action: 'open_shape_pr',
        reason: 'structural_drift',
        captureId: 'c1',
        capture: {
          byEndpoint: {
            'content-post': {
              hasDrift: true,
              added: [],
              removed: ['creator.discoverable'],
              typeChanged: [],
            },
          },
        },
      },
      env: { FLUXER_WEBHOOK_URL: 'https://example.test/api/v1/webhooks/1/tok' },
      fetchImpl,
      prUrl: 'https://github.com/example/pr/1',
    });
    assert.equal(posted.notified, true);
    assert.equal(posted.webhook.includes('redacted'), true);
    assert.ok(!JSON.stringify(posted).includes('/tok'));
    assert.match(postedBody.embeds[0].fields.find((f) => f.name === 'content-post').value, /discoverable/);
  });

  it('dry-run does not call fetch', async () => {
    let called = false;
    const r = await notifyFromDecision({
      decision: { action: 'open_monitor_pr', phase1: { buildId: 'x' } },
      env: { FLUXER_WEBHOOK_URL: 'https://example.test/hook' },
      dryRun: true,
      fetchImpl: async () => {
        called = true;
        return { status: 204, text: async () => '' };
      },
    });
    assert.equal(r.dryRun, true);
    assert.equal(r.notified, true);
    assert.equal(called, false);
  });
});
