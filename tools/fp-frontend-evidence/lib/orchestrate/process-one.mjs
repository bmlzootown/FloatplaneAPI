/**
 * Process one observation: extract (if needed) then compare (if possible).
 * Uses Phase 2.1 runFrontendEvidence + Phase 2.2 runEvidenceDiff.
 * Never writes Phase 1 LKG.
 */

import path from 'node:path';
import { runFrontendEvidence } from '../run.mjs';
import { runEvidenceDiff } from '../diff/run-diff.mjs';
import {
  buildProcessingRecord,
  writeProcessingRecord,
} from './status.mjs';
import { canCompareNow } from './backlog.mjs';
import {
  comparisonNeedsWork,
  extractNeedsWork,
} from './status.mjs';
import {
  COMPARISON_STATUS,
  EXTRACT_STATUS,
  EXIT,
} from './constants.mjs';

/**
 * @typedef {import('./status.mjs').ProcessingRecord} ProcessingRecord
 */

/**
 * @param {{
 *   repoRoot: string,
 *   artifactsRoot: string,
 *   statePath: string,
 *   observation: {
 *     observationId: string,
 *     buildId: string,
 *     previousObservationId: string|null,
 *     observationDir: string,
 *   },
 *   record: ProcessingRecord,
 *   byId: Map<string, ProcessingRecord>,
 *   needExtract: boolean,
 *   needCompare: boolean,
 *   dryRun?: boolean,
 *   force?: boolean,
 *   now?: Date,
 *   fetchImpl?: unknown,
 *   localBodies?: Record<string, Buffer|string>,
 * }} opts
 */
