import { describe, it, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, mkdir, rm, writeFile, access } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { sha256 } from '../../tools/fp-frontend-watch/lib/hash.mjs';
import { observationIdFromArtifacts } from '../../tools/fp-frontend-watch/lib/observation-id.mjs';
import {
  scanChunkDependencies,
  resolveChunkSpecifier,
  chunkUrlFor,
} from '../../tools/fp-frontend-evidence/lib/discover-chunks.mjs';
import {
  extractEvidenceFromSource,
  dedupeAndSortEvidence,
  countStructuredOperations,
} from '../../tools/fp-frontend-evidence/lib/extract.mjs';
import {
  normalizeMethod,
  normalizePath,
  evidenceId,
} from '../../tools/fp-frontend-evidence/lib/normalize.mjs';
import { EVIDENCE_CATEGORY } from '../../tools/fp-frontend-evidence/lib/constants.mjs';
import { runFrontendEvidence } from '../../tools/fp-frontend-evidence/lib/run.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FIXTURES = path.join(__dirname, 'fixtures');
const TMP = path.join(__dirname, '.tmp-evidence');

async function readFix(...parts) {
  return readFile(path.join(FIXTURES, ...parts));
}
async function readFixText(...parts) {
  return (await readFix(...parts)).toString('utf8');
}

before(async () => {
  await rm(TMP, { recursive: true, force: true });
  await mkdir(TMP, { recursive: true });
});

after(async () => {
  await rm(TMP, { recursive: true, force: true });
});

describe('normalize', () => {
  it('normalizes methods and paths for identity', () => {
    assert.equal(normalizeMethod('get'), 'GET');
    assert.equal(normalizeMethod('PoSt'), 'POST');
    assert.equal(normalizeMethod('nope'), null);
    assert.equal(normalizePath('/api/v3/user/'), '/api/v3/user');
    assert.equal(normalizePath('api/v3/x'), '/api/v3/x');
    assert.equal(normalizePath('/api/v3/x?foo=1'), '/api/v3/x');
  });

  it('builds stable evidence ids from semantic components only', () => {
    const a = evidenceId({
      category: 'structured_operation',
      path: '/api/v3/user/',
      method: 'get',
      structuralContext: 'openapi_client_request',
    });
    const b = evidenceId({
      category: 'structured_operation',
      path: '/api/v3/user',
      method: 'GET',
      structuralContext: 'openapi_client_request',
    });
    assert.equal(a, b);
    assert.match(a, /^structured_operation:GET:\/api\/v3\/user:openapi_client_request$/);
  });
});

describe('discover-chunks', () => {
  it('resolves ./spec relative to importer dir', () => {
    assert.equal(
      resolveChunkSpecifier('js/index-ENTRY1.js', './hub-AAAA.js'),
      'js/hub-AAAA.js',
    );
    assert.equal(
      resolveChunkSpecifier('js/index-ENTRY1.js', 'js/leaf-CCCC.js'),
      'js/leaf-CCCC.js',
    );
  });

  it('rejects URLs outside the build root', () => {
    const base = 'https://frontend.floatplane.com/user/test-build/';
    assert.equal(chunkUrlFor(base, 'js/a.js').ok, true);
    const cross = chunkUrlFor(base, 'https://evil.example/x.js');
    // URL constructor with absolute href ignores base — detect cross origin
    assert.equal(cross.ok, false);
  });

  it('enumerates mapDeps + dynamic imports from mini entry (no network)', async () => {
    const text = await readFixText('graph/entry-simple/js/index-SIMPLE.js');
    const scan = scanChunkDependencies(text, 'js/index-SIMPLE.js');
    assert.equal(scan.mapDepsTables.length, 1);
    assert.equal(scan.mapDepsTables[0].length, 1);
    const jsPaths = [...new Set(scan.jsDeps.map((d) => d.relativePath))].sort();
    assert.deepEqual(jsPaths, ['js/only-XXXX.js']);
    assert.ok(scan.jsDeps.some((d) => d.kind === 'mapDeps'));
    assert.ok(scan.jsDeps.some((d) => d.kind === 'dynamic_import'));
  });

  it('BFS nested graph: entry → hub → deep + leaf', async () => {
    const bodies = {
      'js/index-ENTRY1.js': await readFixText('graph/entry-nested/js/index-ENTRY1.js'),
      'js/hub-AAAA.js': await readFixText('graph/entry-nested/js/hub-AAAA.js'),
      'js/leaf-CCCC.js': await readFixText('graph/entry-nested/js/leaf-CCCC.js'),
      'js/deep-DDDD.js': await readFixText('graph/entry-nested/js/deep-DDDD.js'),
    };
    const seen = new Set(['js/index-ENTRY1.js']);
    const q = ['js/index-ENTRY1.js'];
    while (q.length) {
      const rel = q.shift();
      const scan = scanChunkDependencies(bodies[rel], rel);
      for (const d of scan.jsDeps) {
        if (!seen.has(d.relativePath)) {
          seen.add(d.relativePath);
          q.push(d.relativePath);
        }
      }
    }
    assert.deepEqual(
      [...seen].sort(),
      ['js/deep-DDDD.js', 'js/hub-AAAA.js', 'js/index-ENTRY1.js', 'js/leaf-CCCC.js'],
    );
  });
});

