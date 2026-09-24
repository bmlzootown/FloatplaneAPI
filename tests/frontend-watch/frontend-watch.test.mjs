import { describe, it, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, mkdir, rm, writeFile, access, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { discoverFromHomepageHtml, DiscoveryError } from '../../tools/fp-frontend-watch/lib/discover.mjs';
import { validateArtifact, ArtifactError } from '../../tools/fp-frontend-watch/lib/validate-artifact.mjs';
import { compareStates } from '../../tools/fp-frontend-watch/lib/compare.mjs';
import { loadState, normalizeState, StateError, saveState } from '../../tools/fp-frontend-watch/lib/state.mjs';
import { runCheck } from '../../tools/fp-frontend-watch/lib/check.mjs';
import { sha256 } from '../../tools/fp-frontend-watch/lib/hash.mjs';
import { observationIdFromArtifacts } from '../../tools/fp-frontend-watch/lib/observation-id.mjs';
import { SCHEMA_VERSION, STAGING_DIR_NAME } from '../../tools/fp-frontend-watch/lib/constants.mjs';

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

function sampleState(overrides = {}) {
  const defaultArtifacts = [
    {
      path: 'js/index-BZVDPgzb.js',
      url: 'https://frontend.floatplane.com/user/4.5.22-316-d74397b/js/index-BZVDPgzb.js',
      sha256: 'b'.repeat(64),
      bytes: 200,
      contentType: 'application/javascript',
    },
    {
      path: 'manifest.floatplane.webmanifest',
      url: 'https://frontend.floatplane.com/user/4.5.22-316-d74397b/manifest.floatplane.webmanifest',
      sha256: 'c'.repeat(64),
      bytes: 50,
      contentType: 'application/json',
    },
  ];
  const artifacts = overrides.artifacts || defaultArtifacts;
  const observationId = overrides.observationId || observationIdFromArtifacts(artifacts);
  return {
    schemaVersion: SCHEMA_VERSION,
    previousObservationId: null,
    buildId: '4.5.22-316-d74397b',
    layout: 'vite-user',
    baseUrl: 'https://frontend.floatplane.com/user/4.5.22-316-d74397b/',
    homepageUrl: 'https://www.floatplane.com/',
    discoveryMethod: 'homepage-html-asset-urls',
    observedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
    observationId,
    artifacts,
    artifactDir:
      overrides.artifactDir ||
      `artifacts/frontend/${overrides.buildId || '4.5.22-316-d74397b'}/${observationId}`,
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
  it('extracts vite-user build id from current layout', async () => {
    const html = await readFixtureText('homepage-vite.html');
    const d = discoverFromHomepageHtml(html);
    assert.equal(d.buildId, '4.5.22-316-d74397b');
    assert.equal(d.layout, 'vite-user');
    assert.equal(d.entryPath, 'js/index-BZVDPgzb.js');
    assert.equal(d.manifestPath, 'manifest.floatplane.webmanifest');
  });

  it('accepts Vite entry with different filename', async () => {
    const html = await readFixtureText('homepage-vite-alt-entry.html');
    const d = discoverFromHomepageHtml(html);
    assert.equal(d.entryPath, 'js/app-XyZ999.js');
    assert.equal(d.buildId, '4.5.22-316-d74397b');
  });

  it('accepts Vite entry in a different asset directory', async () => {
    const html = await readFixtureText('homepage-vite-assets-dir.html');
    const d = discoverFromHomepageHtml(html);
    assert.equal(d.entryPath, 'assets/entry-AbCdEf12.js');
  });

  it('fails on contradictory build IDs', async () => {
    const html = await readFixtureText('homepage-vite-contradictory.html');
    assert.throws(() => discoverFromHomepageHtml(html), DiscoveryError);
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

describe('observationIdFromArtifacts', () => {
  it('is deterministic and order-independent', () => {
    const a = [
      { path: 'b.js', sha256: 'b'.repeat(64) },
      { path: 'a.js', sha256: 'a'.repeat(64) },
    ];
    const b = [
      { path: 'a.js', sha256: 'a'.repeat(64) },
      { path: 'b.js', sha256: 'b'.repeat(64) },
    ];
    assert.equal(observationIdFromArtifacts(a), observationIdFromArtifacts(b));
  });

  it('changes when any hash changes', () => {
    const a = [{ path: 'a.js', sha256: 'a'.repeat(64) }];
    const b = [{ path: 'a.js', sha256: 'b'.repeat(64) }];
    assert.notEqual(observationIdFromArtifacts(a), observationIdFromArtifacts(b));
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
    const current = normalizeState(sampleState());
    const r = compareStates(null, current);
    assert.equal(r.status, 'first_observation');
  });

  it('detects new build id', () => {
    const prev = normalizeState(sampleState());
    const curArts = prev.artifacts.map((a) => ({
      ...a,
      url: a.url.replace(prev.buildId, '9.9.9-1-abcdef0'),
    }));
    const cur = normalizeState(
      sampleState({
        buildId: '9.9.9-1-abcdef0',
        baseUrl: 'https://frontend.floatplane.com/user/9.9.9-1-abcdef0/',
        artifacts: curArts,
        artifactDir: 'artifacts/frontend/9.9.9-1-abcdef0/x',
      }),
    );
    assert.equal(compareStates(prev, cur).status, 'new_build');
  });

  it('detects same id + changed hash', () => {
    const prev = normalizeState(sampleState());
    const curArts = structuredClone(prev.artifacts);
    curArts[0].sha256 = 'd'.repeat(64);
    const cur = normalizeState(sampleState({ artifacts: curArts }));
    const r = compareStates(prev, cur);
    assert.equal(r.status, 'content_changed');
    assert.equal(r.changedArtifacts[0].path, 'js/index-BZVDPgzb.js');
  });

  it('reports unchanged when identical', () => {
    const prev = normalizeState(sampleState());
    assert.equal(compareStates(prev, structuredClone(prev)).status, 'unchanged');
  });
});

describe('state load/save', () => {
  it('rejects malformed state', async () => {
    await assert.rejects(
      () => loadState(path.join(FIXTURES, 'state-malformed.json')),
      StateError,
    );
  });

  it('rejects schemaVersion 1', async () => {
    const dir = path.join(TMP, 'schema1');
    await mkdir(dir, { recursive: true });
    const p = path.join(dir, 's.json');
    await writeFile(p, JSON.stringify({ schemaVersion: 1, buildId: 'x' }));
    await assert.rejects(() => loadState(p), StateError);
  });

  it('round-trips valid state', async () => {
    const dir = path.join(TMP, 'state-roundtrip');
    await mkdir(dir, { recursive: true });
    const statePath = path.join(dir, 'last.json');
    const original = normalizeState(sampleState());
    await saveState(statePath, original);
    assert.deepEqual(await loadState(statePath), original);
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
    const fetchImpl = mockFetch(await viteFixtureMap());

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
    assert.match(first.current.observationId, /^[a-f0-9]{64}$/);
    assert.equal(first.current.previousObservationId, null);

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
    assert.equal(await readFile(statePath, 'utf8'), stateAfterFirst);
  });

  it('A→B→B same buildId: change, change, unchanged; both recoverable', async () => {
    const root = path.join(TMP, 'run', 'abb');
    const statePath = path.join(root, 'state.json');
    const artifactsRoot = path.join(root, 'artifacts');
    const buildId = '4.5.22-316-d74397b';

    const first = await runCheck({
      repoRoot: root,
      statePath,
      artifactsRoot,
      fetchImpl: mockFetch(await viteFixtureMap()),
    });
    assert.equal(first.ok, true);
    assert.equal(first.comparison.status, 'first_observation');
    const idA = first.current.observationId;
    const entryA = await readFile(path.join(artifactsRoot, buildId, idA, 'js', 'index-BZVDPgzb.js'));

    const second = await runCheck({
      repoRoot: root,
      statePath,
      artifactsRoot,
      fetchImpl: mockFetch(await viteFixtureMap({ changedEntry: true })),
    });
    assert.equal(second.ok, true);
    assert.equal(second.changed, true);
    assert.equal(second.comparison.status, 'content_changed');
    const idB = second.current.observationId;
    assert.notEqual(idA, idB);
    assert.equal(second.current.previousObservationId, idA);
    const entryB = await readFile(path.join(artifactsRoot, buildId, idB, 'js', 'index-BZVDPgzb.js'));
    assert.notDeepEqual(entryA, entryB);

    // Historical A still intact
    assert.deepEqual(
      await readFile(path.join(artifactsRoot, buildId, idA, 'js', 'index-BZVDPgzb.js')),
      entryA,
    );

    const third = await runCheck({
      repoRoot: root,
      statePath,
      artifactsRoot,
      fetchImpl: mockFetch(await viteFixtureMap({ changedEntry: true })),
    });
    assert.equal(third.ok, true);
    assert.equal(third.changed, false);
    assert.equal(third.comparison.status, 'unchanged');
    assert.equal(third.current.observationId, idB);
    assert.equal((await loadState(statePath)).observationId, idB);

    // Both A and B recoverable
    const obsDirs = await readdir(path.join(artifactsRoot, buildId));
    assert.ok(obsDirs.includes(idA));
    assert.ok(obsDirs.includes(idB));
  });

  it('new version → change detected with lineage', async () => {
    const root = path.join(TMP, 'run', 'newver');
    const statePath = path.join(root, 'state.json');
    const artifactsRoot = path.join(root, 'artifacts');

    const first = await runCheck({
      repoRoot: root,
      statePath,
      artifactsRoot,
      fetchImpl: mockFetch(await viteFixtureMap()),
    });
    const idA = first.current.observationId;

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
    assert.equal(second.comparison.status, 'new_build');
    assert.equal(second.current.buildId, '9.9.9-1-abcdef0');
    assert.equal(second.current.previousObservationId, idA);
  });

  it('malformed state → failure; does not overwrite state file', async () => {
    const root = path.join(TMP, 'run', 'badstate');
    await mkdir(root, { recursive: true });
    const statePath = path.join(root, 'state.json');
    const bad = await readFixtureText('state-malformed.json');
    await writeFile(statePath, bad);

    const result = await runCheck({
      repoRoot: root,
      statePath,
      artifactsRoot: path.join(root, 'artifacts'),
      fetchImpl: mockFetch(await viteFixtureMap()),
    });
    assert.equal(result.ok, false);
    assert.equal(await readFile(statePath, 'utf8'), bad);
  });

  it('failed/invalid artifact → failure; last known-good preserved', async () => {
    const root = path.join(TMP, 'run', 'badart');
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

  it('archive promote failure → no good state; staging cleaned; next run recovers', async () => {
    const root = path.join(TMP, 'run', 'promote-fail');
    const statePath = path.join(root, 'state.json');
    const artifactsRoot = path.join(root, 'artifacts');
    const fetchImpl = mockFetch(await viteFixtureMap());

    const failed = await runCheck({
      repoRoot: root,
      statePath,
      artifactsRoot,
      fetchImpl,
      hooks: {
        beforePromote: () => {
          throw new Error('simulated promote failure');
        },
      },
    });
    assert.equal(failed.ok, false);
    await assert.rejects(() => access(statePath), /ENOENT/);

    // No finalized observation dirs under build id; staging cleaned
    const staging = path.join(artifactsRoot, STAGING_DIR_NAME);
    // staging root may exist empty or be absent
    try {
      const stagingEntries = await readdir(staging);
      assert.equal(stagingEntries.length, 0);
    } catch (err) {
      assert.equal(/** @type {NodeJS.ErrnoException} */ (err).code, 'ENOENT');
    }

    const recovered = await runCheck({
      repoRoot: root,
      statePath,
      artifactsRoot,
      fetchImpl,
    });
    assert.equal(recovered.ok, true);
    assert.equal(recovered.changed, true);
    assert.equal(recovered.comparison.status, 'first_observation');
    await access(statePath);
    await access(recovered.archive.observationDir);
  });

  it('state write failure after promote → observation on disk; next run finishes state', async () => {
    const root = path.join(TMP, 'run', 'state-fail');
    const statePath = path.join(root, 'state.json');
    const artifactsRoot = path.join(root, 'artifacts');
    const fetchImpl = mockFetch(await viteFixtureMap());

    const failed = await runCheck({
      repoRoot: root,
      statePath,
      artifactsRoot,
      fetchImpl,
      hooks: {
        afterPromoteBeforeState: () => {
          throw new Error('simulated state write failure');
        },
      },
    });
    assert.equal(failed.ok, false);
    await assert.rejects(() => access(statePath), /ENOENT/);

    // Observation directory was promoted
    const buildDir = path.join(artifactsRoot, '4.5.22-316-d74397b');
    const obsDirs = await readdir(buildDir);
    assert.ok(obsDirs.length >= 1);

    const recovered = await runCheck({
      repoRoot: root,
      statePath,
      artifactsRoot,
      fetchImpl,
    });
    assert.equal(recovered.ok, true);
    assert.equal(recovered.archive.alreadyPresent, true);
    assert.equal((await loadState(statePath)).observationId, recovered.current.observationId);
  });
});

describe('schema version constant', () => {
  it('is 2 for Phase 1.1', () => {
    assert.equal(SCHEMA_VERSION, 2);
  });
});
