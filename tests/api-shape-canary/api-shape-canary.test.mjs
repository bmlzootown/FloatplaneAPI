import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdir, rm, writeFile, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildFieldTree, flattenFieldTree, mergeFieldTrees } from '../../tools/fp-api-shape-canary/lib/field-tree.mjs';
import { diffFieldTrees } from '../../tools/fp-api-shape-canary/lib/diff.mjs';
import {
  pickCreatorIdFromSubscriptions,
  listCreatorIdsFromSubscriptions,
  pickPostIdFromCreatorList,
  pickVideoAttachmentId,
  apiGetJson,
} from '../../tools/fp-api-shape-canary/lib/probe.mjs';
import {
  discoverOidc,
  requestDeviceAuthorization,
  pollDeviceToken,
} from '../../tools/fp-api-shape-canary/lib/device-flow.mjs';
import { runCapture, resolveAccessToken } from '../../tools/fp-api-shape-canary/lib/run.mjs';
import { EXIT, OIDC } from '../../tools/fp-api-shape-canary/lib/constants.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TMP = path.join(__dirname, '.tmp-api-shape');
const FIXTURES = path.join(__dirname, 'fixtures');

before(async () => {
  await rm(TMP, { recursive: true, force: true });
  await mkdir(TMP, { recursive: true });
});

after(async () => {
  await rm(TMP, { recursive: true, force: true });
});

describe('field-tree', () => {
  it('builds nested types without retaining values', () => {
    const tree = buildFieldTree({
      id: 'abc',
      title: 'secret title',
      tags: ['a', 'b'],
      thumbnail: null,
      meta: { n: 1, ok: true },
    });
    assert.equal(tree.type, 'object');
    assert.equal(tree.properties.id.type, 'string');
    assert.equal(tree.properties.title.type, 'string');
    assert.equal(tree.properties.tags.type, 'array');
    assert.equal(tree.properties.tags.items.type, 'string');
    assert.equal(tree.properties.thumbnail.type, 'null');
    assert.equal(tree.properties.meta.properties.n.type, 'number');
    const flat = flattenFieldTree(tree);
    assert.ok(flat['title']);
    assert.ok(!JSON.stringify(tree).includes('secret title'));
  });

  it('merges heterogeneous array item objects', () => {
    const merged = mergeFieldTrees(
      buildFieldTree({ a: 1 }),
      buildFieldTree({ a: null, b: 'x' }),
    );
    const types = Array.isArray(merged.properties.a.type)
      ? merged.properties.a.type.slice().sort()
      : [merged.properties.a.type];
    assert.deepEqual(types, ['null', 'number']);
    assert.equal(merged.properties.b.type, 'string');
    assert.equal(merged.properties.b.optionallyAbsent, true);
  });
});

describe('structural diff', () => {
  it('detects added, removed, and type-changed paths', () => {
    const from = buildFieldTree({ id: '1', score: 1, nested: { a: true } });
    const to = buildFieldTree({ id: '1', score: '1', extra: false });
    const d = diffFieldTrees(from, to);
    assert.equal(d.hasDrift, true);
    assert.ok(d.added.includes('extra'));
    assert.ok(d.removed.includes('nested') || d.removed.includes('nested.a'));
    assert.ok(d.typeChanged.some((c) => c.path === 'score'));
  });

  it('reports no drift for identical trees', () => {
    const t = buildFieldTree({ id: 'x', items: [{ n: 1 }] });
    const d = diffFieldTrees(t, structuredClone(t));
    assert.equal(d.hasDrift, false);
    assert.equal(d.added.length, 0);
    assert.equal(d.removed.length, 0);
    assert.equal(d.typeChanged.length, 0);
  });
});

describe('id pickers', () => {
  it('picks creator and post ids from common shapes', () => {
    assert.equal(
      pickCreatorIdFromSubscriptions([{ creator: { id: 'c1' } }]),
      'c1',
    );
    assert.equal(
      pickCreatorIdFromSubscriptions([{ creator: 'c-string-id', plan: { creator: 'c2' } }]),
      'c-string-id',
    );
    assert.deepEqual(
      listCreatorIdsFromSubscriptions([
        { creator: 'a' },
        { creator: 'b' },
        { creator: 'a' },
      ]),
      ['a', 'b'],
    );
    assert.equal(pickPostIdFromCreatorList([{ id: 'p1', title: 't' }]), 'p1');
    assert.equal(
      pickVideoAttachmentId({ videoAttachments: [{ id: 'v1' }] }),
      'v1',
    );
    assert.equal(pickVideoAttachmentId({ videoAttachments: ['v2'] }), 'v2');
  });
});

