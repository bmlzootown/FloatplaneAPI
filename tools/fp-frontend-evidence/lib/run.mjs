/**
 * Phase 2.1.1 orchestration: BFS chunk collection + evidence extraction.
 *
 * - Idempotent for a complete prior run with matching extractor + input hashes
 * - Transactional staging: partial failure does not publish a "complete" inventory
 * - Pre-promote inventory invariants (fail closed)
 * - Does NOT write Phase 1 LKG state or mutate observation identity
 */

import { mkdir, writeFile, readFile, rename, rm, access } from 'node:fs/promises';
import path from 'node:path';
import { sha256 } from '../../fp-frontend-watch/lib/hash.mjs';
import { fetchArtifact } from '../../fp-frontend-watch/lib/fetch-artifact.mjs';
import {
  EXTRACTOR_ID,
  EXTRACTOR_VERSION,
  EVIDENCE_SCHEMA_VERSION,
  CHUNK_GRAPH_SCHEMA_VERSION,
  PHASE2_DIR,
  CHUNK_GRAPH_FILE,
  EVIDENCE_FILE,
  INVENTORY_FILE,
  STATUS_FILE,
  CHUNKS_SUBDIR,
  USER_AGENT,
  EXIT,
  CLOSURE_STATUS,
} from './constants.mjs';
import { scanChunkDependencies, chunkUrlFor, resolveChunkSpecifier } from './discover-chunks.mjs';
import {
  extractEvidenceFromSource,
  dedupeAndSortEvidence,
  countStructuredOperations,
} from './extract.mjs';
import { renderInventoryMarkdown } from './inventory.mjs';
import { resolveObservation } from './resolve-observation.mjs';
import { IDENTITY_RULES } from './normalize.mjs';
import { assertValidEvidenceInventory } from './validate.mjs';
import { discoverFrontendRoots } from './frontend-roots.mjs';

/**
 * @param {{
 *   repoRoot: string,
 *   artifactsRoot: string,
 *   statePath: string,
 *   observationId?: string | null,
 *   buildId?: string | null,
 *   fetchImpl?: import('../../fp-frontend-watch/lib/fetch-artifact.mjs').FetchLike,
 *   localBodies?: Record<string, Buffer | string>,
 *   dryRun?: boolean,
 *   force?: boolean,
 *   now?: Date,
 *   retainCss?: boolean,
 * }} options
 */
