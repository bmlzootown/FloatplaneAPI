import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  buildNotifyPayload,
  formatEndpointExample,
  humanEndpointName,
  shapeHeadline,
  shouldNotify,
} from '../../tools/fp-notify/lib/payloads.mjs';
import {
  buildBeforeAfter,
  formatBeforeAfterField,
  jsonValueToFields,
  placeholderFor,
  sanitizeSample,
  splitTextPreserveLines,
} from '../../tools/fp-notify/lib/before-after.mjs';
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

describe('shape payload human copy + before/after', () => {
  it('uses a human headline and illustrative before/after for removed field', () => {
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
            typeHints: { 'creator.discoverable': 'boolean', 'creator.newField': 'string' },
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
    assert.match(embed.title, /Floatplane changed the shape of content posts/i);
    assert.doesNotMatch(embed.title, /open_shape_pr|structural_drift/i);
    assert.doesNotMatch(embed.description, /Reason: `structural_drift`/);

    const ep = embed.fields.find((f) => /content posts/i.test(f.name));
    assert.ok(ep);
    assert.match(ep.value, /creator\.discoverable/);
    assert.match(ep.value, /creator\.newField/);

    const beforeIll = embed.fields.find((f) => /Before \(illustrative\)/i.test(f.name));
    const afterIll = embed.fields.find((f) => /After \(illustrative\)/i.test(f.name));
    assert.ok(beforeIll);
    assert.ok(afterIll);
    assert.equal(beforeIll.inline, true);
    assert.equal(afterIll.inline, true);
    assert.match(beforeIll.value, /discoverable/);
    assert.match(afterIll.value, /newField|Illustrative/i);

    // Action / capture are secondary (footer), not headline fields.
    assert.ok(!embed.fields.some((f) => f.name === 'Action'));
    assert.ok(!embed.fields.some((f) => f.name === 'Capture'));
    assert.match(embed.footer.text, /open_shape_pr/);
    assert.match(embed.footer.text, /c-test/);

    assert.ok(JSON.stringify(built.payload).length < 5500);
  });

  it('headlines a single removal clearly (PR #13 style)', () => {
    const by = {
      'content-post': {
        hasDrift: true,
        added: [],
        removed: ['creator.discoverable'],
        typeChanged: [],
        typeHints: { 'creator.discoverable': 'boolean' },
      },
    };
    assert.equal(
      shapeHeadline(['content-post'], by),
      'Floatplane removed a field from content posts',
    );
    assert.equal(humanEndpointName('content-post'), 'content posts');

    const ba = buildBeforeAfter(by['content-post']);
    assert.equal(ba.source, 'illustrative');
    assert.equal(ba.before?.creator?.discoverable, true);
    assert.ok(ba.after?.creator);
    assert.equal('discoverable' in (ba.after.creator || {}), false);
  });

  it('prefers sanitized capture samples when present', () => {
    const ba = buildBeforeAfter({
      hasDrift: true,
      removed: ['creator.discoverable'],
      sampleBefore: { creator: { id: 'abc', discoverable: true, email: 'hide@me' } },
      sampleAfter: { creator: { id: 'abc' } },
    });
    assert.equal(ba.source, 'capture');
    assert.match(ba.label, /live sanitized/i);
    assert.equal(ba.before.creator.email, '[redacted]');
    assert.equal(ba.before.creator.discoverable, true);
    assert.equal(ba.after.creator.discoverable, undefined);
  });

  it('renders live samples as side-by-side inline Before/After fields', () => {
    const built = buildNotifyPayload({
      action: 'update_shape_pr',
      captureId: 'c-live',
      decidedAt: '2026-10-26T03:01:00.000Z',
      capture: {
        captureId: 'c-live',
        byEndpoint: {
          'content-post': {
            hasDrift: true,
            removed: ['creator.discoverable'],
            added: [],
            typeChanged: [],
            sampleBefore: {
              id: 'post1',
              title: 'LTT sample',
              creator: { id: '59f94c0bdd241b70349eb72b', title: 'LinusTechTips', discoverable: true },
            },
            sampleAfter: {
              id: 'post1',
              title: 'LTT sample',
              creator: { id: '59f94c0bdd241b70349eb72b', title: 'LinusTechTips' },
            },
          },
        },
      },
    }, { prUrl: 'https://github.com/bmlzootown/FloatplaneAPI/pull/13' });
    assert.equal(built.skipped, false);
    const embed = built.payload.embeds[0];
    const before = embed.fields.find((f) => /^Before \(live sanitized\)$/i.test(f.name));
    const after = embed.fields.find((f) => /^After \(live sanitized\)$/i.test(f.name));
    assert.ok(before);
    assert.ok(after);
    assert.equal(before.inline, true);
    assert.equal(after.inline, true);
    // Consecutive inline fields → Discord/Fluxer one-row layout.
    const bi = embed.fields.indexOf(before);
    const ai = embed.fields.indexOf(after);
    assert.equal(ai, bi + 1);
    assert.ok(before.value.length <= 1024);
    assert.ok(after.value.length <= 1024);
    assert.match(before.value, /discoverable/);
    assert.match(after.value, /LinusTechTips/);
    // Full ids — no silent mid-JSON ellipsis.
    assert.match(before.value, /59f94c0bdd241b70349eb72b/);
    assert.doesNotMatch(before.value, /…/);
    assert.ok(!embed.fields.some((f) => /illustrative/i.test(f.value)));
  });

  it('splits oversized JSON into continued fields without mid-JSON ellipsis', () => {
    /** @type {Record<string, string>} */
    const big = { id: '59f94c0bdd241b70349eb72b', owner: '59f94c0bdd241b70349eb72b' };
    for (let i = 0; i < 40; i++) {
      big[`field${i}`] = `value-${i}-abcdefghijklmnopqrstuvwxyz`;
    }
    const fields = jsonValueToFields(big, 'Before (live sanitized)');
    assert.ok(fields.length >= 2);
    assert.match(fields[0].name, /1\/\d+/);
    assert.match(fields[0].value, /_continued_/);
    const joined = fields.map((f) => f.value).join('\n');
    assert.doesNotMatch(joined.replace(/```json|```|_continued_/g, ''), /…/);
    // Reconstruct: strip fences and continued markers; should parse as complete JSON when joined properly.
    const jsonParts = fields.map((f) =>
      f.value
        .replace(/^```json\n/, '')
        .replace(/\n```[\s\S]*$/, ''),
    );
    const reconstructed = jsonParts.join('\n');
    const parsed = JSON.parse(reconstructed);
    assert.equal(parsed.id, '59f94c0bdd241b70349eb72b');
    assert.equal(parsed.owner, '59f94c0bdd241b70349eb72b');
    assert.equal(parsed.field39, 'value-39-abcdefghijklmnopqrstuvwxyz');
    for (const f of fields) assert.ok(f.value.length <= 1024);
  });

  it('splitTextPreserveLines never inserts ellipsis', () => {
    const text = Array.from({ length: 30 }, (_, i) => `  "k${i}": "v${i}",`).join('\n');
    const parts = splitTextPreserveLines(text, 100);
    assert.ok(parts.length > 1);
    assert.equal(parts.join('\n'), text);
    assert.ok(parts.every((p) => !p.includes('…')));
  });

  it('sanitizeSample keeps long non-secret strings intact', () => {
    const id = '59f94c0bdd241b70349eb72b';
    const title = `Hello world ${'abc '.repeat(40)}`;
    const s = sanitizeSample({
      owner: id,
      title,
      email: 'a@b.c',
    });
    assert.equal(s.owner, id);
    assert.equal(s.title, title);
    assert.equal(s.email, '[redacted]');
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
    assert.ok(formatBeforeAfterField({ added: many, removed: [] }).length <= MAX_FIELD_VALUE);
  });

  it('sanitizeSample redacts tokens', () => {
    const s = sanitizeSample({
      accessToken: 'eyJhbGciOiJIUzI1NiJ9.abc.def',
      title: 'ok',
    });
    assert.equal(s.accessToken, '[redacted]');
    assert.equal(s.title, 'ok');
    assert.equal(placeholderFor('discoverable', 'boolean'), true);
  });
});

