/**
 * Pre-promote inventory invariants (Phase 2.1.1).
 * Fail closed: incomplete or invalid inventories must not publish as complete.
 */

import { EVIDENCE_CATEGORY } from './constants.mjs';

/**
 * @param {{
 *   evidence: object,
 *   chunkGraph: object,
 *   archivedBodiesByPath?: Map<string, Buffer> | Record<string, Buffer>,
 *   sha256Fn?: (buf: Buffer) => string,
 * }} input
 * @returns {{ ok: true } | { ok: false, errors: string[] }}
 */
export function validateEvidenceInventory(input) {
  const { evidence, chunkGraph } = input;
  /** @type {string[]} */
  const errors = [];

  if (!evidence || typeof evidence !== 'object') {
    return { ok: false, errors: ['evidence document missing'] };
  }
  if (!chunkGraph || typeof chunkGraph !== 'object') {
    return { ok: false, errors: ['chunk graph missing'] };
  }

  const closure = chunkGraph.closure || {};
  const status = closure.status || chunkGraph.collectionStatus;
  if (status === 'incomplete' || closure.refuseRemoval === true) {
    errors.push(
      `incomplete graph (status=${status}, refuseRemoval=${closure.refuseRemoval}) cannot present as complete inventory`,
    );
  }

  const assets = chunkGraph.assets || [];
  const assetByPath = new Map(assets.map((a) => [a.relativePath, a]));
  const rejectedPaths = new Set(
    (closure.rejectedExternal || [])
      .concat(chunkGraph.rejectedCrossOrigin || [])
      .map((r) => r.relativePath || r.url || r.raw)
      .filter(Boolean),
  );

  // Chunk graph refs → known nodes or explicit rejected/external
  for (const asset of assets) {
    for (const imp of asset.importers || []) {
      if (!assetByPath.has(imp) && !rejectedPaths.has(imp)) {
        // Importer should be a known node (we only record importers that were enqueued)
        if (!assetByPath.has(imp)) {
          errors.push(`chunk ${asset.relativePath} lists unknown importer ${imp}`);
        }
      }
    }
  }

  const bodies =
    input.archivedBodiesByPath instanceof Map
      ? input.archivedBodiesByPath
      : new Map(Object.entries(input.archivedBodiesByPath || {}));
  const sha256Fn = input.sha256Fn;

  const items = evidence.items || [];
  const ids = new Set();
  for (const item of items) {
    if (!item.id || typeof item.id !== 'string') {
      errors.push('evidence item missing id');
      continue;
    }
    if (ids.has(item.id)) {
      errors.push(`duplicate evidence id under scheme: ${item.id}`);
    }
    ids.add(item.id);

    if (item.category === EVIDENCE_CATEGORY.STRUCTURED_OPERATION) {
      if (!item.method || !/^[A-Z]+$/.test(item.method)) {
        errors.push(`structured op ${item.id} missing valid method`);
      }
      if (!item.pathNormalized || item.pathNormalized.length === 0) {
        errors.push(`structured op ${item.id} missing non-empty path`);
      }
    }

    const prov = item.provenance || (item.source ? [item.source] : []);
    if (!Array.isArray(prov) || prov.length === 0) {
      errors.push(`evidence ${item.id} has no provenance locations`);
      continue;
    }

    for (const p of prov) {
      const srcPath = p.sourcePath || p.path;
      if (!srcPath) {
        errors.push(`evidence ${item.id} provenance missing sourcePath`);
        continue;
      }
      // Every evidence must ref an archived/known source node
      const asset = assetByPath.get(srcPath);
      if (!asset) {
        errors.push(`evidence ${item.id} refs unknown source ${srcPath}`);
        continue;
      }
      if (asset.bytesArchived !== true && asset.role !== 'entry') {
        // Entry may be archived under Phase 1 path; lazy must be archived for complete inventory
        if (asset.role !== 'entry') {
          errors.push(`evidence ${item.id} refs non-archived source ${srcPath}`);
        }
      }
      const expectedSha = p.sourceSha256 || p.sha256;
      if (expectedSha && asset.sha256 && expectedSha !== asset.sha256) {
        errors.push(
          `evidence ${item.id} provenance sha mismatch for ${srcPath}: ${expectedSha} vs asset ${asset.sha256}`,
        );
      }
      if (sha256Fn && bodies.has(srcPath) && expectedSha) {
        const actual = sha256Fn(bodies.get(srcPath));
        if (actual !== expectedSha) {
          errors.push(
            `evidence ${item.id} provenance sha does not match archived bytes for ${srcPath}`,
          );
        }
      }
    }
  }

  // Duplicate provenance preserved: if we had merge, provenance length >= 1; spot-check ids unique above

  if (errors.length) return { ok: false, errors };
  return { ok: true };
}

/**
 * Assert validation or throw.
 * @param {Parameters<typeof validateEvidenceInventory>[0]} input
 */
export function assertValidEvidenceInventory(input) {
  const result = validateEvidenceInventory(input);
  if (!result.ok) {
    const err = new Error(
      `Evidence inventory invariant failure:\n- ${result.errors.join('\n- ')}`,
    );
    err.name = 'EvidenceInvariantError';
    throw err;
  }
  return result;
}