export async function runFrontendEvidence(options) {
  const now = options.now || new Date();
  const resolved = await resolveObservation(options);
  const {
    observationId,
    buildId,
    observationDir,
    observation,
    entryArtifact,
    entryAbs,
    baseUrl,
  } = resolved;

  const phase2Dir = path.join(observationDir, PHASE2_DIR);
  const statusPath = path.join(phase2Dir, STATUS_FILE);

  const entryBody = await readFile(entryAbs);
  const entryHash = sha256(entryBody);
  if (entryHash !== entryArtifact.sha256) {
    throw new Error(
      `Entry sha256 mismatch on disk vs observation.json: ${entryHash} vs ${entryArtifact.sha256}`,
    );
  }

  if (!options.force && (await exists(statusPath))) {
    try {
      const prev = JSON.parse(await readFile(statusPath, 'utf8'));
      const completeStatuses = new Set([
        CLOSURE_STATUS.COMPLETE,
        CLOSURE_STATUS.COMPLETE_WITH_EXTERNAL_REJECTS,
        'complete',
      ]);
      if (
        completeStatuses.has(prev.status) &&
        prev.extractorId === EXTRACTOR_ID &&
        prev.extractorVersion === EXTRACTOR_VERSION &&
        prev.entrySha256 === entryHash &&
        prev.observationId === observationId &&
        (await exists(path.join(phase2Dir, CHUNK_GRAPH_FILE))) &&
        (await exists(path.join(phase2Dir, EVIDENCE_FILE)))
      ) {
        const chunkGraph = JSON.parse(
          await readFile(path.join(phase2Dir, CHUNK_GRAPH_FILE), 'utf8'),
        );
        const evidence = JSON.parse(
          await readFile(path.join(phase2Dir, EVIDENCE_FILE), 'utf8'),
        );
        return {
          ok: true,
          idempotent: true,
          exitCode: EXIT.SUCCESS,
          observationId,
          buildId,
          observationDir,
          phase2Dir,
          chunkGraph,
          evidence,
          metrics: summarizeMetrics(chunkGraph, evidence),
        };
      }
    } catch {
      // fall through to re-run
    }
  }

  if (options.dryRun) {
    const planned = await collectChunkGraph({
      entryPath: entryArtifact.path,
      entryBody,
      entryHash,
      baseUrl,
      observationId,
      buildId,
      fetchImpl: options.fetchImpl,
      localBodies: options.localBodies,
      persistBytes: false,
      now,
    });
    const evidence = buildEvidenceDoc({
      observationId,
      buildId,
      sources: planned.sourcesForEvidence,
      items: planned.allItems,
      rejectedSignals: planned.rejectedSignals,
      warnings: planned.warnings,
      now,
      closure: planned.chunkGraph.closure,
    });
    return {
      ok: planned.chunkGraph.closure.status !== CLOSURE_STATUS.INCOMPLETE,
      idempotent: false,
      dryRun: true,
      exitCode:
        planned.chunkGraph.closure.status === CLOSURE_STATUS.INCOMPLETE
          ? EXIT.INCOMPLETE
          : EXIT.SUCCESS,
      observationId,
      buildId,
      observationDir,
      phase2Dir,
      chunkGraph: planned.chunkGraph,
      evidence,
      metrics: summarizeMetrics(planned.chunkGraph, evidence),
    };
  }

  const stagingRoot = path.join(options.artifactsRoot, '.staging');
  const stagingDir = path.join(
    stagingRoot,
    `phase2-${buildId}-${observationId.slice(0, 12)}-${process.pid}-${Date.now()}`,
  );
  await rm(stagingDir, { recursive: true, force: true });
  await mkdir(stagingDir, { recursive: true });

  try {
    const collected = await collectChunkGraph({
      entryPath: entryArtifact.path,
      entryBody,
      entryHash,
      baseUrl,
      observationId,
      buildId,
      fetchImpl: options.fetchImpl,
      localBodies: options.localBodies,
      persistBytes: true,
      stagingChunksDir: path.join(stagingDir, CHUNKS_SUBDIR),
      now,
    });

    const closureStatus = collected.chunkGraph.closure.status;

    if (closureStatus === CLOSURE_STATUS.INCOMPLETE) {
      const incompleteStatus = {
        status: CLOSURE_STATUS.INCOMPLETE,
        reason: collected.chunkGraph.incompleteReason || 'chunk_collection_incomplete',
        refuseRemoval: true,
        observationId,
        buildId,
        extractorId: EXTRACTOR_ID,
        extractorVersion: EXTRACTOR_VERSION,
        evidenceSchemaVersion: EVIDENCE_SCHEMA_VERSION,
        entrySha256: entryHash,
        updatedAt: now.toISOString(),
        errors: collected.chunkGraph.errors || [],
        closure: collected.chunkGraph.closure,
        frontendRoots: collected.chunkGraph.frontendRoots,
      };
      await writeFile(
        path.join(stagingDir, STATUS_FILE),
        `${JSON.stringify(incompleteStatus, null, 2)}\n`,
      );
      await writeFile(
        path.join(stagingDir, CHUNK_GRAPH_FILE),
        `${JSON.stringify(collected.chunkGraph, null, 2)}\n`,
      );
      await rm(phase2Dir, { recursive: true, force: true });
      await mkdir(path.dirname(phase2Dir), { recursive: true });
      await rename(stagingDir, phase2Dir);
      return {
        ok: false,
        idempotent: false,
        exitCode: EXIT.INCOMPLETE,
        observationId,
        buildId,
        observationDir,
        phase2Dir,
        chunkGraph: collected.chunkGraph,
        evidence: null,
        error: incompleteStatus.reason,
        metrics: summarizeMetrics(collected.chunkGraph, null),
      };
    }

    const evidence = buildEvidenceDoc({
      observationId,
      buildId,
      sources: collected.sourcesForEvidence,
      items: collected.allItems,
      rejectedSignals: collected.rejectedSignals,
      warnings: collected.warnings,
      now,
      closure: collected.chunkGraph.closure,
    });

    // Fail closed on inventory invariants before promote
    assertValidEvidenceInventory({
      evidence,
      chunkGraph: collected.chunkGraph,
      archivedBodiesByPath: collected.bodiesByPath,
      sha256Fn: sha256,
    });

    const inventory = renderInventoryMarkdown({
      observationId,
      buildId,
      evidence,
      chunkGraph: collected.chunkGraph,
    });

    await writeFile(
      path.join(stagingDir, CHUNK_GRAPH_FILE),
      `${JSON.stringify(collected.chunkGraph, null, 2)}\n`,
    );
    await writeFile(
      path.join(stagingDir, EVIDENCE_FILE),
      `${JSON.stringify(evidence, null, 2)}\n`,
    );
    await writeFile(path.join(stagingDir, INVENTORY_FILE), inventory);

    const status = {
      status: closureStatus,
      refuseRemoval: false,
      observationId,
      buildId,
      extractorId: EXTRACTOR_ID,
      extractorVersion: EXTRACTOR_VERSION,
      evidenceSchemaVersion: EVIDENCE_SCHEMA_VERSION,
      chunkGraphSchemaVersion: CHUNK_GRAPH_SCHEMA_VERSION,
      entrySha256: entryHash,
      extractedAt: evidence.extractedAt,
      updatedAt: now.toISOString(),
      metrics: summarizeMetrics(collected.chunkGraph, evidence),
      closure: collected.chunkGraph.closure,
      frontendRoots: collected.chunkGraph.frontendRoots,
    };
    await writeFile(
      path.join(stagingDir, STATUS_FILE),
      `${JSON.stringify(status, null, 2)}\n`,
    );

    const backupDir = `${phase2Dir}.bak-${process.pid}-${Date.now()}`;
    let hadPrior = await exists(phase2Dir);
    if (hadPrior) {
      await rename(phase2Dir, backupDir);
    }
    try {
      await rename(stagingDir, phase2Dir);
    } catch (err) {
      if (hadPrior) {
        await rename(backupDir, phase2Dir).catch(() => {});
      }
      throw err;
    }
    if (hadPrior) {
      await rm(backupDir, { recursive: true, force: true }).catch(() => {});
    }

    void observation;

    return {
      ok: true,
      idempotent: false,
      exitCode: EXIT.SUCCESS,
      observationId,
      buildId,
      observationDir,
      phase2Dir,
      chunkGraph: collected.chunkGraph,
      evidence,
      metrics: summarizeMetrics(collected.chunkGraph, evidence),
    };
  } catch (err) {
    await rm(stagingDir, { recursive: true, force: true }).catch(() => {});
    throw err;
  }
}

