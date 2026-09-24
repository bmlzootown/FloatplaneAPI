import { describe, it, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, mkdir, rm, writeFile, access } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { discoverFromHomepageHtml, DiscoveryError } from '../../tools/fp-frontend-watch/lib/discover.mjs';
import { validateArtifact, ArtifactError } from '../../tools/fp-frontend-watch/lib/validate-artifact.mjs';
import { compareStates } from '../../tools/fp-frontend-watch/lib/compare.mjs';
import { loadState, normalizeState, StateError, saveState } from '../../tools/fp-frontend-watch/lib/state.mjs';
import { runCheck } from '../../tools/fp-frontend-watch/lib/check.mjs';
import { sha256 } from '../../tools/fp-frontend-watch/lib/hash.mjs';
import { SCHEMA_VERSION } from '../../tools/fp-frontend-watch/lib/constants.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FIXTURES = path.join(__dirname, 'fixtures');
const TMP = path.join(__dirname, '.tmp-watch');

async function readFixture(name) {
  return readFile(path.join(FIXTURES, name));
}

async function readFixtureText(name) {
  return (await readFixture(name)).toString('utf8');
}

/**
 * Offline mock fetch: maps known URLs to fixture bytes. No network.
 * @param {Record<string, { status?: number, contentType?: string, body: Buffer, finalUrl?: string }>} map
 */
function mockFetch(map) {
  return async (url) => {
    const entry = map[url];
    if (!entry) {
      return {
        status: 404,
        headers: { get: () => 'text/plain' },
        url,
        arrayBuffer: async () => Buffer.from('not found'),
      };
    }
    return {
      status: entry.status ?? 200,
      headers: {
        get: (name) => {
          if (name.toLowerCase() === 'content-type') return entry.contentType ?? 'application/octet-stream';
          if (name.toLowerCase() === 'content-length') return String(entry.body.length);
          return null;
        },
      },
      url: entry.finalUrl ?? url,
      arrayBuffer: async () => entry.body,
    };
  };
}

async function viteFixtureMap(opts = {}) {
  const homepage = await readFixture('homepage-vite.html');
  const entryName = opts.changedEntry ? 'index-BZVDPgzb-changed.js' : 'index-BZVDPgzb.js';
  const entry = await readFixture(entryName);
  const manifest = await readFixture('manifest.json');
  const buildId = '4.5.22-316-d74397b';
  return {
    'https://www.floatplane.com/': {
      contentType: 'text/html; charset=utf-8',
      body: opts.homepageBody || homepage,
    },
    [`https://frontend.floatplane.com/user/${buildId}/js/index-BZVDPgzb.js`]: {
      contentType: 'application/javascript',
      body: entry,
    },
    [`https://frontend.floatplane.com/user/${buildId}/manifest.floatplane.webmanifest`]: {
      contentType: 'application/manifest+json',
      body: manifest,
    },
  };
}

before(async () => {
  await rm(TMP, { recursive: true, force: true });
  await mkdir(TMP, { recursive: true });
});

after(async () => {
  await rm(TMP, { recursive: true, force: true });
});

describe('discoverFromHomepageHtml', () => {
  it('extracts vite-user build id and artifact paths', async () => {
    const html = await readFixtureText('homepage-vite.html');
    const d = discoverFromHomepageHtml(html);
    assert.equal(d.buildId, '4.5.22-316-d74397b');
    assert.equal(d.layout, 'vite-user');
    assert.equal(d.entryPath, 'js/index-BZVDPgzb.js');
    assert.equal(d.manifestPath, 'manifest.floatplane.webmanifest');
    assert.ok(d.artifactPaths.includes('js/index-BZVDPgzb.js'));
  });

  it('supports legacy angular layout', async () => {
    const html = await readFixtureText('homepage-angular.html');
    const d = discoverFromHomepageHtml(html);
    assert.equal(d.buildId, '4.0.13');
    assert.equal(d.layout, 'angular-version');
    assert.deepEqual(d.artifactPaths, ['runtime.js', 'polyfills.js', 'scripts.js', 'main.js']);
  });

  it('rejects HTML without frontend refs', () => {
    assert.throws(
      () => discoverFromHomepageHtml('<html><body>nope</body></html>'),
      DiscoveryError,
    );
  });

  it('rejects empty/non-html', () => {
    assert.throws(() => discoverFromHomepageHtml(''), DiscoveryError);
    assert.throws(() => discoverFromHomepageHtml('{"json":true}'), DiscoveryError);
  });
});

