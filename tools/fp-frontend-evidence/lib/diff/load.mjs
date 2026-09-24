/**
 * Load Phase 2 evidence inventories from archived observation dirs (offline).
 * Never mutates inventories or Phase 1 state.
 */

import { readFile, readdir, access } from 'node:fs/promises';
import path from 'node:path';
import {
  PHASE2_DIR,
  EVIDENCE_FILE,
  STATUS_FILE,
  CHUNK_GRAPH_FILE,
} from '../constants.mjs';
import { COMPLETE_ENOUGH } from './constants.mjs';

/**
 * @typedef {{
 *   observationId: string,
 *   buildId: string,
 *   observationDir: string,
 *   phase2Dir: string,
 *   evidence: object,
 *   status: object | null,
 *   chunkGraph: object | null,
 *   closureStatus: string,
 *   refuseRemoval: boolean,
 *   completeEnough: boolean,
 * }} LoadedInventory
 */

/**
 * Resolve observation directory under artifacts root (scan if buildId unknown).
 * @param {{
 *   artifactsRoot: string,
 *   observationId: string,
 *   buildId?: string | null,
 * }} opts
 */
export async function findObservationDir(opts) {
  const { artifactsRoot, observationId } = opts;
  let buildId = opts.buildId || null;

  if (buildId) {
    const candidate = path.join(artifactsRoot, buildId, observationId);
    if (await exists(path.join(candidate, 'observation.json'))) {
      return { observationDir: candidate, buildId };
    }
  }

  const builds = await readdir(artifactsRoot, { withFileTypes: true });
  for (const ent of builds) {
    if (!ent.isDirectory() || ent.name.startsWith('.')) continue;
    const candidate = path.join(artifactsRoot, ent.name, observationId);
    if (await exists(path.join(candidate, 'observation.json'))) {
      return { observationDir: candidate, buildId: ent.name };
    }
  }

  throw new Error(
    `Observation not found under ${artifactsRoot}: ${observationId}` +
      (buildId ? ` (build hint ${buildId})` : ''),
  );
}

/**
 * Load a Phase 2 evidence inventory for one observation.
 * @param {{
 *   artifactsRoot: string,
 *   observationId: string,
 *   buildId?: string | null,
 * }} opts
 * @returns {Promise<LoadedInventory>}
 */
export async function loadEvidenceInventory(opts) {
  const { observationDir, buildId } = await findObservationDir(opts);
  const observation = JSON.parse(
    await readFile(path.join(observationDir, 'observation.json'), 'utf8'),
  );
  const phase2Dir = path.join(observationDir, PHASE2_DIR);
  const evidencePath = path.join(phase2Dir, EVIDENCE_FILE);

  if (!(await exists(evidencePath))) {
    throw new Error(
      `Phase 2 evidence missing for ${opts.observationId}: expected ${evidencePath}`,
    );
  }

  const evidence = JSON.parse(await readFile(evidencePath, 'utf8'));
  validateEvidenceShape(evidence, opts.observationId);

  let status = null;
  let chunkGraph = null;
  const statusPath = path.join(phase2Dir, STATUS_FILE);
  const graphPath = path.join(phase2Dir, CHUNK_GRAPH_FILE);
  if (await exists(statusPath)) {
    status = JSON.parse(await readFile(statusPath, 'utf8'));
  }
  if (await exists(graphPath)) {
    chunkGraph = JSON.parse(await readFile(graphPath, 'utf8'));
  }

  const closureStatus =
    status?.status ||
    evidence?.closureSummary?.status ||
    chunkGraph?.closure?.status ||
    'unknown';

  const refuseRemoval = Boolean(
    status?.refuseRemoval ??
      evidence?.closureSummary?.refuseRemoval ??
      chunkGraph?.closure?.refuseRemoval ??
      closureStatus === 'incomplete',
  );

  const completeEnough = COMPLETE_ENOUGH.includes(closureStatus) && !refuseRemoval;

  return {
    observationId: observation.observationId || opts.observationId,
    buildId: observation.buildId || buildId,
    observationDir,
    phase2Dir,
    evidence,
    status,
    chunkGraph,
    closureStatus,
    refuseRemoval,
    completeEnough,
  };
}