/**
 * @param {{
 *   entryPath: string,
 *   entryBody: Buffer,
 *   entryHash: string,
 *   baseUrl: string,
 *   observationId: string,
 *   buildId: string,
 *   fetchImpl?: Function,
 *   localBodies?: Record<string, Buffer | string>,
 *   persistBytes: boolean,
 *   stagingChunksDir?: string,
 *   now: Date,
 * }} opts
 */
async function collectChunkGraph(opts) {
  const {
    entryPath,
    entryBody,
    entryHash,
    baseUrl,
    observationId,
    buildId,
    fetchImpl,
    localBodies,
    persistBytes,
    stagingChunksDir,
    now,
  } = opts;

  /** @type {Map<string, object>} */
  const assets = new Map();
  /** @type {string[]} */
  const queue = [];
  /** @type {string[]} */
  const errors = [];
  /** @type {object[]} */
  const rejectedCrossOrigin = [];
  /** @type {object[]} */
  const invalidNonJs = [];
  /** @type {import('./extract.mjs').EvidenceItem[]} */
  const allItems = [];
  /** @type {object[]} */
  const rejectedSignals = [];
  /** @type {string[]} */
  const warnings = [];
  /** @type {object[]} */
  const sourcesForEvidence = [];
  /** @type {Map<string, Buffer>} */
  const bodies = new Map();
  let depsDiscovered = 0;
  let duplicateRefs = 0;
  let parseFailures = 0;

  const entryText = entryBody.toString('utf8');
  const rootsMeta = discoverFrontendRoots(entryText, entryPath, resolveChunkSpecifier);

  function enqueue(relPath, discovery) {
    depsDiscovered += 1;
    if (assets.has(relPath)) {
      duplicateRefs += 1;
      const existing = assets.get(relPath);
      mergeDiscovery(existing, discovery);
      return;
    }
    const urlResult = chunkUrlFor(baseUrl, relPath);
    if (!urlResult.ok) {
      rejectedCrossOrigin.push({
        relativePath: relPath,
        reason: urlResult.reason,
        classification: 'out_of_build_root',
        whyNotFollowed: urlResult.reason,
        url: urlResult.url || null,
        fetched: false,
        parserFailure: false,
        via: discovery,
      });
      return;
    }

    const isJs = relPath.endsWith('.js');
    const isCss = relPath.endsWith('.css');
    if (!isJs && !isCss) {
      invalidNonJs.push({
        relativePath: relPath,
        reason: 'unsupported_extension',
        whyNotFollowed: 'not_js_or_css',
        via: discovery,
      });
      return;
    }

    assets.set(relPath, {
      relativePath: relPath,
      url: urlResult.url,
      sha256: null,
      bytes: null,
      contentType: isJs
        ? 'application/javascript'
        : isCss
          ? 'text/css'
          : null,
      role: relPath === entryPath ? 'entry' : 'lazy',
      discovery: [discovery],
      importers: discovery.importer ? [discovery.importer] : [],
      importKind: discovery.kind || null,
      staticImport: discovery.kind === 'static_import',
      dynamicImport: discovery.kind === 'dynamic_import' || discovery.kind === 'mapDeps',
      bytesArchived: false,
      archivedRelativePath: null,
      apiEvidenceFound: null,
      fetchStatus: relPath === entryPath ? 'local_entry' : 'pending',
    });
    if (isJs) {
      queue.push(relPath);
    }
  }

  enqueue(entryPath, { kind: 'phase1_entry', importer: null });
  bodies.set(entryPath, entryBody);

  while (queue.length > 0) {
    const rel = queue.shift();
    const asset = assets.get(rel);

    let body = bodies.get(rel);
    if (!body) {
      if (localBodies && localBodies[rel] != null) {
        body = Buffer.isBuffer(localBodies[rel])
          ? localBodies[rel]
          : Buffer.from(String(localBodies[rel]), 'utf8');
        asset.fetchStatus = 'local_fixture';
      } else {
        try {
          const fetched = await fetchArtifact(asset.url, rel, {
            fetchImpl,
            userAgent: USER_AGENT,
          });
          body = fetched.body;
          asset.contentType = fetched.contentType || asset.contentType;
          asset.fetchStatus = 'fetched';
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          asset.fetchStatus = 'error';
          asset.error = msg;
          errors.push(`${rel}: ${msg}`);
          continue;
        }
      }
      bodies.set(rel, body);
    }

    asset.sha256 = sha256(body);
    asset.bytes = body.length;

    if (persistBytes && rel !== entryPath && rel.endsWith('.js') && stagingChunksDir) {
      const destRel = path.posix.join(CHUNKS_SUBDIR, rel);
      const destAbs = path.join(stagingChunksDir, ...rel.split('/'));
      await mkdir(path.dirname(destAbs), { recursive: true });
      await writeFile(destAbs, body);
      asset.bytesArchived = true;
      asset.archivedRelativePath = path.posix.join(PHASE2_DIR, destRel);
    } else if (rel === entryPath) {
      asset.bytesArchived = true;
      asset.archivedRelativePath = entryPath;
    }

    if (rel.endsWith('.js')) {
      let text;
      try {
        text = body.toString('utf8');
      } catch {
        parseFailures += 1;
        warnings.push(`Failed to decode UTF-8 for ${rel}; skipped extract`);
        continue;
      }

      let scan;
      try {
        scan = scanChunkDependencies(text, rel);
      } catch (err) {
        parseFailures += 1;
        warnings.push(
          `Dependency scan failed for ${rel}: ${err instanceof Error ? err.message : String(err)}`,
        );
        scan = { mapDepsTables: [], deps: [], jsDeps: [], cssPaths: [] };
      }

      for (const dep of scan.deps) {
        enqueue(dep.relativePath, {
          kind: dep.kind,
          importer: rel,
          specifier: dep.specifier,
          byteOffset: dep.byteOffset,
        });
      }

      let extracted;
      try {
        extracted = extractEvidenceFromSource({
          text,
          sourcePath: rel,
          sourceSha256: asset.sha256,
          role: asset.role,
        });
      } catch (err) {
        parseFailures += 1;
        warnings.push(
          `Evidence extract failed for ${rel}: ${err instanceof Error ? err.message : String(err)}`,
        );
        extracted = { items: [], rejectedSignals: [], warnings: [] };
      }

      asset.apiEvidenceFound = extracted.items.length > 0;
      allItems.push(...extracted.items);
      rejectedSignals.push(...extracted.rejectedSignals);
      warnings.push(...extracted.warnings);

      sourcesForEvidence.push({
        path: rel,
        sha256: asset.sha256,
        role: asset.role,
        retainedBytes: asset.bytesArchived,
        bytes: asset.bytes,
      });
    }
  }

  const assetList = [...assets.values()].sort((a, b) =>
    a.relativePath.localeCompare(b.relativePath),
  );
  const jsAssets = assetList.filter((a) => a.relativePath.endsWith('.js'));
  const lazyJs = jsAssets.filter((a) => a.role !== 'entry');
  const archivedChunkBytes = lazyJs
    .filter((a) => a.bytesArchived)
    .reduce((sum, a) => sum + (a.bytes || 0), 0);

  const fetchErrors = jsAssets.filter((a) => a.fetchStatus === 'error');
  const successfullyFetched = jsAssets.filter(
    (a) =>
      a.fetchStatus === 'fetched' ||
      a.fetchStatus === 'local_entry' ||
      a.fetchStatus === 'local_fixture',
  ).length;

  // Annotate route roots with fetch status
  const routeRoots = rootsMeta.routeRoots.map((r) => {
    const asset = assets.get(r.path);
    return {
      ...r,
      fetchStatus: asset?.fetchStatus || 'missing',
      sha256: asset?.sha256 || null,
      bytes: asset?.bytes || null,
      ok:
        asset != null &&
        (asset.fetchStatus === 'fetched' ||
          asset.fetchStatus === 'local_fixture' ||
          asset.fetchStatus === 'local_entry'),
    };
  });
  const allRootsOk = routeRoots.every((r) => r.ok);

  const externalRejects = [
    ...rejectedCrossOrigin.map((r) => ({
      kind: 'module_dep',
      ...r,
    })),
    ...rejectedSignals.map((r) => ({
      kind: 'evidence_url',
      relativePath: null,
      url: r.raw,
      reason: r.reason,
      classification: r.classification || 'out_of_build_root',
      whyNotFollowed: r.whyNotFollowed || 'cross_origin_vendor_host',
      host: r.host || null,
      sourcePath: r.sourcePath,
      byteOffset: r.byteOffset,
      fetched: false,
      parserFailure: r.parserFailure === true,
    })),
  ];

  let closureStatus = CLOSURE_STATUS.COMPLETE;
  let incompleteReason = null;
  let refuseRemoval = false;
  let reachedDeterministicClosure = true;

  if (fetchErrors.length > 0 || errors.length > 0 || !allRootsOk) {
    closureStatus = CLOSURE_STATUS.INCOMPLETE;
    incompleteReason = !allRootsOk
      ? 'one_or_more_route_roots_failed'
      : 'one_or_more_same_build_chunk_fetches_failed';
    refuseRemoval = true;
    reachedDeterministicClosure = false;
  } else if (externalRejects.length > 0) {
    closureStatus = CLOSURE_STATUS.COMPLETE_WITH_EXTERNAL_REJECTS;
  }

  const closure = {
    status: closureStatus,
    refuseRemoval,
    reachedDeterministicClosure,
    depsDiscovered,
    uniqueSameBuildJs: jsAssets.length,
    successfullyFetched,
    duplicateRefs,
    rejectedExternalCount: externalRejects.length,
    rejectedExternal: externalRejects,
    invalidNonJsCount: invalidNonJs.length,
    invalidNonJs,
    failedSameBuildRetrievals: fetchErrors.length,
    failedSameBuildPaths: fetchErrors.map((a) => a.relativePath),
    parseFailures,
    evidenceWarnings: warnings.length,
    phase22Note:
      'When status is incomplete (refuseRemoval=true), Phase 2.2 must NOT treat missing ops as API removal.',
  };

  const chunkGraph = {
    schemaVersion: CHUNK_GRAPH_SCHEMA_VERSION,
    observationId,
    buildId,
    baseUrl,
    entryPath,
    entrySha256: entryHash,
    extractedAt: now.toISOString(),
    extractorId: EXTRACTOR_ID,
    extractorVersion: EXTRACTOR_VERSION,
    collectionStatus: closureStatus,
    incompleteReason,
    errors,
    rejectedCrossOrigin,
    frontendRoots: {
      entryPath,
      baseUrl,
      sameObservation: true,
      note: rootsMeta.sameObservationNote,
      routeRoots,
      allRootsOk,
    },
    closure,
    retentionPolicy: {
      phase: '2.1.1',
      retainAllReachableJs: true,
      retainCssBytes: false,
      entryBytesOwnedByPhase1: true,
    },
    stats: {
      reachableJsCount: jsAssets.length,
      lazyJsCount: lazyJs.length,
      cssPathCount: assetList.filter((a) => a.relativePath.endsWith('.css')).length,
      archivedChunkBytes,
      entryBytes: entryBody.length,
      mapDepsFirstWaveJs: countFirstWaveMapDepsJs(assetList, entryPath),
      depsDiscovered,
      duplicateRefs,
      successfullyFetched,
      rejectedExternalCount: externalRejects.length,
    },
    assets: assetList,
  };

  return {
    chunkGraph,
    allItems,
    rejectedSignals,
    warnings,
    sourcesForEvidence,
    bodiesByPath: bodies,
  };
}