describe('device-flow (mocked)', () => {
  it('discovers device endpoints and completes poll', async () => {
    const wellKnown = {
      issuer: OIDC.issuer,
      device_authorization_endpoint: 'https://auth.example/device',
      token_endpoint: 'https://auth.example/token',
      grant_types_supported: [OIDC.grantTypeDeviceCode],
      scopes_supported: ['openid'],
    };
    let pollCount = 0;
    const fetchImpl = async (url, init) => {
      if (String(url).includes('well-known')) {
        return jsonResponse(wellKnown);
      }
      if (String(url).includes('/device')) {
        const body = String(init.body);
        assert.ok(body.includes('client_id=fp-tv-app'));
        assert.ok(body.includes('code_challenge_method=S256'));
        assert.ok(body.includes('code_challenge='));
        return jsonResponse({
          device_code: 'dev-1',
          user_code: 'ABCD-EFGH',
          verification_uri: 'https://auth.example/device',
          expires_in: 60,
          interval: 1,
        });
      }
      if (String(url).includes('/token')) {
        pollCount += 1;
        const body = String(init.body);
        assert.ok(body.includes('code_verifier='));
        assert.ok(init.headers.dpop || init.headers.DPoP, 'DPoP header required');
        if (pollCount < 2) {
          return jsonResponse({ error: 'authorization_pending' }, 400);
        }
        return jsonResponse({
          access_token: 'access-token-value',
          token_type: 'DPoP',
          expires_in: 300,
        });
      }
      throw new Error(`unexpected url ${url}`);
    };

    const discovery = await discoverOidc({
      fetchImpl,
      wellKnownUrl: 'https://auth.example/.well-known/openid-configuration',
    });
    const started = await requestDeviceAuthorization({ discovery, fetchImpl });
    assert.equal(started.userCode, 'ABCD-EFGH');
    assert.ok(started.codeVerifier);
    const sleeps = [];
    const token = await pollDeviceToken({
      discovery,
      deviceCode: started.deviceCode,
      codeVerifier: started.codeVerifier,
      fetchImpl,
      intervalSec: 0,
      expiresInSec: 30,
      sleep: async (ms) => {
        sleeps.push(ms);
      },
      now: (() => {
        let t = 0;
        return () => {
          t += 1;
          return t;
        };
      })(),
    });
    assert.equal(token.accessToken, 'access-token-value');
    assert.ok(sleeps.length >= 1);
  });
});

describe('capture orchestration (mocked)', () => {
  it('exits NEEDS_AUTH without token', async () => {
    const result = await runCapture({
      artifactsRoot: path.join(TMP, 'arts-no-token'),
      accessToken: null,
      dryRun: true,
    });
    assert.equal(result.exitCode, EXIT.NEEDS_AUTH);
  });

  it('captures allowlist field trees and seeds baselines on first content-post', async () => {
    const artifactsRoot = path.join(TMP, 'arts-capture');
    const bodies = {
      '/api/v3/user/self': { id: 'u1', username: 'tester' },
      '/api/v3/user/subscriptions': [{ creator: { id: 'c1' } }],
      '/api/v3/content/creator': [{ id: 'p1', title: 'Post', textMarkdown: 'x', selfUserInteraction: [] }],
      '/api/v3/content/post': {
        id: 'p1',
        title: 'Post',
        textMarkdown: 'x',
        selfUserInteraction: [],
        videoAttachments: ['v1'],
        metadata: { displayDuration: 12 },
      },
      '/api/v3/content/video': { id: 'v1', type: 'video' },
    };
    const fetchImpl = async (url) => {
      const u = new URL(url);
      const body = bodies[u.pathname];
      if (!body) return jsonResponse({ error: 'missing' }, 404);
      return jsonResponse(body);
    };

    const result = await runCapture({
      artifactsRoot,
      accessToken: 'test-token',
      includeOptionalVideo: true,
      fetchImpl,
      now: new Date('2026-10-02T15:00:00.000Z'),
    });
    assert.equal(result.exitCode, EXIT.SUCCESS);
    assert.ok(result.trees['content-post']);
    assert.ok(result.dir);
    const baseline = JSON.parse(
      await readFile(path.join(artifactsRoot, 'baselines', 'content-post.schema.json'), 'utf8'),
    );
    assert.equal(baseline.tree.properties.textMarkdown.type, 'string');
    assert.ok(!JSON.stringify(baseline).includes('Post'));

    // Second capture with type change → drift
    bodies['/api/v3/content/post'] = {
      id: 'p1',
      title: 'Post',
      textMarkdown: 'x',
      selfUserInteraction: [],
      videoAttachments: ['v1'],
      metadata: { displayDuration: '12' },
    };
    const result2 = await runCapture({
      artifactsRoot,
      accessToken: 'test-token',
      fetchImpl,
      now: new Date('2026-10-02T16:00:00.000Z'),
    });
    assert.equal(result2.exitCode, EXIT.DRIFT);
    assert.equal(result2.diff.hasDrift, true);
  });

  it('resolveAccessToken reads file and env without inventing', async () => {
    assert.equal(await resolveAccessToken({ env: {} }), null);
    assert.equal(await resolveAccessToken({ token: 'abc', env: {} }), 'abc');
    const tokenPath = path.join(TMP, 'tok.txt');
    await writeFile(tokenPath, 'from-file\n', 'utf8');
    assert.equal(await resolveAccessToken({ tokenFile: tokenPath, env: {} }), 'from-file');
    assert.equal(
      await resolveAccessToken({ tokenFile: tokenPath, env: { FP_ACCESS_TOKEN: 'from-env' } }),
      'from-env',
    );
  });
});