describe('frontend payload', () => {
  it('summarizes build without inventing API claims', () => {
    const built = buildNotifyPayload(
      {
        action: 'update_monitor_pr',
        reason: 'phase1_drives_pr_phase2_enriches_body',
        orchestratorId: 'phase2.3-frontend-evidence-orchestrate',
        phase1: {
          action: 'update_monitor_pr',
          buildId: '4.5.25-340-92712da',
          comparisonSummary: 'New frontend build id: 4.5.22-316-d74397b → 4.5.25-340-92712da',
        },
        phase2: {
          headline: '350 structured op(s) disappeared from frontend evidence; 27 provenance move(s)',
        },
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
    const embed = built.payload.embeds[0];
    assert.match(embed.title, /New frontend build observed/i);
    assert.doesNotMatch(embed.title, /open_monitor_pr|Phase/i);
    const desc = embed.description;
    assert.match(desc, /not.*server API/i);
    assert.doesNotMatch(desc, /OpenAPI schema changed/i);
    assert.match(desc, /4\.5\.25-340-92712da/);
    assert.match(desc, /4\.5\.22-316-d74397b/);
    assert.ok(!embed.fields.some((f) => f.name === 'Action' || f.name === 'Phase 1'));
    const saw = embed.fields.find((f) => f.name === 'What we saw');
    assert.ok(saw);
    assert.match(saw.value, /350 structured/);
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
              typeHints: { 'creator.discoverable': 'boolean' },
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
    assert.match(postedBody.embeds[0].title, /removed a field/i);
    const before = postedBody.embeds[0].fields.find((f) => /Before \(illustrative\)/i.test(f.name));
    const after = postedBody.embeds[0].fields.find((f) => /After \(illustrative\)/i.test(f.name));
    assert.ok(before);
    assert.ok(after);
    assert.equal(before.inline, true);
    assert.equal(after.inline, true);
    assert.match(before.value, /discoverable/);
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