describe('validateArtifact', () => {
  it('accepts javascript', () => {
    const body = Buffer.from('console.log(1)');
    const meta = validateArtifact({
      path: 'js/index.js',
      status: 200,
      contentType: 'application/javascript',
      body,
      finalUrl: 'https://frontend.floatplane.com/user/x/js/index.js',
      requestedUrl: 'https://frontend.floatplane.com/user/x/js/index.js',
    });
    assert.equal(meta.bytes, body.length);
    assert.equal(meta.sha256, sha256(body));
  });

  it('rejects HTTP errors', () => {
    assert.throws(
      () =>
        validateArtifact({
          path: 'main.js',
          status: 500,
          contentType: 'application/javascript',
          body: Buffer.from('x'),
          finalUrl: 'https://frontend.floatplane.com/x/main.js',
          requestedUrl: 'https://frontend.floatplane.com/x/main.js',
        }),
      ArtifactError,
    );
  });

  it('rejects empty body', () => {
    assert.throws(
      () =>
        validateArtifact({
          path: 'main.js',
          status: 200,
          contentType: 'application/javascript',
          body: Buffer.alloc(0),
          finalUrl: 'https://frontend.floatplane.com/x/main.js',
          requestedUrl: 'https://frontend.floatplane.com/x/main.js',
        }),
      ArtifactError,
    );
  });

  it('rejects HTML-as-JS', () => {
    assert.throws(
      () =>
        validateArtifact({
          path: 'main.js',
          status: 200,
          contentType: 'application/javascript',
          body: Buffer.from('<!doctype html><html><body>login</body></html>'),
          finalUrl: 'https://frontend.floatplane.com/x/main.js',
          requestedUrl: 'https://frontend.floatplane.com/x/main.js',
        }),
      ArtifactError,
    );
  });

  it('rejects cross-host redirect', () => {
    assert.throws(
      () =>
        validateArtifact({
          path: 'main.js',
          status: 200,
          contentType: 'application/javascript',
          body: Buffer.from('ok'),
          finalUrl: 'https://evil.example/main.js',
          requestedUrl: 'https://frontend.floatplane.com/x/main.js',
        }),
      ArtifactError,
    );
  });

  it('rejects invalid manifest JSON', () => {
    assert.throws(
      () =>
        validateArtifact({
          path: 'manifest.floatplane.webmanifest',
          status: 200,
          contentType: 'application/json',
          body: Buffer.from('not-json'),
          finalUrl: 'https://frontend.floatplane.com/user/x/manifest.floatplane.webmanifest',
          requestedUrl: 'https://frontend.floatplane.com/user/x/manifest.floatplane.webmanifest',
        }),
      ArtifactError,
    );
  });
});

describe('compareStates', () => {
  it('detects first observation', () => {
    const current = normalizeState(JSON.parse(
      // use fixture then fix — compare only needs shape
      `{
        "schemaVersion": 1,
        "buildId": "a",
        "layout": "vite-user",
        "baseUrl": "https://frontend.floatplane.com/user/a/",
        "homepageUrl": "https://www.floatplane.com/",
        "discoveryMethod": "homepage-html-asset-urls",
        "observedAt": "2026-01-01T00:00:00.000Z",
        "artifactDir": "artifacts/frontend/a",
        "artifacts": [{"path":"main.js","url":"u","sha256":"${'a'.repeat(64)}","bytes":1}]
      }`,
    ));
    const r = compareStates(null, current);
    assert.equal(r.status, 'first_observation');
  });

  it('detects new build id', async () => {
    const prev = normalizeState(JSON.parse(await readFixtureText('state-known-good.json')));
    const cur = {
      ...prev,
      buildId: '9.9.9-1-abcdef0',
      baseUrl: 'https://frontend.floatplane.com/user/9.9.9-1-abcdef0/',
      artifactDir: 'artifacts/frontend/9.9.9-1-abcdef0',
    };
    const r = compareStates(prev, cur);
    assert.equal(r.status, 'new_build');
  });

  it('detects same id + changed hash', async () => {
    const prev = normalizeState(JSON.parse(await readFixtureText('state-known-good.json')));
    const cur = structuredClone(prev);
    cur.artifacts[0].sha256 = 'd'.repeat(64);
    const r = compareStates(prev, cur);
    assert.equal(r.status, 'content_changed');
    assert.equal(r.changedArtifacts[0].path, 'js/index-BZVDPgzb.js');
  });

  it('reports unchanged when identical', async () => {
    const prev = normalizeState(JSON.parse(await readFixtureText('state-known-good.json')));
    const r = compareStates(prev, structuredClone(prev));
    assert.equal(r.status, 'unchanged');
  });
});

