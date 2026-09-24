/**
 * Machine-readable Phase 2 processing status + index.
 * Never writes Phase 1 LKG (state/last-known-frontend.json).
 */

import { access, mkdir, readFile, rename, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import {
  COMPARISON_STATUS,
  EXISTENCE,
  EXTRACT_STATUS,
  INDEX_SCHEMA_VERSION,
  ORCHESTRATOR_ID,
  ORCHESTRATOR_VERSION,
  PROCESSING_FILE,
  PROCESSING_INDEX_FILE,
  PROCESSING_SCHEMA_VERSION,
} from './constants.mjs';
import { PHASE2_DIR, STATUS_FILE, EVIDENCE_FILE } from '../constants.mjs';
import { DIFFS_SUBDIR, DIFF_FILE, DIFF_STATUS_FILE } from '../diff/constants.mjs';

/**
 * @typedef {object} ExtractRecord
 * @property {string} status
 * @property {string|null} [closureStatus]
 * @property {string|null} [extractedAt]
 * @property {string|null} [error]
 * @property {boolean} [refuseRemoval]
 */

/**
 * @typedef {object} ComparisonRecord
 * @property {string} status
 * @property {string|null} [fromObservationId]
 * @property {string|null} [comparisonStatus]
 * @property {string|null} [diffRelPath]
 * @property {string|null} [comparedAt]
 * @property {string|null} [error]
 * @property {object|null} [summaryCounts]
 */

/**
 * @typedef {object} ProcessingRecord
 * @property {number} schemaVersion
 * @property {string} orchestratorId
 * @property {string} orchestratorVersion
 * @property {string} observationId
 * @property {string} buildId
 * @property {string|null} previousObservationId
 * @property {string} existence
 * @property {ExtractRecord} extract
 * @property {ComparisonRecord} comparison
 * @property {string} updatedAt
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
 * Absolute path to per-observation processing.json.
 * @param {string} observationDir
 */
export function processingPath(observationDir) {
  return path.join(observationDir, PHASE2_DIR, PROCESSING_FILE);
}

/**
 * @param {string} artifactsRoot
 */
export function indexPath(artifactsRoot) {
  return path.join(artifactsRoot, PROCESSING_INDEX_FILE);
}

/**
 * Derive extract status from on-disk Phase 2.1 artifacts (authoritative when present).
 * Intentional incomplete inventory → incomplete_promoted (no endless retry).
 * Missing/corrupt after attempt → extract_failed (retryable).
 * No phase2 at all → not_processed.
 *
 * @param {string} observationDir
 * @returns {Promise<{ extract: ExtractRecord, hasEvidence: boolean, hasStatus: boolean }>}
 */
export async function inspectExtractArtifacts(observationDir) {
  const phase2Dir = path.join(observationDir, PHASE2_DIR);
  const statusPath = path.join(phase2Dir, STATUS_FILE);
  const evidencePath = path.join(phase2Dir, EVIDENCE_FILE);
  const hasStatus = await exists(statusPath);
  const hasEvidence = await exists(evidencePath);

  if (!hasStatus && !hasEvidence) {
    return {
      hasEvidence: false,
      hasStatus: false,
      extract: {
        status: EXTRACT_STATUS.NOT_PROCESSED,
        closureStatus: null,
        extractedAt: null,
        error: null,
        refuseRemoval: false,
      },
    };
  }

  if (!hasStatus || !hasEvidence) {
    return {
      hasEvidence,
      hasStatus,
      extract: {
        status: EXTRACT_STATUS.EXTRACT_FAILED,
        closureStatus: null,
        extractedAt: null,
        error: hasStatus
          ? 'status.json present but api-evidence.json missing'
          : 'api-evidence.json present but status.json missing',
        refuseRemoval: false,
      },
    };
  }

  try {
    const status = JSON.parse(await readFile(statusPath, 'utf8'));
    const closureStatus = status.status || 'unknown';
    const refuseRemoval = Boolean(status.refuseRemoval);
    const extractedAt = status.extractedAt || status.updatedAt || null;

    if (closureStatus === 'incomplete' || refuseRemoval) {
      return {
        hasEvidence: true,
        hasStatus: true,
        extract: {
          status: EXTRACT_STATUS.INCOMPLETE_PROMOTED,
          closureStatus,
          extractedAt,
          error: null,
          refuseRemoval: true,
        },
      };
    }

    if (
      closureStatus === 'complete' ||
      closureStatus === 'complete_with_external_rejects'
    ) {
      return {
        hasEvidence: true,
        hasStatus: true,
        extract: {
          status: EXTRACT_STATUS.COMPLETE,
          closureStatus,
          extractedAt,
          error: null,
          refuseRemoval: false,
        },
      };
    }

    return {
      hasEvidence: true,
      hasStatus: true,
      extract: {
        status: EXTRACT_STATUS.EXTRACT_FAILED,
        closureStatus,
        extractedAt,
        error: `Unrecognized closure status: ${closureStatus}`,
        refuseRemoval,
      },
    };
  } catch (err) {
    return {
      hasEvidence,
      hasStatus,
      extract: {
        status: EXTRACT_STATUS.EXTRACT_FAILED,
        closureStatus: null,
        extractedAt: null,
        error: err instanceof Error ? err.message : String(err),
        refuseRemoval: false,
      },
    };
  }
}

/**
 * Inspect comparison artifacts for A→B where B is this observation.
 * @param {string} observationDir
 * @param {string|null} previousObservationId
 */
export async function inspectComparisonArtifacts(
  observationDir,
  previousObservationId,
) {
  if (previousObservationId == null || previousObservationId === '') {
    return {
      comparison: {
        status: COMPARISON_STATUS.NOT_APPLICABLE,
        fromObservationId: null,
        comparisonStatus: null,
        diffRelPath: null,
        comparedAt: null,
        error: null,
        summaryCounts: null,
      },
    };
  }

  const diffDir = path.join(
    observationDir,
    PHASE2_DIR,
    DIFFS_SUBDIR,
    previousObservationId,
  );
  const diffPath = path.join(diffDir, DIFF_FILE);
  const diffStatusPath = path.join(diffDir, DIFF_STATUS_FILE);

  if (!(await exists(diffPath))) {
    return {
      comparison: {
        status: COMPARISON_STATUS.PENDING,
        fromObservationId: previousObservationId,
        comparisonStatus: null,
        diffRelPath: null,
        comparedAt: null,
        error: null,
        summaryCounts: null,
      },
    };
  }

  try {
    const diff = JSON.parse(await readFile(diffPath, 'utf8'));
    let comparedAt = null;
    if (await exists(diffStatusPath)) {
      try {
        const st = JSON.parse(await readFile(diffStatusPath, 'utf8'));
        comparedAt = st.comparedAt || st.updatedAt || null;
      } catch {
        // ignore
      }
    }
    return {
      comparison: {
        status: COMPARISON_STATUS.COMPLETE,
        fromObservationId: previousObservationId,
        comparisonStatus: diff.comparisonStatus || null,
        diffRelPath: path.posix.join(
          PHASE2_DIR,
          DIFFS_SUBDIR,
          previousObservationId,
        ),
        comparedAt: comparedAt || diff.comparedAt || null,
        error: null,
        summaryCounts: diff.counts || null,
      },
    };
  } catch (err) {
    return {
      comparison: {
        status: COMPARISON_STATUS.FAILED,
        fromObservationId: previousObservationId,
        comparisonStatus: null,
        diffRelPath: null,
        comparedAt: null,
        error: err instanceof Error ? err.message : String(err),
        summaryCounts: null,
      },
    };
  }
}

/**
 * Build a fresh processing record from disk + observation.json lineage.
 * @param {{
 *   observationDir: string,
 *   observationId: string,
 *   buildId: string,
 *   previousObservationId?: string | null,
 *   now?: Date,
 * }} opts
 * @returns {Promise<ProcessingRecord>}
 */
export async function buildProcessingRecord(opts) {
  const now = opts.now || new Date();
  const previousObservationId =
    opts.previousObservationId === undefined
      ? null
      : opts.previousObservationId;

  const { extract } = await inspectExtractArtifacts(opts.observationDir);
  const { comparison } = await inspectComparisonArtifacts(
    opts.observationDir,
    previousObservationId,
  );

  // If extract is not ready, comparison stays pending (unless no predecessor).
  let comparisonOut = comparison;
  if (
    previousObservationId &&
    extract.status !== EXTRACT_STATUS.COMPLETE &&
    extract.status !== EXTRACT_STATUS.INCOMPLETE_PROMOTED &&
    comparison.status === COMPARISON_STATUS.PENDING
  ) {
    comparisonOut = {
      ...comparison,
      status: COMPARISON_STATUS.PENDING,
    };
  }

  return {
    schemaVersion: PROCESSING_SCHEMA_VERSION,
    orchestratorId: ORCHESTRATOR_ID,
    orchestratorVersion: ORCHESTRATOR_VERSION,
    observationId: opts.observationId,
    buildId: opts.buildId,
    previousObservationId,
    existence: EXISTENCE.EXISTS,
    extract,
    comparison: comparisonOut,
    updatedAt: now.toISOString(),
  };
}

/**
 * Read processing.json if present; otherwise derive from artifacts.
 * @param {{
 *   observationDir: string,
 *   observationId: string,
 *   buildId: string,
 *   previousObservationId?: string | null,
 *   now?: Date,
 * }} opts
 */
export async function readOrDeriveProcessing(opts) {
  const p = processingPath(opts.observationDir);
  if (await exists(p)) {
    try {
      const stored = JSON.parse(await readFile(p, 'utf8'));
      // Reconcile with live artifacts (artifacts win for extract/comparison facts).
      const fresh = await buildProcessingRecord(opts);
      return {
        ...stored,
        ...fresh,
        // Preserve failure notes only when still failed and no promoted inventory.
        extract:
          fresh.extract.status === EXTRACT_STATUS.NOT_PROCESSED &&
          stored.extract?.status === EXTRACT_STATUS.EXTRACT_FAILED
            ? stored.extract
            : fresh.extract,
      };
    } catch {
      return buildProcessingRecord(opts);
    }
  }
  return buildProcessingRecord(opts);
}

/**
 * Transactional write of processing.json under phase2/.
 * @param {string} observationDir
 * @param {ProcessingRecord} record
 */
export async function writeProcessingRecord(observationDir, record) {
  const phase2Dir = path.join(observationDir, PHASE2_DIR);
  await mkdir(phase2Dir, { recursive: true });
  const dest = processingPath(observationDir);
  const staging = `${dest}.staging-${process.pid}-${Date.now()}`;
  try {
    await writeFile(staging, `${JSON.stringify(record, null, 2)}\n`, 'utf8');
    await rename(staging, dest);
  } catch (err) {
    await rm(staging, { force: true }).catch(() => {});
    throw err;
  }
  return dest;
}

/**
 * @param {ProcessingRecord} record
 */
export function extractNeedsWork(record) {
  const s = record.extract?.status;
  return (
    s === EXTRACT_STATUS.NOT_PROCESSED || s === EXTRACT_STATUS.EXTRACT_FAILED
  );
}

/**
 * Intentional incomplete does NOT need extract retry.
 * @param {ProcessingRecord} record
 */
export function extractIsTerminal(record) {
  const s = record.extract?.status;
  return (
    s === EXTRACT_STATUS.COMPLETE || s === EXTRACT_STATUS.INCOMPLETE_PROMOTED
  );
}

/**
 * Comparison needed when predecessor exists and compare not yet complete/failed permanently.
 * Failed comparisons are retryable (operational).
 * @param {ProcessingRecord} record
 */
export function comparisonNeedsWork(record) {
  if (!record.previousObservationId) return false;
  const s = record.comparison?.status;
  return s === COMPARISON_STATUS.PENDING || s === COMPARISON_STATUS.FAILED;
}

/**
 * True when extract is ready enough to compare (complete or valid incomplete).
 * @param {ProcessingRecord} record
 */
export function extractReadyForCompare(record) {
  return extractIsTerminal(record);
}

/**
 * Rebuild global index from all observations under artifacts root.
 * @param {{
 *   artifactsRoot: string,
 *   records: ProcessingRecord[],
 *   now?: Date,
 * }} opts
 */
export async function writeProcessingIndex(opts) {
  const now = opts.now || new Date();
  const index = {
    schemaVersion: INDEX_SCHEMA_VERSION,
    orchestratorId: ORCHESTRATOR_ID,
    orchestratorVersion: ORCHESTRATOR_VERSION,
    updatedAt: now.toISOString(),
    note:
      'Phase 2 processing index only. Does not alter Phase 1 LKG meaning ' +
      '(state/last-known-frontend.json).',
    observations: opts.records.map((r) => ({
      observationId: r.observationId,
      buildId: r.buildId,
      previousObservationId: r.previousObservationId,
      existence: r.existence,
      extractStatus: r.extract.status,
      comparisonStatus: r.comparison.status,
      processingPath: path.posix.join(
        'artifacts/frontend',
        r.buildId,
        r.observationId,
        PHASE2_DIR,
        PROCESSING_FILE,
      ),
    })),
  };

  const dest = indexPath(opts.artifactsRoot);
  const staging = `${dest}.staging-${process.pid}-${Date.now()}`;
  try {
    await writeFile(staging, `${JSON.stringify(index, null, 2)}\n`, 'utf8');
    await rename(staging, dest);
  } catch (err) {
    await rm(staging, { force: true }).catch(() => {});
    throw err;
  }
  return { path: dest, index };
}

/**
 * @param {string} artifactsRoot
 */
export async function readProcessingIndex(artifactsRoot) {
  const p = indexPath(artifactsRoot);
  if (!(await exists(p))) return null;
  return JSON.parse(await readFile(p, 'utf8'));
}
