/**
 * Phase 2.3 backlog runner: lineage-ordered extract + compare across observations.
 */

import path from 'node:path';
import {
  buildBacklog,
  listAllObservations,
  orderByLineage,
  scanProcessingRecords,
} from './backlog.mjs';
import { processOneObservation } from './process-one.mjs';
import { writeProcessingIndex } from './status.mjs';
import { PROCESSING_INDEX_FILE } from './constants.mjs';
import {
  buildCommitSequence,
  decidePhase2PrAction,
  phase2DecisionScaffold,
} from './decision.mjs';
import { buildObservationAnalyses } from './pr-analysis.mjs';

/**
 * Run Phase 2 backlog processing.
 *
 * @param {{
 *   repoRoot: string,
 *   artifactsRoot: string,
 *   statePath: string,
 *   dryRun?: boolean,
 *   force?: boolean,
 *   now?: Date,
 *   fetchImpl?: unknown,
 *   localBodies?: Record<string, Buffer|string>,
 *   phase1Decision?: object|null,
 *   openMonitorPr?: object|null,
 *   hasUniquePendingPhase1?: boolean,
 *   skipProcess?: boolean,
 * }} opts
 */
export async function runPhase2Backlog(opts) {
  const now = opts.now || new Date();
  const { listed, records, byId } = await scanProcessingRecords({
    artifactsRoot: opts.artifactsRoot,
    now,
  });

  const backlog = buildBacklog({ records, byId });
  /** @type {Awaited<ReturnType<typeof processOneObservation>>[]} */
  const results = [];

  if (!opts.skipProcess) {
    // Process in lineage order (listed already ordered).
    const listedById = new Map(listed.map((o) => [o.observationId, o]));
    for (const item of backlog) {
      const observation = listedById.get(item.observationId);
      if (!observation) continue;
      const record = byId.get(item.observationId);
      if (!record) continue;

      // If blocked only on predecessor and we're not extracting self, skip compare.
      const needExtract = item.needExtract;
      let needCompare = item.needCompare;
      if (item.blockedReason === 'predecessor_extract_not_ready') {
        needCompare = false;
      }
      if (item.blockedReason === 'predecessor_observation_missing') {
        needCompare = false;
      }

      if (!needExtract && !needCompare) {
        results.push({
          observationId: item.observationId,
          buildId: item.buildId,
          previousObservationId: item.previousObservationId,
          didExtract: false,
          didCompare: false,
          extractFailed: false,
          compareFailed: false,
          extractResult: null,
          compareResult: null,
          record,
          notes: item.blockedReason
            ? [`skipped: ${item.blockedReason}`]
            : ['no work'],
          touchedRelPaths: [],
        });
        continue;
      }

      const result = await processOneObservation({
        repoRoot: opts.repoRoot,
        artifactsRoot: opts.artifactsRoot,
        statePath: opts.statePath,
        observation,
        record,
        byId,
        needExtract,
        needCompare,
        dryRun: opts.dryRun,
        force: opts.force,
        now,
        fetchImpl: opts.fetchImpl,
        localBodies: opts.localBodies,
      });
      results.push(result);
    }
  }

  // Refresh view after processing. Only rewrite index when Phase 2 mutated something
  // (avoid dirtying the worktree on pure no-ops).
  const refreshed = await scanProcessingRecords({
    artifactsRoot: opts.artifactsRoot,
    now,
  });

  const mutated = results.some(
    (r) => r.didExtract || r.didCompare || r.extractFailed || r.compareFailed,
  );

  if (!opts.dryRun && mutated) {
    await writeProcessingIndex({
      artifactsRoot: opts.artifactsRoot,
      records: refreshed.records,
      now,
    });
  }

  const phase1 = opts.phase1Decision || null;
  const phase1Append = Boolean(phase1?.appendObservationCommit);
  const phase1Paths = [
    'state/last-known-frontend.json',
    phase1?.checkSummary?.artifactDir,
  ].filter(Boolean);

  const indexRel = path.posix.join('artifacts/frontend', PROCESSING_INDEX_FILE);
  // Commit extract (and index) when compare failed after successful extract (durability boundary).
  const indexPath =
    results.some((r) => r.didExtract || r.didCompare || r.compareFailed || r.extractFailed)
      ? indexRel
      : null;

  const commitPlan = buildCommitSequence({
    phase1Append,
    phase1CommitMessage: phase1?.commitMessage || null,
    phase1Paths,
    phase2Results: results,
    indexPath,
  });

  const phase2CommitCount = commitPlan.commits.filter(
    (c) => c.phase === 'phase2',
  ).length;

  // Partial extract success still counts as Phase 2 work for PR / main-backfill decisions.
  const phase2OnMainOnly =
    !opts.hasUniquePendingPhase1 &&
    results.some((r) => r.didExtract || r.didCompare) &&
    (phase1?.action === 'noop' || !phase1Append);

  const prAction = decidePhase2PrAction({
    phase1Action: phase1?.action || 'noop',
    phase2CommitCount,
    openMonitorPr: opts.openMonitorPr || phase1?.openMonitorPr || null,
    hasUniquePendingPhase1: Boolean(opts.hasUniquePendingPhase1),
    phase2BacklogOnMainOnly: Boolean(phase2OnMainOnly),
  });

  const analyses = await buildObservationAnalyses({
    artifactsRoot: opts.artifactsRoot,
    records: refreshed.records,
    listed: refreshed.listed,
  });

  return phase2DecisionScaffold({
    action: prAction.action,
    reason: prAction.reason,
    phase1Action: phase1?.action || null,
    backlog,
    results: results.map((r) => ({
      observationId: r.observationId,
      buildId: r.buildId,
      previousObservationId: r.previousObservationId,
      didExtract: r.didExtract,
      didCompare: r.didCompare,
      extractFailed: r.extractFailed,
      compareFailed: r.compareFailed,
      notes: r.notes,
      touchedRelPaths: r.touchedRelPaths,
      extractStatus: r.record?.extract?.status,
      comparisonStatus: r.record?.comparison?.status,
    })),
    records: refreshed.records,
    commitSequence: commitPlan,
    pr: prAction,
    analyses,
    updatePullRequest: prAction.updatePullRequest,
    createPullRequest: prAction.createPullRequest,
    appendPhase2Commits: phase2CommitCount > 0,
    notes: [
      ...(prAction.notes || []),
      ...commitPlan.notes,
      `Processed backlog items: ${backlog.length}; extract/compare results: ${results.length}.`,
    ],
  });
}

export { listAllObservations, orderByLineage, buildBacklog, scanProcessingRecords };