export async function processOneObservation(opts) {
  const now = opts.now || new Date();
  const { observation } = opts;
  /** @type {Map<string, ProcessingRecord>} */
  const byId = opts.byId;

  /** @type {object|null} */
  let extractResult = null;
  /** @type {object|null} */
  let compareResult = null;
  /** @type {string[]} */
  const notes = [];
  /** @type {string[]} */
  const touchedRelPaths = [];

  let record = opts.record;
  let didExtract = false;
  let didCompare = false;
  let extractFailed = false;
  let compareFailed = false;

  if (opts.needExtract || extractNeedsWork(record)) {
    try {
      extractResult = await runFrontendEvidence({
        repoRoot: opts.repoRoot,
        artifactsRoot: opts.artifactsRoot,
        statePath: opts.statePath,
        observationId: observation.observationId,
        buildId: observation.buildId,
        dryRun: Boolean(opts.dryRun),
        force: Boolean(opts.force),
        now,
        fetchImpl: opts.fetchImpl,
        localBodies: opts.localBodies,
      });

      if (opts.dryRun) {
        notes.push('dry-run extract (no promote)');
      } else if (extractResult.ok || extractResult.exitCode === EXIT.INCOMPLETE) {
        didExtract = true;
        touchedRelPaths.push(
          path.posix.join(
            'artifacts/frontend',
            observation.buildId,
            observation.observationId,
            'phase2',
          ),
        );
        if (extractResult.exitCode === EXIT.INCOMPLETE) {
          notes.push(
            'extract promoted incomplete inventory (directional gating applies; no endless retry)',
          );
        }
      } else {
        extractFailed = true;
        notes.push(
          `extract failed: ${extractResult.error || 'unknown error'}`,
        );
      }
    } catch (err) {
      extractFailed = true;
      extractResult = {
        ok: false,
        error: err instanceof Error ? err.message : String(err),
        exitCode: EXIT.FAILURE,
      };
      notes.push(`extract threw: ${extractResult.error}`);
    }

    // Refresh record from disk (or mark failure).
    if (!opts.dryRun) {
      if (extractFailed) {
        record = {
          ...record,
          extract: {
            status: EXTRACT_STATUS.EXTRACT_FAILED,
            closureStatus: null,
            extractedAt: null,
            error: extractResult?.error || 'extract failed',
            refuseRemoval: false,
          },
          updatedAt: now.toISOString(),
        };
        await writeProcessingRecord(observation.observationDir, record);
        touchedRelPaths.push(
          path.posix.join(
            'artifacts/frontend',
            observation.buildId,
            observation.observationId,
            'phase2',
            'processing.json',
          ),
        );
      } else {
        record = await buildProcessingRecord({
          observationDir: observation.observationDir,
          observationId: observation.observationId,
          buildId: observation.buildId,
          previousObservationId: observation.previousObservationId,
          now,
        });
        await writeProcessingRecord(observation.observationDir, record);
      }
      byId.set(record.observationId, record);
    }
  }

  const wantCompare =
    (opts.needCompare || comparisonNeedsWork(record)) &&
    !extractFailed &&
    canCompareNow(record, byId);

  if (wantCompare) {
    try {
      compareResult = await runEvidenceDiff({
        repoRoot: opts.repoRoot,
        artifactsRoot: opts.artifactsRoot,
        fromObservationId: /** @type {string} */ (observation.previousObservationId),
        toObservationId: observation.observationId,
        fromBuildId: byId.get(observation.previousObservationId)?.buildId || null,
        toBuildId: observation.buildId,
        dryRun: Boolean(opts.dryRun),
        force: Boolean(opts.force),
        now,
        labelAsReal: true,
      });

      if (opts.dryRun) {
        notes.push('dry-run compare (no promote)');
      } else if (compareResult.ok || compareResult.exitCode === EXIT.INCOMPLETE) {
        didCompare = true;
        touchedRelPaths.push(
          path.posix.join(
            'artifacts/frontend',
            observation.buildId,
            observation.observationId,
            'phase2',
            'diffs',
            observation.previousObservationId,
          ),
        );
        if (compareResult.exitCode === EXIT.INCOMPLETE) {
          notes.push(
            'compare completed with directional incompleteness (not a crash)',
          );
        }
      } else {
        compareFailed = true;
        notes.push(
          `compare failed: ${compareResult.error || compareResult.diff?.warnings?.[0] || 'unknown'}`,
        );
      }
    } catch (err) {
      compareFailed = true;
      compareResult = {
        ok: false,
        error: err instanceof Error ? err.message : String(err),
        exitCode: EXIT.FAILURE,
      };
      notes.push(`compare threw: ${compareResult.error}`);
    }

    if (!opts.dryRun) {
      if (compareFailed) {
        // Durability boundary: keep extract status from disk (complete); mark compare failed.
        const afterExtract = await buildProcessingRecord({
          observationDir: observation.observationDir,
          observationId: observation.observationId,
          buildId: observation.buildId,
          previousObservationId: observation.previousObservationId,
          now,
        });
        record = {
          ...afterExtract,
          comparison: {
            status: COMPARISON_STATUS.FAILED,
            fromObservationId: observation.previousObservationId,
            comparisonStatus: null,
            diffRelPath: null,
            comparedAt: null,
            error: compareResult?.error || 'compare failed',
            summaryCounts: null,
          },
          updatedAt: now.toISOString(),
        };
        notes.push(
          'durability_boundary: extract retained; comparison failed — next run retries compare only',
        );
      } else {
        record = await buildProcessingRecord({
          observationDir: observation.observationDir,
          observationId: observation.observationId,
          buildId: observation.buildId,
          previousObservationId: observation.previousObservationId,
          now,
        });
      }
      await writeProcessingRecord(observation.observationDir, record);
      byId.set(record.observationId, record);
      touchedRelPaths.push(
        path.posix.join(
          'artifacts/frontend',
          observation.buildId,
          observation.observationId,
          'phase2',
          'processing.json',
        ),
      );
    }
  } else if (
    observation.previousObservationId == null &&
    record.comparison.status !== COMPARISON_STATUS.NOT_APPLICABLE
  ) {
    // Baseline: never fabricate predecessor report.
    record = {
      ...record,
      comparison: {
        status: COMPARISON_STATUS.NOT_APPLICABLE,
        fromObservationId: null,
        comparisonStatus: null,
        diffRelPath: null,
        comparedAt: null,
        error: null,
        summaryCounts: null,
      },
      updatedAt: now.toISOString(),
    };
    if (!opts.dryRun) {
      await writeProcessingRecord(observation.observationDir, record);
      byId.set(record.observationId, record);
    }
    notes.push('baseline: comparison not_applicable (no fabricated predecessor)');
  }

  return {
    observationId: observation.observationId,
    buildId: observation.buildId,
    previousObservationId: observation.previousObservationId,
    didExtract,
    didCompare,
    extractFailed,
    compareFailed,
    extractResult,
    compareResult,
    record,
    notes,
    touchedRelPaths: [...new Set(touchedRelPaths)],
  };
}