describe('apiGetJson', () => {
  it('attaches Bearer and never requires cookie', async () => {
    /** @type {Record<string,string>|null} */
    let seen = null;
    const fetchImpl = async (_url, init) => {
      seen = init.headers;
      return jsonResponse({ ok: true });
    };
    const res = await apiGetJson({
      path: '/api/v3/user/self',
      accessToken: 'tok',
      fetchImpl,
    });
    assert.equal(res.ok, true);
    assert.equal(seen.authorization, 'Bearer tok');
    assert.equal(seen.cookie, undefined);
  });
});

describe('sanitize examples', () => {
  it('redacts PII and content while preserving structure', async () => {
    const { sanitizeExampleValue, sanitizeEndpointExample } = await import(
      '../../tools/fp-api-shape-canary/lib/sanitize.mjs'
    );
    const live = {
      id: '59f94c0bdd241b70349eb72b',
      title: 'Secret live title',
      text: 'Secret HTML body',
      textMarkdown: 'Secret **markdown**',
      email: 'brandon@example.com',
      username: 'real_user',
      displayName: 'Real Name',
      paymentID: 'pay_live_abc',
      selfUserInteraction: null,
      metadata: { hasVideo: true, displayDuration: 12.5 },
      thumbnail: { path: 'https://cdn.floatplane.com/secret.jpg', width: 100, height: 50 },
      videoAttachments: [
        {
          id: 'aaaaaaaaaaaaaaaaaaaaaaaa',
          levels: [{ name: '1080p', width: 1920, height: 1080, label: '1080p', order: 1 }],
          textTracks: [],
          selfUserInteraction: null,
        },
      ],
    };
    const out = sanitizeExampleValue(live);
    assert.equal(out.title, 'Example title (redacted)');
    assert.equal(out.textMarkdown, 'Example post body (**redacted**).');
    assert.equal(out.email, 'user@example.invalid');
    assert.equal(out.username, 'example_user');
    assert.equal(out.paymentID, 'pay_example_redacted');
    assert.equal(out.selfUserInteraction, null);
    assert.equal(out.metadata.hasVideo, true);
    assert.equal(out.metadata.displayDuration, 12.5);
    assert.equal(out.thumbnail.path, 'https://cdn.example.invalid/redacted.jpg');
    assert.ok(out.videoAttachments[0].levels[0].width === 1920);
    assert.ok(!JSON.stringify(out).includes('Secret'));
    assert.ok(!JSON.stringify(out).includes('brandon@'));
    assert.ok(!JSON.stringify(out).includes('real_user'));

    const doc = sanitizeEndpointExample('content-post', live);
    assert.equal(doc.endpointId, 'content-post');
    assert.equal(doc.value.id, '000000000000000000000000');
  });

  it('keeps list shape but caps items', async () => {
    const { sanitizeEndpointExample } = await import(
      '../../tools/fp-api-shape-canary/lib/sanitize.mjs'
    );
    const doc = sanitizeEndpointExample(
      'user-subscriptions',
      [
        { creator: 'aaaaaaaaaaaaaaaaaaaaaaaa', paymentID: 'pay1', plan: { title: 'Plan A' } },
        { creator: 'bbbbbbbbbbbbbbbbbbbbbbbb', paymentID: 'pay2', plan: { title: 'Plan B' } },
      ],
      { maxItems: 1 },
    );
    assert.equal(doc.value.length, 1);
    assert.equal(doc.value[0].paymentID, 'pay_example_redacted');
    assert.equal(doc.value[0].plan.title, 'Example title (redacted)');
  });
});

describe('fixture schema files', () => {
  it('diffs fixture trees offline', async () => {
    const from = JSON.parse(await readFile(path.join(FIXTURES, 'content-post-baseline.schema.json'), 'utf8'));
    const to = JSON.parse(await readFile(path.join(FIXTURES, 'content-post-drift.schema.json'), 'utf8'));
    const d = diffFieldTrees(from.tree, to.tree);
    assert.equal(d.hasDrift, true);
    assert.ok(d.added.includes('textMarkdown') || d.added.some((p) => p.includes('textMarkdown')));
  });
});

function jsonResponse(body, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: { get: () => 'application/json' },
    url: 'https://mock',
    text: async () => JSON.stringify(body),
    json: async () => body,
    arrayBuffer: async () => Buffer.from(JSON.stringify(body)),
  };
}