/**
 * List observations that have a complete-enough Phase 2 inventory, newest first
 * by observation.observedAt when available, else by directory mtime proxy (build path order).
 * @param {{ artifactsRoot: string }} opts
 * @returns {Promise<Array<{ observationId: string, buildId: string, observedAt: string | null }>>}
 */
export async function listCompletedEvidenceObservations(opts) {
  const { artifactsRoot } = opts;
  /** @type {Array<{ observationId: string, buildId: string, observedAt: string | null }>} */
  const out = [];
  const builds = await readdir(artifactsRoot, { withFileTypes: true });
  for (const ent of builds) {
    if (!ent.isDirectory() || ent.name.startsWith('.')) continue;
    const buildDir = path.join(artifactsRoot, ent.name);
    let obsDirs;
    try {
      obsDirs = await readdir(buildDir, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const obsEnt of obsDirs) {
      if (!obsEnt.isDirectory() || obsEnt.name.startsWith('.')) continue;
      const obsDir = path.join(buildDir, obsEnt.name);
      const evidencePath = path.join(obsDir, PHASE2_DIR, EVIDENCE_FILE);
      const statusPath = path.join(obsDir, PHASE2_DIR, STATUS_FILE);
      if (!(await exists(evidencePath))) continue;

      let closureStatus = 'unknown';
      let refuseRemoval = false;
      if (await exists(statusPath)) {
        try {
          const st = JSON.parse(await readFile(statusPath, 'utf8'));
          closureStatus = st.status || closureStatus;
          refuseRemoval = Boolean(st.refuseRemoval);
        } catch {
          continue;
        }
      } else {
        try {
          const ev = JSON.parse(await readFile(evidencePath, 'utf8'));
          closureStatus = ev.closureSummary?.status || closureStatus;
          refuseRemoval = Boolean(ev.closureSummary?.refuseRemoval);
        } catch {
          continue;
        }
      }

      if (!COMPLETE_ENOUGH.includes(closureStatus) || refuseRemoval) continue;

      let observedAt = null;
      try {
        const observation = JSON.parse(
          await readFile(path.join(obsDir, 'observation.json'), 'utf8'),
        );
        observedAt = observation.observedAt || observation.extractedAt || null;
      } catch {
        // keep null
      }

      out.push({
        observationId: obsEnt.name,
        buildId: ent.name,
        observedAt,
      });
    }
  }

  out.sort((a, b) => {
    const ta = a.observedAt ? Date.parse(a.observedAt) : 0;
    const tb = b.observedAt ? Date.parse(b.observedAt) : 0;
    if (ta !== tb) return tb - ta;
    return b.observationId.localeCompare(a.observationId);
  });

  return out;
}

/**
 * Minimal schema guard for Phase 2.1.1 inventories.
 * @param {object} evidence
 * @param {string} observationId
 */
export function validateEvidenceShape(evidence, observationId) {
  if (!evidence || typeof evidence !== 'object') {
    throw new Error(`Invalid evidence for ${observationId}: not an object`);
  }
  if (evidence.schemaVersion !== 2) {
    throw new Error(
      `Unsupported evidence schemaVersion=${evidence.schemaVersion} for ${observationId} (need 2)`,
    );
  }
  if (!Array.isArray(evidence.items)) {
    throw new Error(`Invalid evidence for ${observationId}: items[] required`);
  }
  if (evidence.observationId && evidence.observationId !== observationId) {
    throw new Error(
      `Evidence observationId mismatch: ${evidence.observationId} vs ${observationId}`,
    );
  }
  for (const item of evidence.items) {
    if (!item?.id || !item?.category) {
      throw new Error(
        `Invalid evidence item in ${observationId}: each item needs id + category`,
      );
    }
  }
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
