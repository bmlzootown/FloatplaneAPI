/**
 * Per-observation Phase 2 analysis summaries for monitoring PR bodies.
 * Links MD reports; no huge inventories; no server-API claims.
 */

import { access, readFile } from 'node:fs/promises';
import path from 'node:path';
import { COMPARISON_STATUS, EXTRACT_STATUS } from './constants.mjs';
import { DIFFS_SUBDIR, DIFF_REPORT_FILE, DIFF_FILE } from '../diff/constants.mjs';
import { PHASE2_DIR, INVENTORY_FILE } from '../constants.mjs';

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
 * @param {{
 *   artifactsRoot: string,
 *   records: import('./status.mjs').ProcessingRecord[],
 *   listed: Array<{ observationId: string, observationDir: string, artifactDirRel: string }>,
 * }} opts
 */
export async function buildObservationAnalyses(opts) {
  const byDir = new Map(
    opts.listed.map((o) => [o.observationId, o]),
  );
  /** @type {object[]} */
  const analyses = [];

  for (const record of opts.records) {
    const listed = byDir.get(record.observationId);
    const artifactDir = listed?.artifactDirRel ||
      path.posix.join(
        'artifacts/frontend',
        record.buildId,
        record.observationId,
      );

    /** @type {string|null} */
    let inventoryMd = null;
    /** @type {string|null} */
    let diffMd = null;
    /** @type {string|null} */
    let diffJson = null;
    /** @type {object|null} */
    let compactCounts = null;
    /** @type {string|null} */
    let comparisonHeadline = null;

    if (
      record.extract.status === EXTRACT_STATUS.COMPLETE ||
      record.extract.status === EXTRACT_STATUS.INCOMPLETE_PROMOTED
    ) {
      inventoryMd = path.posix.join(artifactDir, PHASE2_DIR, INVENTORY_FILE);
    }

    if (
      record.previousObservationId &&
      record.comparison.status === COMPARISON_STATUS.COMPLETE
    ) {
      const diffRel = path.posix.join(
        artifactDir,
        PHASE2_DIR,
        DIFFS_SUBDIR,
        record.previousObservationId,
      );
      diffMd = path.posix.join(diffRel, DIFF_REPORT_FILE);
      diffJson = path.posix.join(diffRel, DIFF_FILE);

      if (listed?.observationDir) {
        const absDiff = path.join(
          listed.observationDir,
          PHASE2_DIR,
          DIFFS_SUBDIR,
          record.previousObservationId,
          DIFF_FILE,
        );
        if (await exists(absDiff)) {
          try {
            const diff = JSON.parse(await readFile(absDiff, 'utf8'));
            compactCounts = compactDiffCounts(diff.counts);
            comparisonHeadline = headlineFromDiff(diff);
          } catch {
            // ignore
          }
        }
      }
    } else if (!record.previousObservationId) {
      comparisonHeadline =
        'Baseline observation — no predecessor compare (not fabricated).';
    } else if (record.comparison.status === COMPARISON_STATUS.PENDING) {
      comparisonHeadline = 'Comparison pending (predecessor or self extract not ready).';
    } else if (record.comparison.status === COMPARISON_STATUS.FAILED) {
      comparisonHeadline = `Comparison failed: ${record.comparison.error || 'see processing.json'}`;
    }

    analyses.push({
      observationId: record.observationId,
      buildId: record.buildId,
      previousObservationId: record.previousObservationId,
      extractStatus: record.extract.status,
      closureStatus: record.extract.closureStatus,
      comparisonStatus: record.comparison.status,
      comparisonOutcome: record.comparison.comparisonStatus,
      inventoryMd,
      diffMd,
      diffJson,
      compactCounts,
      headline: comparisonHeadline,
      disclaimer:
        'Frontend-evidence analysis only — does not claim the Floatplane server API changed.',
    });
  }

  return analyses;
}

/**
 * Keep PR bodies small — totals only, not full inventories.
 * @param {object|null|undefined} counts
 */
export function compactDiffCounts(counts) {
  if (!counts || typeof counts !== 'object') return null;
  return {
    totalAtomic: counts.totalAtomic ?? null,
    totalDerived: counts.totalDerived ?? null,
    suppressedTotal: counts.suppressedTotal ?? null,
    structured_operation_added: counts.structured_operation_added ?? 0,
    structured_operation_disappeared:
      counts.structured_operation_disappeared ?? 0,
    method_set_changed: counts.method_set_changed ?? 0,
    provenance_moved: counts.provenance_moved ?? 0,
  };
}

/**
 * @param {object} diff
 */
function headlineFromDiff(diff) {
  const c = compactDiffCounts(diff.counts) || {};
  const parts = [];
  if (c.structured_operation_added)
    parts.push(`${c.structured_operation_added} structured op(s) added in frontend evidence`);
  if (c.structured_operation_disappeared)
    parts.push(
      `${c.structured_operation_disappeared} structured op(s) disappeared from frontend evidence`,
    );
  if (c.method_set_changed)
    parts.push(`${c.method_set_changed} method-set change(s)`);
  if (c.provenance_moved)
    parts.push(`${c.provenance_moved} provenance move(s)`);
  if (!parts.length) {
    return `No semantic frontend-evidence changes (comparisonStatus=${diff.comparisonStatus}).`;
  }
  return parts.join('; ');
}

/**
 * Markdown section for PR body.
 * @param {object[]} analyses
 */
export function formatAnalysisPrSection(analyses = []) {
  const lines = [];
  lines.push('### Phase 2 evidence analysis');
  lines.push('');
  lines.push(
    'Per-observation extract/compare status. Frontend-evidence only — **not** a server API changelog.',
  );
  lines.push('');

  if (!analyses.length) {
    lines.push('_No Phase 2 analyses available yet._');
    lines.push('');
    return lines.join('\n');
  }

  for (const a of analyses) {
    const short = (a.observationId || '').slice(0, 12);
    lines.push(`#### buildId \`${a.buildId}\` (\`${short}…\`)`);
    lines.push('');
    lines.push(`- extract: \`${a.extractStatus}\`${a.closureStatus ? ` (closure \`${a.closureStatus}\`)` : ''}`);
    lines.push(`- comparison: \`${a.comparisonStatus}\`${a.comparisonOutcome ? ` (outcome \`${a.comparisonOutcome}\`)` : ''}`);
    if (a.headline) lines.push(`- summary: ${a.headline}`);
    if (a.compactCounts) {
      lines.push(
        `- counts: atomic=${a.compactCounts.totalAtomic ?? '?'} derived=${a.compactCounts.totalDerived ?? '?'} suppressed=${a.compactCounts.suppressedTotal ?? '?'}`,
      );
    }
    if (a.inventoryMd) lines.push(`- inventory: \`${a.inventoryMd}\``);
    if (a.diffMd) lines.push(`- diff report: \`${a.diffMd}\``);
    lines.push(`- ${a.disclaimer}`);
    lines.push('');
  }

  return lines.join('\n');
}