/**
 * @param {object[]} assetList
 * @param {string} entryPath
 */
function countFirstWaveMapDepsJs(assetList, entryPath) {
  return assetList.filter(
    (a) =>
      a.relativePath.endsWith('.js') &&
      a.relativePath !== entryPath &&
      (a.discovery || []).some((d) => d.kind === 'mapDeps' && d.importer === entryPath),
  ).length;
}

/**
 * @param {object} asset
 * @param {object} discovery
 */
function mergeDiscovery(asset, discovery) {
  asset.discovery = asset.discovery || [];
  const key = `${discovery.kind}|${discovery.importer}|${discovery.specifier || ''}`;
  if (
    !asset.discovery.some(
      (d) => `${d.kind}|${d.importer}|${d.specifier || ''}` === key,
    )
  ) {
    asset.discovery.push(discovery);
  }
  if (discovery.importer && !asset.importers.includes(discovery.importer)) {
    asset.importers.push(discovery.importer);
  }
  if (discovery.kind === 'static_import') asset.staticImport = true;
  if (discovery.kind === 'dynamic_import' || discovery.kind === 'mapDeps') {
    asset.dynamicImport = true;
  }
}

/**
 * @param {{
 *   observationId: string,
 *   buildId: string,
 *   sources: object[],
 *   items: import('./extract.mjs').EvidenceItem[],
 *   rejectedSignals: object[],
 *   warnings: string[],
 *   now: Date,
 *   closure?: object,
 * }} input
 */