describe('extract evidence', () => {
  it('extracts structured {path,method} ops with request metadata', async () => {
    const text = await readFixText('evidence/structured-ops.js');
    const { items } = extractEvidenceFromSource({
      text,
      sourcePath: 'js/structured-ops.js',
      sourceSha256: 'a'.repeat(64),
      role: 'entry',
    });
    const structured = items.filter((i) => i.category === EVIDENCE_CATEGORY.STRUCTURED_OPERATION);
    assert.equal(countStructuredOperations(items), 3);
    const getSub = structured.find(
      (i) => i.pathNormalized === '/api/v3/user/subscriptions' && i.method === 'GET',
    );
    assert.ok(getSub);
    assert.equal(getSub.request?.responseMapper, 'UserSubscriptionInfoFromJSON');
    const postAward = structured.find(
      (i) => i.pathNormalized === '/api/acp/v3/achievement/award',
    );
    assert.equal(postAward.request?.bodySerializer, 'AwardAchievementsRequestToJSON');
    assert.equal(postAward.request?.contentType, 'application/json');
  });

  it('never promotes url templates to structured_operation', async () => {
    const text = await readFixText('evidence/url-templates.js');
    const { items } = extractEvidenceFromSource({
      text,
      sourcePath: 'js/url-templates.js',
      sourceSha256: 'b'.repeat(64),
    });
    assert.equal(countStructuredOperations(items), 0);
    const templates = items.filter((i) => i.category === EVIDENCE_CATEGORY.URL_TEMPLATE);
    assert.ok(templates.length >= 2);
    assert.ok(
      templates.some((t) => (t.pathNormalized || '').includes('/api/connect')),
    );
  });

  it('rejects KeyOS DRM /api/ as non_floatplane_host', async () => {
    const text = await readFixText('evidence/drm-keyos.js');
    const { items, rejectedSignals } = extractEvidenceFromSource({
      text,
      sourcePath: 'js/drm-keyos.js',
      sourceSha256: 'c'.repeat(64),
    });
    assert.ok(rejectedSignals.some((r) => r.reason === 'non_floatplane_host'));
    assert.equal(
      items.filter((i) => i.category === EVIDENCE_CATEGORY.STRUCTURED_OPERATION).length,
      0,
    );
    // Weak floatplane path string stays as weaker category, not hidden
    assert.ok(
      items.some(
        (i) =>
          i.pathNormalized === '/api/v3/somewhere/maybe' &&
          (i.category === EVIDENCE_CATEGORY.NETWORK_REFERENCE ||
            i.category === EVIDENCE_CATEGORY.AMBIGUOUS_REFERENCE),
      ),
    );
  });

  it('extracts realtime socket paths + chat uri', async () => {
    const text = await readFixText('evidence/realtime-socket.js');
    const { items } = extractEvidenceFromSource({
      text,
      sourcePath: 'js/realtime-socket.js',
      sourceSha256: 'd'.repeat(64),
    });
    const realtime = items.filter((i) => i.category === EVIDENCE_CATEGORY.REALTIME_OPERATION);
    assert.ok(
      realtime.some((r) => r.pathNormalized === '/api/v3/socket/connect'),
    );
    assert.ok(
      realtime.some((r) => r.pathNormalized === '/api/v3/socket/tk/connect'),
    );
    assert.ok(realtime.some((r) => r.structuralContext === 'chat_socket_uri'));
    // Structured REST copies of socket connect also present
    assert.ok(countStructuredOperations(items) >= 2);
  });

  it('dedupes by semantic id across offsets', () => {
    const items = [
      {
        id: evidenceId({
          category: EVIDENCE_CATEGORY.STRUCTURED_OPERATION,
          path: '/api/v3/x',
          method: 'GET',
          structuralContext: 'openapi_client_request',
        }),
        category: EVIDENCE_CATEGORY.STRUCTURED_OPERATION,
        path: '/api/v3/x',
        pathNormalized: '/api/v3/x',
        method: 'GET',
        source: { path: 'js/a.js', sha256: 'x', role: 'entry', byteOffset: 1, endOffset: 2, snippet: 'a' },
        structuralContext: 'openapi_client_request',
      },
      {
        id: evidenceId({
          category: EVIDENCE_CATEGORY.STRUCTURED_OPERATION,
          path: '/api/v3/x',
          method: 'GET',
          structuralContext: 'openapi_client_request',
        }),
        category: EVIDENCE_CATEGORY.STRUCTURED_OPERATION,
        path: '/api/v3/x',
        pathNormalized: '/api/v3/x',
        method: 'GET',
        source: { path: 'js/a.js', sha256: 'x', role: 'entry', byteOffset: 99, endOffset: 100, snippet: 'b' },
        structuralContext: 'openapi_client_request',
      },
    ];
    const deduped = dedupeAndSortEvidence(items);
    assert.equal(deduped.length, 1);
    assert.ok(deduped[0].notes?.some((n) => n.startsWith('also_at:')));
  });
});

