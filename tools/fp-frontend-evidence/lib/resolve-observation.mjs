/**
 * Resolve a Phase 1 observation directory + metadata for Phase 2.
 * Never writes Phase 1 LKG state.
 */

import { readFile, access } from 'node:fs/promises';
import path from 'node:path';

/**
 * @param {{
 *   repoRoot: string,
 *   artifactsRoot: string,
 *   statePath: string,
 *   observationId?: string | null,
 *   buildId?: string | null,
 * }} opts
 */
export async function resolveObservation(opts) {
  const artifactsRoot = opts.artifactsRoot;
  let observationId = opts.observationId || null;
  let buildId = opts.buildId || null;
  /** @type {object | null} */
  let state = null;

  if (!observationId) {
    state = JSON.parse(await readFile(opts.statePath, 'utf8'));
    observationId = state.observationId;
    buildId = buildId || state.buildId;
  }

  if (!observationId) {
    throw new Error('No observationId provided and none in last-known state');
  }

  let observationDir = null;
  let observation = null;

  if (buildId) {
    const candidate = path.join(artifactsRoot, buildId, observationId);
    if (await exists(candidate)) {
      observationDir = candidate;
      observation = JSON.parse(await readFile(path.join(candidate, 'observation.json'), 'utf8'));
    }
  }

  if (!observationDir) {
    // Scan artifacts root for observationId
    const { readdir } = await import('node:fs/promises');
    const builds = await readdir(artifactsRoot, { withFileTypes: true });
    for (const ent of builds) {
      if (!ent.isDirectory() || ent.name.startsWith('.')) continue;
      const candidate = path.join(artifactsRoot, ent.name, observationId);
      if (await exists(path.join(candidate, 'observation.json'))) {
        observationDir = candidate;
        observation = JSON.parse(
          await readFile(path.join(candidate, 'observation.json'), 'utf8'),
        );
        buildId = ent.name;
        break;
      }
    }
  }

  if (!observationDir || !observation) {
    throw new Error(
      `Observation not found: observationId=${observationId}` +
        (buildId ? ` buildId=${buildId}` : ''),
    );
  }

  if (observation.observationId !== observationId) {
    throw new Error(
      `observation.json id mismatch: ${observation.observationId} vs ${observationId}`,
    );
  }

  const entryArtifact = (observation.artifacts || []).find((a) => a.path.endsWith('.js'));
  if (!entryArtifact) {
    throw new Error(`No JS entry artifact listed in observation ${observationId}`);
  }

  const entryAbs = path.join(observationDir, entryArtifact.path);
  if (!(await exists(entryAbs))) {
    throw new Error(`Entry JS missing on disk: ${entryAbs}`);
  }

  return {
    observationId,
    buildId: observation.buildId || buildId,
    observationDir,
    observation,
    entryArtifact,
    entryAbs,
    baseUrl: observation.baseUrl,
    state,
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
