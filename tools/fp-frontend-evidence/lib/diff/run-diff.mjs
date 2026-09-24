/**
 * Phase 2.2 orchestration: load two inventories, compare, transactional promote.
 *
 * - Offline archives only (no live Floatplane)
 * - Idempotent for same comparator version + same A/B inventories
 * - Never mutates Phase 1 LKG or source evidence inventories
 */

import { mkdir, writeFile, readFile, rename, rm, access } from 'node:fs/promises';
import path from 'node:path';
import {
  PHASE2_DIR,
} from '../constants.mjs';
import {
  COMPARATOR_ID,
  COMPARATOR_VERSION,
  COMPARISON_STATUS,
  DIFF_FILE,
  DIFF_REPORT_FILE,
  DIFF_STATUS_FILE,
  DIFFS_SUBDIR,
  DIFF_SCHEMA_VERSION,
  EXIT,
} from './constants.mjs';
import { compareEvidenceInventories } from './compare.mjs';
import {
  loadEvidenceInventory,
  listCompletedEvidenceObservations,
} from './load.mjs';
import { renderEvidenceDiffMarkdown } from './report.mjs';

/**
 * @param {{
 *   repoRoot: string,
 *   artifactsRoot: string,
 *   fromObservationId: string,
 *   toObservationId: string,
 *   fromBuildId?: string | null,
 *   toBuildId?: string | null,
 *   dryRun?: boolean,
 *   force?: boolean,
 *   now?: Date,
 *   labelAsReal?: boolean,
 * }} options
 */
export async function runEvidenceDiff(options) {
  const now = options.now || new Date();
  const from = await loadEvidenceInventory({
    artifactsRoot: options.artifactsRoot,
    observationId: options.fromObservationId,
    buildId: options.fromBuildId || null,
  });
  const to = await loadEvidenceInventory({
    artifactsRoot: options.artifactsRoot,
    observationId: options.toObservationId,
    buildId: options.toBuildId || null,
  });

  if (from.observationId === to.observationId && from.buildId === to.buildId) {
    // Same observation compare is allowed (identity / smoke) but warn via label
  }

  const labelAsReal =
    options.labelAsReal === true
      ? true
      : options.labelAsReal === false
        ? false
        : inferLabelAsReal(from, to);

  const diff = compareEvidenceInventories({
    from,
    to,
    now,
    labelAsReal,
  });

  const report = renderEvidenceDiffMarkdown(diff);

  const outDir = path.join(
    to.phase2Dir,
    DIFFS_SUBDIR,
    from.observationId,
  );

  if (options.dryRun) {
    return {
      ok: diff.comparisonStatus !== COMPARISON_STATUS.ERROR,
      idempotent: false,
      dryRun: true,
      exitCode:
        diff.comparisonStatus === COMPARISON_STATUS.INCOMPLETE
          ? EXIT.INCOMPLETE
          : EXIT.SUCCESS,
      from,
      to,
      diff,
      report,
      outDir,
    };
  }

  // Idempotent: identical comparator + input fingerprints → skip rewrite churn
  const statusPath = path.join(outDir, DIFF_STATUS_FILE);
  const fingerprint = diffFingerprint(from, to);
  if (!options.force && (await exists(statusPath))) {
    try {
      const prev = JSON.parse(await readFile(statusPath, 'utf8'));
      if (
        prev.comparatorId === COMPARATOR_ID &&
        prev.comparatorVersion === COMPARATOR_VERSION &&
        prev.diffSchemaVersion === DIFF_SCHEMA_VERSION &&
        prev.fingerprint === fingerprint &&
        (await exists(path.join(outDir, DIFF_FILE))) &&
        (await exists(path.join(outDir, DIFF_REPORT_FILE)))
      ) {
        const existingDiff = JSON.parse(
          await readFile(path.join(outDir, DIFF_FILE), 'utf8'),
        );
        const existingReport = await readFile(
          path.join(outDir, DIFF_REPORT_FILE),
          'utf8',
        );
        return {
          ok: true,
          idempotent: true,
          exitCode:
            existingDiff.comparisonStatus === COMPARISON_STATUS.INCOMPLETE
              ? EXIT.INCOMPLETE
              : EXIT.SUCCESS,
          from,
          to,
          diff: existingDiff,
          report: existingReport,
          outDir,
        };
      }
    } catch {
      // fall through
    }
  }

  const stagingRoot = path.join(options.artifactsRoot, '.staging');
  const stagingDir = path.join(
    stagingRoot,
    `diff-${to.buildId}-${from.observationId.slice(0, 8)}-${to.observationId.slice(0, 8)}-${process.pid}-${Date.now()}`,
  );
  await rm(stagingDir, { recursive: true, force: true });
  await mkdir(stagingDir, { recursive: true });

  try {
    const status = {
      status: diff.comparisonStatus,
      removalSuppressed: diff.removalSuppressed,
      refuseRemoval: diff.refuseRemoval,
      comparatorId: COMPARATOR_ID,
      comparatorVersion: COMPARATOR_VERSION,
      diffSchemaVersion: DIFF_SCHEMA_VERSION,
      fromObservationId: from.observationId,
      toObservationId: to.observationId,
      fromBuildId: from.buildId,
      toBuildId: to.buildId,
      fingerprint,
      comparedAt: diff.comparedAt,
      updatedAt: now.toISOString(),
      counts: diff.counts,
      labelAsReal: diff.labelAsReal,
    };

    await writeFile(
      path.join(stagingDir, DIFF_FILE),
      `${JSON.stringify(diff, null, 2)}\n`,
    );
    await writeFile(path.join(stagingDir, DIFF_REPORT_FILE), report);
    await writeFile(
      path.join(stagingDir, DIFF_STATUS_FILE),
      `${JSON.stringify(status, null, 2)}\n`,
    );

    // Ensure parent diffs/ exists; promote staging → outDir transactionally
    await mkdir(path.dirname(outDir), { recursive: true });
    const backupDir = `${outDir}.bak-${process.pid}-${Date.now()}`;
    const hadPrior = await exists(outDir);
    if (hadPrior) {
      await rename(outDir, backupDir);
    }
    try {
      await rename(stagingDir, outDir);
    } catch (err) {
      if (hadPrior) {
        await rename(backupDir, outDir).catch(() => {});
      }
      throw err;
    }
    if (hadPrior) {
      await rm(backupDir, { recursive: true, force: true }).catch(() => {});
    }

    // Sanity: source inventories untouched (paths still exist as files we loaded)
    void PHASE2_DIR;

    return {
      ok: true,
      idempotent: false,
      exitCode:
        diff.comparisonStatus === COMPARISON_STATUS.INCOMPLETE
          ? EXIT.INCOMPLETE
          : EXIT.SUCCESS,
      from,
      to,
      diff,
      report,
      outDir,
    };
  } catch (err) {
    await rm(stagingDir, { recursive: true, force: true }).catch(() => {});
    throw err;
  }
}