describe('runFrontendEvidence integration (offline)', () => {
  /** @type {string} */
  let artifactsRoot;
  /** @type {string} */
  let statePath;
  /** @type {string} */
  let observationId;
  const buildId = 'test-build-nested';

  beforeEach(async () => {
    const dir = path.join(TMP, `run-${Date.now()}-${Math.random().toString(16).slice(2)}`);
    artifactsRoot = path.join(dir, 'artifacts');
    await mkdir(artifactsRoot, { recursive: true });

    const entryBody = await readFix('graph/entry-nested/js/index-ENTRY1.js');
    const manifestBody = Buffer.from('{"name":"fixture"}', 'utf8');
    const artifacts = [
      {
        path: 'js/index-ENTRY1.js',
        url: `https://frontend.floatplane.com/user/${buildId}/js/index-ENTRY1.js`,
        sha256: sha256(entryBody),
        bytes: entryBody.length,
        contentType: 'application/javascript',
      },
      {
        path: 'manifest.floatplane.webmanifest',
        url: `https://frontend.floatplane.com/user/${buildId}/manifest.floatplane.webmanifest`,
        sha256: sha256(manifestBody),
        bytes: manifestBody.length,
        contentType: 'application/manifest+json',
      },
    ];
    observationId = observationIdFromArtifacts(artifacts);
    const observationDir = path.join(artifactsRoot, buildId, observationId);
    await mkdir(path.join(observationDir, 'js'), { recursive: true });
    await writeFile(path.join(observationDir, 'js/index-ENTRY1.js'), entryBody);
    await writeFile(path.join(observationDir, 'manifest.floatplane.webmanifest'), manifestBody);
    const observation = {
      schemaVersion: 2,
      observationId,
      previousObservationId: null,
      buildId,
      layout: 'vite-user',
      baseUrl: `https://frontend.floatplane.com/user/${buildId}/`,
      homepageUrl: 'https://www.floatplane.com/',
      discoveryMethod: 'homepage-html-asset-urls',
      observedAt: '2026-01-01T00:00:00.000Z',
      artifacts,
      artifactDir: path.relative(path.join(dir), observationDir),
    };
    await writeFile(
      path.join(observationDir, 'observation.json'),
      `${JSON.stringify(observation, null, 2)}\n`,
    );
    statePath = path.join(dir, 'state.json');
    await writeFile(statePath, `${JSON.stringify({ ...observation, artifactDir: observation.artifactDir }, null, 2)}\n`);
  });

  it('collects nested graph offline, archives chunks, does not touch LKG bytes', async () => {
    const bodies = {
      'js/hub-AAAA.js': await readFix('graph/entry-nested/js/hub-AAAA.js'),
      'js/leaf-CCCC.js': await readFix('graph/entry-nested/js/leaf-CCCC.js'),
      'js/deep-DDDD.js': await readFix('graph/entry-nested/js/deep-DDDD.js'),
    };
    const stateBefore = await readFile(statePath);

    const result = await runFrontendEvidence({
      repoRoot: path.dirname(statePath),
      artifactsRoot,
      statePath,
      observationId,
      buildId,
      localBodies: bodies,
    });

    assert.equal(result.ok, true);
    assert.equal(result.metrics.reachableJsCount, 4);
    assert.equal(result.metrics.lazyJsCount, 3);
    assert.ok(result.metrics.mapDepsFirstWaveJs >= 2);

    const phase2 = result.phase2Dir;
    await access(path.join(phase2, 'chunk-graph.json'));
    await access(path.join(phase2, 'api-evidence.json'));
    await access(path.join(phase2, 'api-evidence.inventory.md'));
    await access(path.join(phase2, 'status.json'));
    await access(path.join(phase2, 'chunks/js/hub-AAAA.js'));
    await access(path.join(phase2, 'chunks/js/deep-DDDD.js'));

    // Phase 1 observation id unchanged; LKG state bytes unchanged
    const obs = JSON.parse(
      await readFile(path.join(result.observationDir, 'observation.json'), 'utf8'),
    );
    assert.equal(obs.observationId, observationId);
    assert.deepEqual(await readFile(statePath), stateBefore);

    // Idempotent re-run
    const again = await runFrontendEvidence({
      repoRoot: path.dirname(statePath),
      artifactsRoot,
      statePath,
      observationId,
      buildId,
      localBodies: bodies,
    });
    assert.equal(again.idempotent, true);
    assert.equal(again.ok, true);
  });

  it('partial fetch failure does not publish complete inventory', async () => {
    const bodies = {
      'js/hub-AAAA.js': await readFix('graph/entry-nested/js/hub-AAAA.js'),
      // leaf + deep missing → fetchImpl 404
    };
    const fetchImpl = async (url) => ({
      status: 404,
      headers: { get: () => 'text/plain' },
      url,
      arrayBuffer: async () => Buffer.from('missing'),
    });

    const result = await runFrontendEvidence({
      repoRoot: path.dirname(statePath),
      artifactsRoot,
      statePath,
      observationId,
      buildId,
      localBodies: bodies,
      fetchImpl,
      force: true,
    });

    assert.equal(result.ok, false);
    assert.equal(result.exitCode, 3);
    assert.equal(result.evidence, null);
    const status = JSON.parse(
      await readFile(path.join(result.phase2Dir, 'status.json'), 'utf8'),
    );
    assert.equal(status.status, 'incomplete');
    // Complete evidence file must not be present
    let evidenceExists = true;
    try {
      await access(path.join(result.phase2Dir, 'api-evidence.json'));
    } catch {
      evidenceExists = false;
    }
    assert.equal(evidenceExists, false);
  });
});

describe('structured extract scale fixture (entry sample)', () => {
  it('counts 350-scale pattern on synthetic multi-op blob', async () => {
    // Generate N synthetic ops to prove extractor scales / doesn't collapse
    const parts = [];
    for (let i = 0; i < 40; i++) {
      parts.push(
        `async op${i}Raw(i,e){const n={},s={},c=await this.request({path:"/api/v3/demo/item${i}",method:"GET",headers:s,query:n},e);return new t.JSONApiResponse(c,d=>(0,r.ItemFromJSON)(d))}`,
      );
    }
    const text = parts.join('\n');
    const { items } = extractEvidenceFromSource({
      text,
      sourcePath: 'js/scale.js',
      sourceSha256: 'e'.repeat(64),
    });
    assert.equal(countStructuredOperations(items), 40);
  });
});