function buildEvidenceDoc(input) {
  const items = dedupeAndSortEvidence(input.items);
  const methodCounts = {};
  for (const item of items) {
    if (item.category !== 'structured_operation' || !item.method) continue;
    methodCounts[item.method] = (methodCounts[item.method] || 0) + 1;
  }

  return {
    schemaVersion: EVIDENCE_SCHEMA_VERSION,
    observationId: input.observationId,
    buildId: input.buildId,
    extractedAt: input.now.toISOString(),
    extractorId: EXTRACTOR_ID,
    extractorVersion: EXTRACTOR_VERSION,
    provenance: {
      observationId: input.observationId,
      buildId: input.buildId,
      extractorId: EXTRACTOR_ID,
      extractorVersion: EXTRACTOR_VERSION,
      evidenceSchemaVersion: EVIDENCE_SCHEMA_VERSION,
      sourceCount: input.sources.length,
    },
    identityRules: IDENTITY_RULES,
    closureSummary: input.closure
      ? {
          status: input.closure.status,
          refuseRemoval: input.closure.refuseRemoval,
          reachedDeterministicClosure: input.closure.reachedDeterministicClosure,
          rejectedExternalCount: input.closure.rejectedExternalCount,
        }
      : null,
    sources: input.sources.sort((a, b) => a.path.localeCompare(b.path)),
    stats: {
      structuredOperationCount: countStructuredOperations(items),
      itemCount: items.length,
      rejectedSignalCount: input.rejectedSignals.length,
      warningCount: input.warnings.length,
      structuredByMethod: methodCounts,
      provenanceLocationCount: items.reduce(
        (n, i) => n + (i.provenance?.length || 0),
        0,
      ),
    },
    items,
    rejectedSignals: input.rejectedSignals,
    warnings: [...new Set(input.warnings)].sort(),
  };
}