describe('state load/save', () => {
  it('rejects malformed state', async () => {
    await assert.rejects(
      () => loadState(path.join(FIXTURES, 'state-malformed.json')),
      StateError,
    );
  });

  it('round-trips valid state', async () => {
    const dir = path.join(TMP, 'state-roundtrip');
    await mkdir(dir, { recursive: true });
    const statePath = path.join(dir, 'last.json');
    const original = normalizeState(JSON.parse(await readFixtureText('state-known-good.json')));
    await saveState(statePath, original);
    const loaded = await loadState(statePath);
    assert.deepEqual(loaded, original);
  });
});

describe('runCheck offline', () => {
  beforeEach(async () => {
    await rm(path.join(TMP, 'run'), { recursive: true, force: true });
    await mkdir(path.join(TMP, 'run'), { recursive: true });
  });

  it('identical observations → unchanged; preserves last-known-good', async () => {
    const root = path.join(TMP, 'run', 'identical');
    const statePath = path.join(root, 'state.json');
    const artifactsRoot = path.join(root, 'artifacts');
    const map = await viteFixtureMap();
    const fetchImpl = mockFetch(map);

    const first = await runCheck({
      repoRoot: root,
      statePath,
      artifactsRoot,
      fetchImpl,
      now: new Date('2026-02-01T00:00:00.000Z'),
    });
    assert.equal(first.ok, true);
    assert.equal(first.changed, true);
    assert.equal(first.comparison.status, 'first_observation');

    const stateAfterFirst = await readFile(statePath, 'utf8');

    const second = await runCheck({
      repoRoot: root,
      statePath,
      artifactsRoot,
      fetchImpl,
      now: new Date('2026-02-02T00:00:00.000Z'),
    });
    assert.equal(second.ok, true);
    assert.equal(second.changed, false);
    assert.equal(second.comparison.status, 'unchanged');

    const stateAfterSecond = await readFile(statePath, 'utf8');
    assert.equal(stateAfterSecond, stateAfterFirst, 'unchanged check must not rewrite state');
  });

  it('new version → change detected', async () => {
    const root = path.join(TMP, 'run', 'newver');
    const statePath = path.join(root, 'state.json');
    const artifactsRoot = path.join(root, 'artifacts');

    const firstMap = await viteFixtureMap();
    const first = await runCheck({
      repoRoot: root,
      statePath,
      artifactsRoot,
      fetchImpl: mockFetch(firstMap),
    });
    assert.equal(first.ok, true);

    const newHome = await readFixture('homepage-vite-new.html');
    const newEntry = await readFixture('index-NEWHASH.js');
    const manifest = await readFixture('manifest.json');
    const secondMap = {
      'https://www.floatplane.com/': { contentType: 'text/html', body: newHome },
      'https://frontend.floatplane.com/user/9.9.9-1-abcdef0/js/index-NEWHASH.js': {
        contentType: 'application/javascript',
        body: newEntry,
      },
      'https://frontend.floatplane.com/user/9.9.9-1-abcdef0/manifest.floatplane.webmanifest': {
        contentType: 'application/json',
        body: manifest,
      },
    };

    const second = await runCheck({
      repoRoot: root,
      statePath,
      artifactsRoot,
      fetchImpl: mockFetch(secondMap),
    });
    assert.equal(second.ok, true);
    assert.equal(second.changed, true);
    assert.equal(second.comparison.status, 'new_build');
    assert.equal(second.current.buildId, '9.9.9-1-abcdef0');
  });

  it('same id + changed hash → content_changed; preserves prior artifact bytes in conflict', async () => {
    const root = path.join(TMP, 'run', 'sameid');
    const statePath = path.join(root, 'state.json');
    const artifactsRoot = path.join(root, 'artifacts');

    const first = await runCheck({
      repoRoot: root,
      statePath,
      artifactsRoot,
      fetchImpl: mockFetch(await viteFixtureMap()),
    });
    assert.equal(first.ok, true);

    const originalEntryPath = path.join(
      artifactsRoot,
      '4.5.22-316-d74397b',
      'js',
      'index-BZVDPgzb.js',
    );
    const originalBytes = await readFile(originalEntryPath);

    const second = await runCheck({
      repoRoot: root,
      statePath,
      artifactsRoot,
      fetchImpl: mockFetch(await viteFixtureMap({ changedEntry: true })),
    });
    assert.equal(second.ok, true);
    assert.equal(second.changed, true);
    assert.equal(second.comparison.status, 'content_changed');
    assert.ok(second.noteworthy.length > 0);

    // Original archived bytes must remain intact.
    assert.deepEqual(await readFile(originalEntryPath), originalBytes);

    // Conflict copy exists.
    const conflictRoot = path.join(artifactsRoot, '4.5.22-316-d74397b', '_conflicts');
    await access(conflictRoot);
  });

  it('malformed state → failure; does not overwrite state file', async () => {
    const root = path.join(TMP, 'run', 'badstate');
    await mkdir(root, { recursive: true });
    const statePath = path.join(root, 'state.json');
    const bad = await readFixtureText('state-malformed.json');
    await writeFile(statePath, bad);
    const artifactsRoot = path.join(root, 'artifacts');

    const result = await runCheck({
      repoRoot: root,
      statePath,
      artifactsRoot,
      fetchImpl: mockFetch(await viteFixtureMap()),
    });
    assert.equal(result.ok, false);
    assert.equal(await readFile(statePath, 'utf8'), bad);
  });

  it('failed/invalid artifact → failure; last known-good preserved', async () => {
    const root = path.join(TMP, 'run', 'badart');
    const statePath = path.join(root, 'state.json');
    const artifactsRoot = path.join(root, 'artifacts');

    const first = await runCheck({
      repoRoot: root,
      statePath,
      artifactsRoot,
      fetchImpl: mockFetch(await viteFixtureMap()),
    });
    assert.equal(first.ok, true);
    const goodState = await readFile(statePath, 'utf8');

    const homepage = await readFixture('homepage-vite.html');
    const map = {
      'https://www.floatplane.com/': { contentType: 'text/html', body: homepage },
      'https://frontend.floatplane.com/user/4.5.22-316-d74397b/js/index-BZVDPgzb.js': {
        contentType: 'application/javascript',
        body: Buffer.from('<!doctype html><html>not js</html>'),
      },
      'https://frontend.floatplane.com/user/4.5.22-316-d74397b/manifest.floatplane.webmanifest': {
        contentType: 'application/json',
        body: await readFixture('manifest.json'),
      },
    };

    const second = await runCheck({
      repoRoot: root,
      statePath,
      artifactsRoot,
      fetchImpl: mockFetch(map),
    });
    assert.equal(second.ok, false);
    assert.equal(await readFile(statePath, 'utf8'), goodState);
  });

  it('HTTP error on artifact → failure; preserves state', async () => {
    const root = path.join(TMP, 'run', 'httperr');
    const statePath = path.join(root, 'state.json');
    const artifactsRoot = path.join(root, 'artifacts');

    await runCheck({
      repoRoot: root,
      statePath,
      artifactsRoot,
      fetchImpl: mockFetch(await viteFixtureMap()),
    });
    const goodState = await readFile(statePath, 'utf8');

    const homepage = await readFixture('homepage-vite.html');
    const map = {
      'https://www.floatplane.com/': { contentType: 'text/html', body: homepage },
      'https://frontend.floatplane.com/user/4.5.22-316-d74397b/js/index-BZVDPgzb.js': {
        status: 503,
        contentType: 'text/plain',
        body: Buffer.from('unavailable'),
      },
      'https://frontend.floatplane.com/user/4.5.22-316-d74397b/manifest.floatplane.webmanifest': {
        contentType: 'application/json',
        body: await readFixture('manifest.json'),
      },
    };

    const result = await runCheck({
      repoRoot: root,
      statePath,
      artifactsRoot,
      fetchImpl: mockFetch(map),
    });
    assert.equal(result.ok, false);
    assert.equal(await readFile(statePath, 'utf8'), goodState);
  });
});

describe('schema version constant', () => {
  it('is 1 for Phase 1', () => {
    assert.equal(SCHEMA_VERSION, 1);
  });
});
