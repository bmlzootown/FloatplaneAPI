/**
 * Phase 2.3 backlog: discover Phase 1 observations needing extract/compare,
 * even when live frontend is unchanged. Lineage via previousObservationId —
 * process predecessor first (A→B then B→C; never A→C skip).
 */

import { access, readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import {
  comparisonNeedsWork,
  extractNeedsWork,
  extractReadyForCompare,
  readOrDeriveProcessing,
} from './status.mjs';
import { COMPARISON_STATUS, EXTRACT_STATUS } from './constants.mjs';

/**
 * @typedef {import('./status.mjs').ProcessingRecord} ProcessingRecord
 */

/**
 * @typedef {object} ListedObservation
 * @property {string} observationId
 * @property {string} buildId
 * @property {string|null} previousObservationId
 * @property {string|null} observedAt
 * @property {string} observationDir
 * @property {string} artifactDirRel
 */

/**
 * @param {string} p
 */
async function exists(p) {
  try {
    await access(p);
    return true;
  } catch {
    return false;
  }
}

/**
 * List all Phase 1 observations under artifacts/frontend (has observation.json).
 * @param {{ artifactsRoot: string, repoRoot?: string }} opts
 * @returns {Promise<ListedObservation[]>}
 */
export async function listAllObservations(opts) {
  const { artifactsRoot } = opts;
  /** @type {ListedObservation[]} */
  const out = [];
  let builds;
  try {
    builds = await readdir(artifactsRoot, { withFileTypes: true });
  } catch {
    return out;
  }

  for (const ent of builds) {
    if (!ent.isDirectory() || ent.name.startsWith('.')) continue;
    // Skip non-build dirs (e.g. index files live at root).
    const buildDir = path.join(artifactsRoot, ent.name);
    let obsDirs;
    try {
      obsDirs = await readdir(buildDir, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const obsEnt of obsDirs) {
      if (!obsEnt.isDirectory() || obsEnt.name.startsWith('.')) continue;
      const observationDir = path.join(buildDir, obsEnt.name);
      const obsPath = path.join(observationDir, 'observation.json');
      if (!(await exists(obsPath))) continue;
      try {
        const observation = JSON.parse(await readFile(obsPath, 'utf8'));
        const observationId =
          observation.observationId || obsEnt.name;
        const buildId = observation.buildId || ent.name;
        const previousObservationId =
          observation.previousObservationId === undefined
            ? null
            : observation.previousObservationId;
        out.push({
          observationId,
          buildId,
          previousObservationId,
          observedAt: observation.observedAt || null,
          observationDir,
          artifactDirRel: path.posix.join(
            'artifacts/frontend',
            buildId,
            observationId,
          ),
        });
      } catch {
        // skip corrupt
      }
    }
  }

  return out;
}

/**
 * Topological order by previousObservationId lineage.
 * Unknown predecessors (missing from set) are treated as roots.
 * Deterministic: among ready roots, sort by observedAt then observationId.
 *
 * @param {ListedObservation[]} observations
 * @returns {ListedObservation[]}
 */
export function orderByLineage(observations) {
  const byId = new Map(observations.map((o) => [o.observationId, o]));
  /** @type {Map<string, string[]>} */
  const children = new Map();
  /** @type {Map<string, number>} */
  const indegree = new Map();

  for (const o of observations) {
    indegree.set(o.observationId, 0);
    children.set(o.observationId, []);
  }

  for (const o of observations) {
    const pred = o.previousObservationId;
    if (pred && byId.has(pred)) {
      children.get(pred).push(o.observationId);
      indegree.set(o.observationId, (indegree.get(o.observationId) || 0) + 1);
    }
  }

  const sortReady = (ids) =>
    ids
      .map((id) => byId.get(id))
      .sort((a, b) => {
        const ta = a.observedAt ? Date.parse(a.observedAt) : 0;
        const tb = b.observedAt ? Date.parse(b.observedAt) : 0;
        if (ta !== tb) return ta - tb;
        return a.observationId.localeCompare(b.observationId);
      })
      .map((o) => o.observationId);

  let ready = sortReady(
    [...indegree.entries()].filter(([, d]) => d === 0).map(([id]) => id),
  );
  /** @type {ListedObservation[]} */
  const ordered = [];
  const seen = new Set();

  while (ready.length) {
    const id = ready.shift();
    if (seen.has(id)) continue;
    seen.add(id);
    ordered.push(byId.get(id));
    for (const child of children.get(id) || []) {
      indegree.set(child, (indegree.get(child) || 0) - 1);
      if (indegree.get(child) === 0) {
        ready.push(child);
        ready = sortReady(ready);
      }
    }
  }

  // Cycles / orphans not reached: append deterministically.
  for (const o of observations) {
    if (!seen.has(o.observationId)) ordered.push(o);
  }

  return ordered;
}

/**
 * Build processing records for all listed observations.
 * @param {{ artifactsRoot: string, now?: Date }} opts
 */
export async function scanProcessingRecords(opts) {
  const listed = await listAllObservations(opts);
  const ordered = orderByLineage(listed);
  /** @type {ProcessingRecord[]} */
  const records = [];
  /** @type {Map<string, ProcessingRecord>} */
  const byId = new Map();

  for (const o of ordered) {
    const record = await readOrDeriveProcessing({
      observationDir: o.observationDir,
      observationId: o.observationId,
      buildId: o.buildId,
      previousObservationId: o.previousObservationId,
      now: opts.now,
    });
    records.push(record);
    byId.set(record.observationId, record);
  }

  return { listed: ordered, records, byId };
}

/**
 * Decide backlog work items in lineage order.
 * Skips comparison until predecessor extract is terminal.
 * Never fabricates a predecessor for baseline (previousObservationId null).
 *
 * @param {{
 *   records: ProcessingRecord[],
 *   byId: Map<string, ProcessingRecord>,
 * }} opts
 */
export function buildBacklog(opts) {
  const { records, byId } = opts;
  /** @type {Array<{
   *   observationId: string,
   *   buildId: string,
   *   previousObservationId: string|null,
   *   needExtract: boolean,
   *   needCompare: boolean,
   *   blockedReason: string|null,
   *   extractStatus: string,
   *   comparisonStatus: string,
   * }>} */
  const items = [];

  for (const record of records) {
    const needExtract = extractNeedsWork(record);
    let needCompare = comparisonNeedsWork(record);
    /** @type {string|null} */
    let blockedReason = null;

    if (needCompare) {
      const predId = record.previousObservationId;
      if (!predId) {
        needCompare = false;
      } else {
        const pred = byId.get(predId);
        if (!pred) {
          // Predecessor not in archive set — cannot fabricate.
          needCompare = false;
          blockedReason = 'predecessor_observation_missing';
        } else if (!extractReadyForCompare(pred)) {
          needCompare = false;
          blockedReason = 'predecessor_extract_not_ready';
        } else if (!extractReadyForCompare(record) && !needExtract) {
          // Self extract failed/not ready and we aren't extracting this pass.
          needCompare = false;
          blockedReason = 'self_extract_not_ready';
        } else if (!extractReadyForCompare(record) && needExtract) {
          // Will extract first in same process step; compare may follow.
          blockedReason = null;
        }
      }
    }

    // Incomplete promoted: do not endless-retry extract.
    if (record.extract.status === EXTRACT_STATUS.INCOMPLETE_PROMOTED) {
      // compare still allowed with directional gating when predecessor ready
    }

    if (needExtract || needCompare) {
      items.push({
        observationId: record.observationId,
        buildId: record.buildId,
        previousObservationId: record.previousObservationId,
        needExtract,
        needCompare,
        blockedReason,
        extractStatus: record.extract.status,
        comparisonStatus: record.comparison.status,
      });
    }
  }

  return items;
}

/**
 * After extract of `observationId`, whether compare can run in the same pass.
 * @param {ProcessingRecord} record
 * @param {Map<string, ProcessingRecord>} byId
 */
export function canCompareNow(record, byId) {
  if (!record.previousObservationId) return false;
  if (record.comparison?.status === COMPARISON_STATUS.NOT_APPLICABLE) {
    return false;
  }
  if (!extractReadyForCompare(record)) return false;
  const pred = byId.get(record.previousObservationId);
  if (!pred) return false;
  return extractReadyForCompare(pred);
}