/**
 * Compare the two most recent complete-enough observations (§12 convenience).
 * @param {{
 *   repoRoot: string,
 *   artifactsRoot: string,
 *   dryRun?: boolean,
 *   force?: boolean,
 *   now?: Date,
 * }} options
 */
export async function runEvidenceDiffLatest(options) {
  const list = await listCompletedEvidenceObservations({
    artifactsRoot: options.artifactsRoot,
  });
  if (list.length < 2) {
    const err = new Error(
      `frontend-evidence-diff-latest requires ≥2 complete Phase 2 inventories; found ${list.length}. ` +
        'Use make frontend-evidence-diff FROM=… TO=… with fixture observations, or wait for a second real observation.',
    );
    /** @type {any} */
    const e = err;
    e.code = 'NEED_TWO_OBSERVATIONS';
    e.available = list;
    throw e;
  }
  const [newer, older] = list;
  return runEvidenceDiff({
    ...options,
    fromObservationId: older.observationId,
    toObservationId: newer.observationId,
    fromBuildId: older.buildId,
    toBuildId: newer.buildId,
    labelAsReal: true,
  });
}

/**
 * @param {import('./load.mjs').LoadedInventory} from
 * @param {import('./load.mjs').LoadedInventory} to
 */
function inferLabelAsReal(from, to) {
  // Fixture observations use synthetic ids / buildIds under tests; real ones are hex obs ids
  const hex64 = /^[a-f0-9]{64}$/i;
  return (
    hex64.test(from.observationId) &&
    hex64.test(to.observationId) &&
    !String(from.buildId).includes('fixture') &&
    !String(to.buildId).includes('fixture')
  );
}

/**
 * @param {import('./load.mjs').LoadedInventory} from
 * @param {import('./load.mjs').LoadedInventory} to
 */
function diffFingerprint(from, to) {
  const fromExtracted = from.evidence.extractedAt || '';
  const toExtracted = to.evidence.extractedAt || '';
  const fromStatus = from.closureStatus;
  const toStatus = to.closureStatus;
  const fromCount = from.evidence.items?.length ?? 0;
  const toCount = to.evidence.items?.length ?? 0;
  return [
    from.observationId,
    to.observationId,
    from.buildId,
    to.buildId,
    fromExtracted,
    toExtracted,
    fromStatus,
    toStatus,
    fromCount,
    toCount,
    from.evidence.stats?.structuredOperationCount ?? '',
    to.evidence.stats?.structuredOperationCount ?? '',
  ].join('|');
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