/**
 * @param {object} chunkGraph
 * @param {object | null} evidence
 */
function summarizeMetrics(chunkGraph, evidence) {
  return {
    reachableJsCount: chunkGraph?.stats?.reachableJsCount ?? null,
    lazyJsCount: chunkGraph?.stats?.lazyJsCount ?? null,
    archivedChunkBytes: chunkGraph?.stats?.archivedChunkBytes ?? null,
    entryBytes: chunkGraph?.stats?.entryBytes ?? null,
    mapDepsFirstWaveJs: chunkGraph?.stats?.mapDepsFirstWaveJs ?? null,
    structuredOperationCount: evidence?.stats?.structuredOperationCount ?? null,
    structuredByMethod: evidence?.stats?.structuredByMethod ?? null,
    rejectedSignalCount: evidence?.stats?.rejectedSignalCount ?? null,
    collectionStatus: chunkGraph?.closure?.status ?? chunkGraph?.collectionStatus ?? null,
    refuseRemoval: chunkGraph?.closure?.refuseRemoval ?? null,
    reachedDeterministicClosure: chunkGraph?.closure?.reachedDeterministicClosure ?? null,
    depsDiscovered: chunkGraph?.closure?.depsDiscovered ?? null,
    successfullyFetched: chunkGraph?.closure?.successfullyFetched ?? null,
    duplicateRefs: chunkGraph?.closure?.duplicateRefs ?? null,
    rejectedExternalCount: chunkGraph?.closure?.rejectedExternalCount ?? null,
    routeRoots: chunkGraph?.frontendRoots?.routeRoots?.map((r) => ({
      path: r.path,
      label: r.label,
      ok: r.ok,
    })) ?? null,
  };
}

/** @param {string} p */
async function exists(p) {
  try {
    await access(p);
    return true;
  } catch {
    return false;
  }
}
