/**
 * Pure decision logic for Phase 1.2 cumulative pending observation ledger.
 *
 * main = authoritative merged history
 * cursor/frontend-observation = pending durable ledger (append-only while PR open)
 *
 * Pending detection is observation-state/content based — NOT commit ancestry alone
 * (squash/rebase merges break ancestry while main state already has the tip).
 *
 * No git / network side effects here.
 */

import { EXIT } from './constants.mjs';
import {
  DEFAULT_BRANCH,
  MONITOR_BRANCH,
  MONITORING_CONFLICT_PATH_PREFIXES,
  OBSERVE_COMMIT_PREFIX,
  PR_TITLE_PREFIX,
} from './monitor-constants.mjs';
import {
  classifyMonitoringPathDiffs,
} from '../../fp-frontend-evidence/lib/orchestrate/decision.mjs';

/**
 * @typedef {object} OpenMonitorPr
 * @property {number|string} number
 * @property {string} url
 * @property {string} title
 * @property {string} [body]
 * @property {string} [headRefName]
 * @property {string|null} [observationId]
 * @property {string|null} [buildId]
 * @property {string|null} [headSha]
 */

/**
 * @typedef {object} PendingObservation
 * @property {string} observationId
 * @property {string|null} [previousObservationId]
 * @property {string} buildId
 * @property {string} [observedAt]
 * @property {string} [artifactDir]
 * @property {unknown} [artifacts]
 * @property {string} [layout]
 */

/**
 * @typedef {object} CheckPayload
 * @property {boolean} [ok]
 * @property {boolean} [changed]
 * @property {string} [observationId]
 * @property {string|null} [previousObservationId]
 * @property {string} [buildId]
 * @property {string} [observedAt]
 * @property {string} [artifactDir]
 * @property {unknown} [artifacts]
 * @property {unknown} [comparison]
 * @property {unknown} [noteworthy]
 * @property {string} [error]
 * @property {string} [layout]
 * @property {string} [statePath]
 */

/**
 * @typedef {object} PendingLedgerAssessment
 * @property {boolean} hasUniquePending
 * @property {boolean} fullyLanded
 * @property {boolean} allowResetFromMain
 * @property {string} reason
 * @property {string|null} mainObservationId
 * @property {string|null} monitorTipObservationId
 * @property {string[]} monitoringPathDiffs
 * @property {string} [landingModeHint] merge|squash|rebase|unknown (informational)
 */

/**
 * @param {string|null|undefined} body
 * @returns {string|null}
 */
export function parseObservationIdFromPrBody(body) {
  if (!body) return null;
  const m = body.match(/(?:^|\n)\s*observationId:\s*([a-f0-9]{64})\s*(?:\n|$)/i);
  return m ? m[1].toLowerCase() : null;
}

/**
 * @param {string|null|undefined} body
 * @returns {string|null}
 */
export function parseBuildIdFromPrBody(body) {
  if (!body) return null;
  const m = body.match(/(?:^|\n)\s*buildId:\s*(\S+)\s*(?:\n|$)/i);
  return m ? m[1] : null;
}

/**
 * @param {string|null|undefined} title
 * @returns {string|null}
 */
export function parseBuildIdFromPrTitle(title) {
  if (!title) return null;
  if (!title.startsWith(PR_TITLE_PREFIX)) return null;
  const rest = title.slice(PR_TITLE_PREFIX.length).trim();
  return rest || null;
}

/**
 * @param {OpenMonitorPr[]} prs
 * @returns {OpenMonitorPr[]}
 */
export function normalizeOpenMonitorPrs(prs = []) {
  return prs.map((pr) => {
    const observationId =
      pr.observationId ?? parseObservationIdFromPrBody(pr.body) ?? null;
    const buildId =
      pr.buildId ??
      parseBuildIdFromPrBody(pr.body) ??
      parseBuildIdFromPrTitle(pr.title) ??
      null;
    return { ...pr, observationId, buildId };
  });
}

/**
 * @param {OpenMonitorPr[]} prs
 * @returns {OpenMonitorPr|null}
 */
export function selectMonitorPr(prs) {
  const normalized = normalizeOpenMonitorPrs(prs);
  const onBranch = normalized.find((p) => p.headRefName === MONITOR_BRANCH);
  if (onBranch) return onBranch;
  const byTitle = normalized.find((p) => (p.title || '').startsWith(PR_TITLE_PREFIX));
  return byTitle || null;
}

/**
 * True when a conflict path touches monitoring state/artifacts.
 * @param {string[]} conflictPaths
 */
export function hasMonitoringConflict(conflictPaths = []) {
  return conflictPaths.some((p) =>
    MONITORING_CONFLICT_PATH_PREFIXES.some(
      (prefix) => p === prefix.slice(0, -1) || p.startsWith(prefix),
    ),
  );
}

/**
 * Assess unique pending observations using observation state/content as primary
 * authority — independent of GitHub merge style (merge commit / squash / rebase).
 *
 * Ancestry-only signals (commitsAheadOfMain) are informational and MUST NOT alone
 * decide that unique pending exists when observationIds already match and there
 * are no monitoring-path diffs.
 *
 * @param {object} input
 * @param {string|null} [input.mainObservationId]
 * @param {string|null} [input.monitorTipObservationId]
 * @param {string[]} [input.monitoringPathDiffs] paths under state/ or artifacts/frontend differing monitor→main
 * @param {number} [input.commitsAheadOfMain] ancestry hint only
 * @param {OpenMonitorPr|null} [input.openMonitorPr]
 * @param {'merge'|'squash'|'rebase'|'unknown'} [input.landingModeHint]
 * @returns {PendingLedgerAssessment}
 */
export function assessPendingLedger({
  mainObservationId = null,
  monitorTipObservationId = null,
  monitoringPathDiffs = [],
  commitsAheadOfMain = 0,
  openMonitorPr = null,
  landingModeHint = 'unknown',
}) {
  const diffs = monitoringPathDiffs.filter(Boolean);
  const pathClass = classifyMonitoringPathDiffs(diffs);
  const sameObservation =
    mainObservationId != null &&
    monitorTipObservationId != null &&
    mainObservationId === monitorTipObservationId;

  // Primary: same tip observationId + no monitoring-path content unique to monitor.
  // Phase 2-owned paths (evidence, diffs, processing index) count as unique pending —
  // analysis-only pending must survive cleanup when Phase 1 observationIds already match.
  if (sameObservation && diffs.length === 0) {
    return {
      hasUniquePending: false,
      fullyLanded: true,
      // Never reset solely because a PR is "merged"; require state proof (this branch).
      // Also do not force-reset remote while an open monitoring PR still exists.
      allowResetFromMain: !openMonitorPr,
      reason: 'observation_state_matches_main',
      mainObservationId,
      monitorTipObservationId,
      monitoringPathDiffs: diffs,
      phase2PathDiffs: [],
      phase2OnlyPending: false,
      landingModeHint,
      ancestryCommitsAhead: commitsAheadOfMain,
      notes: [
        'main and monitoring tip share the same observationId with no monitoring-path diffs.',
        'Phase 1 state and all Phase 2 artifacts match main — cleanup/reset allowed.',
        'Branch is fully landed regardless of ancestry (merge/squash/rebase safe).',
        commitsAheadOfMain > 0
          ? `Ancestry still shows ${commitsAheadOfMain} commit(s) ahead — ignored for pending uniqueness.`
          : 'Ancestry also shows no commits ahead of main.',
      ],
    };
  }

  if (sameObservation && diffs.length > 0) {
    const phase2Only = pathClass.hasPhase2OnlyPending;
    return {
      hasUniquePending: true,
      fullyLanded: false,
      allowResetFromMain: false,
      reason: phase2Only
        ? 'phase2_analysis_pending_survives_cleanup'
        : 'same_observation_but_monitoring_path_diffs',
      mainObservationId,
      monitorTipObservationId,
      monitoringPathDiffs: diffs,
      phase2PathDiffs: pathClass.phase2Paths,
      phase2OnlyPending: phase2Only,
      landingModeHint,
      ancestryCommitsAhead: commitsAheadOfMain,
      notes: [
        phase2Only
          ? 'Phase 1 observationIds match but Phase 2 evidence/reports still unique on monitor — refuse cleanup/reset.'
          : 'observationIds match but monitoring paths still differ from main — refuse reset.',
        'Cleanup/reset only when Phase 1 state AND all successfully committed Phase 2 artifacts are on main.',
        'Content/observationId based — not ancestry alone (squash/rebase safe).',
      ],
    };
  }

  if (
    monitorTipObservationId &&
    mainObservationId &&
    monitorTipObservationId !== mainObservationId
  ) {
    return {
      hasUniquePending: true,
      fullyLanded: false,
      allowResetFromMain: false,
      reason: 'monitor_tip_observation_differs',
      mainObservationId,
      monitorTipObservationId,
      monitoringPathDiffs: diffs,
      landingModeHint,
      ancestryCommitsAhead: commitsAheadOfMain,
      notes: [
        'Monitoring tip observationId differs from main — unique pending ledger content.',
      ],
    };
  }

  // Monitor exists but tip state missing / main missing — fail closed on uniqueness.
  if (monitorTipObservationId && !mainObservationId) {
    return {
      hasUniquePending: true,
      fullyLanded: false,
      allowResetFromMain: false,
      reason: 'main_observation_missing',
      mainObservationId,
      monitorTipObservationId,
      monitoringPathDiffs: diffs,
      landingModeHint,
      ancestryCommitsAhead: commitsAheadOfMain,
    };
  }

  if (!monitorTipObservationId && diffs.length > 0) {
    return {
      hasUniquePending: true,
      fullyLanded: false,
      allowResetFromMain: false,
      reason: 'monitoring_path_diffs_without_tip_state',
      mainObservationId,
      monitorTipObservationId,
      monitoringPathDiffs: diffs,
      landingModeHint,
      ancestryCommitsAhead: commitsAheadOfMain,
    };
  }

  // No monitor tip observation and no diffs → nothing unique pending.
  return {
    hasUniquePending: Boolean(openMonitorPr) && !sameObservation,
    fullyLanded: !openMonitorPr,
    allowResetFromMain: !openMonitorPr,
    reason: openMonitorPr ? 'open_pr_without_clear_tip_delta' : 'no_unique_pending',
    mainObservationId,
    monitorTipObservationId,
    monitoringPathDiffs: diffs,
    landingModeHint,
    ancestryCommitsAhead: commitsAheadOfMain,
  };
}

/**
 * Decide workspace preparation after an explicit SCM refresh.
 *
 * @param {object} input
 * @param {boolean} input.fetchOk
 * @param {string} [input.fetchError]
 * @param {boolean} [input.monitorBranchExists]
 * @param {PendingLedgerAssessment|null} [input.pendingAssessment] preferred (state-based)
 * @param {boolean} [input.monitorHasPendingCommits] legacy ancestry-only; ignored when assessment present
 * @param {string|null} [input.mainObservationId]
 * @param {string|null} [input.monitorTipObservationId]
 * @param {PendingObservation[]} [input.pendingObservations]
 * @param {OpenMonitorPr|null} [input.openMonitorPr]
 */
export function decideWorkspacePrep({
  fetchOk,
  fetchError = null,
  monitorBranchExists = false,
  pendingAssessment = null,
  monitorHasPendingCommits = false,
  mainObservationId = null,
  monitorTipObservationId = null,
  pendingObservations = [],
  openMonitorPr = null,
}) {
  if (!fetchOk) {
    return {
      schemaVersion: 2,
      action: 'abort',
      reason: 'scm_refresh_failed',
      runWatcher: false,
      mutateRepo: false,
      error: fetchError || 'Failed to refresh origin/main and/or monitoring branch refs',
      notes: [
        'Do not run the watcher against knowingly stale SCM state.',
        'Retry after fetch succeeds. No observation commit or PR mutation.',
      ],
    };
  }

  const assessment =
    pendingAssessment ||
    assessPendingLedger({
      mainObservationId,
      monitorTipObservationId,
      monitoringPathDiffs: [],
      // Fallback only when caller did not assess paths; ancestry alone is insufficient
      // to claim unique pending once observationIds match — see assessPendingLedger.
      commitsAheadOfMain: monitorHasPendingCommits ? 1 : 0,
      openMonitorPr,
    });

  const useMonitor =
    monitorBranchExists &&
    (assessment.hasUniquePending ||
      pendingObservations.length > 0 ||
      (Boolean(openMonitorPr) &&
        monitorTipObservationId &&
        monitorTipObservationId !== mainObservationId));

  if (useMonitor) {
    return {
      schemaVersion: 2,
      action: 'use_monitor_branch',
      reason: 'pending_ledger_open',
      runWatcher: true,
      checkout: MONITOR_BRANCH,
      syncMainFirst: true,
      baselineSource: 'monitor_tip',
      expectedBaselineObservationId: monitorTipObservationId,
      mainObservationId,
      pendingObservations,
      pendingAssessment: assessment,
      openMonitorPr: summarizePr(openMonitorPr),
      monitorBranch: MONITOR_BRANCH,
      defaultBranch: DEFAULT_BRANCH,
      resetMonitorFromMain: false,
      allowForceWithLeaseReset: false,
      notes: [
        'Unique pending observation content exists on the monitoring branch (state/content authority).',
        'Merge newest origin/main into the monitoring branch before watching.',
        'Watcher comparison baseline = latest successful observation on the monitoring tip.',
      ],
    };
  }

  const allowReset =
    monitorBranchExists &&
    assessment.fullyLanded &&
    assessment.allowResetFromMain &&
    !openMonitorPr;

  return {
    schemaVersion: 2,
    action: 'use_main',
    reason: monitorBranchExists
      ? assessment.fullyLanded
        ? 'monitor_fully_landed_by_observation_state'
        : 'monitor_present_without_unique_pending'
      : 'no_monitor_branch',
    runWatcher: true,
    checkout: DEFAULT_BRANCH,
    syncMainFirst: false,
    resetMonitorFromMain: allowReset,
    // Non-FF reset of monitoring tip is allowed only after state proof of no unique pending.
    allowForceWithLeaseReset: allowReset,
    baselineSource: 'main',
    expectedBaselineObservationId: mainObservationId,
    mainObservationId,
    pendingObservations: [],
    pendingAssessment: assessment,
    openMonitorPr: summarizePr(openMonitorPr),
    monitorBranch: MONITOR_BRANCH,
    defaultBranch: DEFAULT_BRANCH,
    notes: [
      'No unique pending observations vs main (observationId + monitoring-path authority).',
      'Checkout main as authoritative baseline.',
      allowReset
        ? 'Safe to recreate/reset monitoring branch from current main (force-with-lease only if non-FF), because unique pending was disproven by state — not merely by PR merged status or ancestry.'
        : 'Do not discard/reset monitoring branch without state proof of no unique pending.',
    ],
  };
}

/**
 * Decide whether merge-of-main into monitoring is safe to continue.
 *
 * @param {object} input
 * @param {boolean} input.syncAttempted
 * @param {boolean} [input.conflict]
 * @param {string[]} [input.conflictPaths]
 * @param {boolean} [input.syncError]
 * @param {string} [input.error]
 */
export function decideAfterMainSync({
  syncAttempted,
  conflict = false,
  conflictPaths = [],
  syncError = false,
  error = null,
}) {
  if (!syncAttempted) {
    return {
      action: 'continue',
      reason: 'sync_not_needed',
      runWatcher: true,
    };
  }
  if (syncError) {
    return {
      action: 'abort',
      reason: 'sync_failed',
      runWatcher: false,
      mutateRepo: false,
      error: error || 'Failed to merge origin/main into monitoring branch',
      notes: ['Stop. Do not run watcher. Do not guess through sync failures.'],
    };
  }
  if (conflict && hasMonitoringConflict(conflictPaths)) {
    return {
      action: 'abort',
      reason: 'sync_conflict_monitoring_paths',
      runWatcher: false,
      mutateRepo: false,
      conflictPaths,
      error:
        error ||
        'Merge conflict involving state/ or artifacts/frontend/ — refuse to observe on ambiguous state',
      notes: [
        'Stop. Report conflict paths. No watcher. No force-push/rebase unless a human decides.',
      ],
    };
  }
  if (conflict) {
    return {
      action: 'abort',
      reason: 'sync_conflict',
      runWatcher: false,
      mutateRepo: false,
      conflictPaths,
      error: error || 'Merge conflict while syncing origin/main into monitoring branch',
      notes: ['Stop. Do not run watcher on conflicted tree.'],
    };
  }
  return {
    action: 'continue',
    reason: 'sync_ok',
    runWatcher: true,
    notes: ['origin/main merged into monitoring branch without monitoring-path conflicts.'],
  };
}

/**
 * Reconcile a rejected (non-force) push of an observation commit when another
 * Automation run may have raced ahead. Never force-pushes observation commits.
 *
 * @param {object} input
 * @param {boolean} input.pushRejected
 * @param {string|null} input.localObservationId observation this run tried to publish
 * @param {string|null} [input.localPreviousObservationId]
 * @param {string|null} input.remoteTipObservationIdAfterFetch
 * @param {string[]} [input.remoteLedgerObservationIds] observationIds known on remote tip ledger
 * @param {boolean} [input.refetchOk]
 * @param {string} [input.refetchError]
 */
export function decidePushRace({
  pushRejected,
  localObservationId = null,
  localPreviousObservationId = null,
  remoteTipObservationIdAfterFetch = null,
  remoteLedgerObservationIds = [],
  refetchOk = true,
  refetchError = null,
}) {
  if (!pushRejected) {
    return {
      action: 'success',
      reason: 'push_ok',
      forcePush: false,
      discardLocalMutation: false,
      createPullRequest: false,
      preserveLineage: true,
    };
  }

  if (!refetchOk) {
    return {
      action: 'abort',
      reason: 'push_race_refetch_failed',
      forcePush: false,
      discardLocalMutation: true,
      error: refetchError || 'Push rejected and refetch of monitoring branch failed',
      notes: [
        'Fail closed. Do not force-push. Do not invent reconciliation without a fresh remote tip.',
      ],
    };
  }

  const remoteIds = new Set(
    (remoteLedgerObservationIds || []).filter(Boolean).concat(
      remoteTipObservationIdAfterFetch ? [remoteTipObservationIdAfterFetch] : [],
    ),
  );

  // Remote already has this run's observation (same discovery race).
  if (localObservationId && remoteIds.has(localObservationId)) {
    return {
      action: 'noop',
      reason: 'remote_already_has_observation',
      forcePush: false,
      discardLocalMutation: true,
      createPullRequest: false,
      updatePullRequest: true,
      remoteTipObservationId: remoteTipObservationIdAfterFetch,
      preserveLineage: true,
      notes: [
        'Another run published the same observationId first (or remote already matches).',
        'Treat as success/no-op. Do not force-push. Do not open a duplicate PR.',
      ],
    };
  }

  // Remote advanced to a different / newer observation.
  if (
    remoteTipObservationIdAfterFetch &&
    localObservationId &&
    remoteTipObservationIdAfterFetch !== localObservationId
  ) {
    return {
      action: 'reevaluate_from_remote',
      reason: 'remote_advanced_different_observation',
      forcePush: false,
      discardLocalMutation: true,
      createPullRequest: false,
      newBaselineObservationId: remoteTipObservationIdAfterFetch,
      localObservationId,
      localPreviousObservationId,
      preserveLineage: true,
      notes: [
        'Remote monitoring tip advanced to a different observationId.',
        'Discard this run\'s stale local mutation. Reevaluate from the fetched remote tip.',
        'Do not overwrite the other run\'s observation. Do not rewrite B→C as B→D while dropping C.',
        'Never force-push normal observation commits.',
      ],
    };
  }

  // Cannot reconcile deterministically.
  return {
    action: 'abort',
    reason: 'push_race_unreconciled',
    forcePush: false,
    discardLocalMutation: true,
    createPullRequest: false,
    error: 'Push rejected and remote tip could not be reconciled with local observationId',
    notes: [
      'Fail closed. Do not force-push. Do not create a competing history or duplicate PR.',
    ],
  };
}

/**
 * Decide action after the watcher runs against the prepared baseline.
 *
 * @param {object} input
 * @param {number} input.exitCode
 * @param {CheckPayload|null} input.checkResult
 * @param {string|null} [input.baselineObservationId] tip observation before watcher
 * @param {PendingObservation[]} [input.pendingObservations] already on ledger (pre-append)
 * @param {OpenMonitorPr|null} [input.openMonitorPr]
 * @param {object|null} [input.testStatus]
 * @param {boolean} [input.workspaceFromMonitor]
 */
export function decideMonitorAction({
  exitCode,
  checkResult,
  baselineObservationId = null,
  pendingObservations = [],
  openMonitorPr = null,
  testStatus = null,
  workspaceFromMonitor = false,
}) {
  const monitorPr = openMonitorPr ? normalizeOpenMonitorPrs([openMonitorPr])[0] : null;

  if (exitCode === EXIT.UNCHANGED) {
    return {
      schemaVersion: 2,
      action: 'noop',
      reason: 'unchanged',
      exitCode,
      monitorBranch: MONITOR_BRANCH,
      baselineObservationId,
      pendingObservations,
      openMonitorPr: summarizePr(monitorPr),
      createPullRequest: false,
      updatePullRequest: false,
      appendObservationCommit: false,
      mutateDefaultBranch: false,
      forcePush: false,
      notes: [
        'Live frontend matches the prepared baseline (main or pending ledger tip).',
        'No observation commit, no PR mutation, quiet success.',
      ],
    };
  }

  if (exitCode === EXIT.FAILURE) {
    const error =
      checkResult?.error ||
      (checkResult?.ok === false ? 'watcher reported failure' : 'watcher operational failure');
    return {
      schemaVersion: 2,
      action: 'report_failure',
      reason: 'operational_failure',
      exitCode,
      error,
      checkResult: checkResult || null,
      monitorBranch: MONITOR_BRANCH,
      baselineObservationId,
      pendingObservations,
      openMonitorPr: summarizePr(monitorPr),
      createPullRequest: false,
      updatePullRequest: false,
      appendObservationCommit: false,
      mutateDefaultBranch: false,
      mutateLastKnownGood: false,
      forcePush: false,
      notes: [
        'Watcher exit 1: do not append an observation commit; do not mutate the monitoring PR.',
        'Pending ledger and main LKG remain as they were before this run.',
        'Report enough context to diagnose (network/parse/validation).',
      ],
    };
  }

  if (exitCode !== EXIT.CHANGED) {
    return {
      schemaVersion: 2,
      action: 'report_failure',
      reason: 'unexpected_exit_code',
      exitCode,
      error: `Unexpected watcher exit code: ${exitCode}`,
      createPullRequest: false,
      appendObservationCommit: false,
      mutateDefaultBranch: false,
      forcePush: false,
      notes: ['Treat as operational failure; do not open or update an observation PR.'],
    };
  }

  const observationId = checkResult?.observationId || null;
  const buildId = checkResult?.buildId || null;
  const previousObservationId =
    checkResult?.previousObservationId === undefined
      ? null
      : checkResult.previousObservationId;

  if (!observationId || !buildId) {
    return {
      schemaVersion: 2,
      action: 'report_failure',
      reason: 'changed_but_incomplete_payload',
      exitCode,
      error: 'Watcher exit 2 but JSON lacked observationId/buildId',
      checkResult,
      createPullRequest: false,
      appendObservationCommit: false,
      mutateDefaultBranch: false,
      forcePush: false,
      notes: ['Do not invent observation metadata; fail closed.'],
    };
  }

  // Lineage must chain from the prepared baseline (pending tip or main LKG).
  if (
    baselineObservationId != null &&
    previousObservationId != null &&
    previousObservationId !== baselineObservationId
  ) {
    return {
      schemaVersion: 2,
      action: 'report_failure',
      reason: 'previous_observation_mismatch',
      exitCode,
      error: `Watcher previousObservationId ${previousObservationId} !== baseline ${baselineObservationId}`,
      checkResult,
      baselineObservationId,
      createPullRequest: false,
      appendObservationCommit: false,
      mutateDefaultBranch: false,
      forcePush: false,
      notes: [
        'Refuse to commit an observation whose lineage does not match the prepared ledger tip.',
      ],
    };
  }

  // Same tip already recorded on the pending ledger.
  if (
    pendingObservations.length &&
    pendingObservations[pendingObservations.length - 1]?.observationId === observationId
  ) {
    return {
      schemaVersion: 2,
      action: 'noop',
      reason: 'duplicate_pending_observation',
      exitCode,
      observationId,
      buildId,
      baselineObservationId,
      pendingObservations,
      openMonitorPr: summarizePr(monitorPr),
      createPullRequest: false,
      updatePullRequest: false,
      appendObservationCommit: false,
      discardWorkingTreeChanges: true,
      mutateDefaultBranch: false,
      forcePush: false,
      notes: [
        'Latest pending ledger observation already matches this observationId.',
        'Do not append a duplicate commit. Do not open a second PR.',
      ],
      checkSummary: summarizeCheck(checkResult, testStatus),
    };
  }

  const newPending = [
    ...pendingObservations,
    {
      observationId,
      previousObservationId,
      buildId,
      observedAt: checkResult?.observedAt ?? null,
      artifactDir: checkResult?.artifactDir ?? null,
      artifacts: checkResult?.artifacts ?? null,
      layout: checkResult?.layout ?? null,
    },
  ];

  const prTitle = `${PR_TITLE_PREFIX} ${buildId}`;
  const finalAction =
    monitorPr || pendingObservations.length > 0 || workspaceFromMonitor
      ? 'update_monitor_pr'
      : 'open_monitor_pr';

  return {
    schemaVersion: 2,
    action: finalAction,
    reason:
      pendingObservations.length > 0 ? 'append_pending_observation' : 'new_pending_observation',
    exitCode,
    observationId,
    buildId,
    previousObservationId,
    baselineObservationId,
    pendingObservations: newPending,
    priorPendingObservations: pendingObservations,
    openMonitorPr: summarizePr(monitorPr),
    createPullRequest: finalAction === 'open_monitor_pr',
    updatePullRequest: finalAction === 'update_monitor_pr',
    appendObservationCommit: true,
    forcePush: false,
    resetFromMain: false,
    mutateDefaultBranch: false,
    preserveWatcherArtifactsExactly: true,
    prTitle,
    commitMessage: `${OBSERVE_COMMIT_PREFIX} ${buildId}`,
    monitorBranch: MONITOR_BRANCH,
    defaultBranch: DEFAULT_BRANCH,
    pushRacePolicy: 'fetch_and_reconcile_never_force_observation_push',
    notes: [
      pendingObservations.length > 0
        ? `Append observation ${observationId.slice(0, 12)}… after pending tip (previousObservationId must be the prior pending observation).`
        : 'Start pending ledger from main: create monitoring branch, commit this observation, open one PR.',
      'Push normally (fast-forward only for observation commits). Never force-push observation commits.',
      'If push is rejected because remote advanced: fetch, reconcile via decidePushRace, never overwrite another run.',
      'Update the same monitoring PR; at most one open monitoring PR.',
      'PR body must summarize all pending observations, not only the newest.',
      'Do not auto-merge. Do not claim API changed. Phase 1 only.',
    ],
    checkSummary: summarizeCheck(checkResult, testStatus),
  };
}

/** @param {OpenMonitorPr|null} pr */
function summarizePr(pr) {
  if (!pr) return null;
  return {
    number: pr.number,
    url: pr.url,
    title: pr.title,
    headRefName: pr.headRefName ?? null,
    observationId: pr.observationId ?? null,
    buildId: pr.buildId ?? null,
    headSha: pr.headSha ?? null,
  };
}

/** @param {CheckPayload} checkResult @param {object|null} testStatus */
function summarizeCheck(checkResult, testStatus) {
  return {
    ok: checkResult?.ok !== false,
    changed: Boolean(checkResult?.changed),
    observationId: checkResult?.observationId ?? null,
    previousObservationId: checkResult?.previousObservationId ?? null,
    buildId: checkResult?.buildId ?? null,
    observedAt: checkResult?.observedAt ?? null,
    artifactDir: checkResult?.artifactDir ?? null,
    layout: checkResult?.layout ?? null,
    statePath: checkResult?.statePath ?? null,
    artifacts: checkResult?.artifacts ?? null,
    comparison: checkResult?.comparison ?? null,
    noteworthy: checkResult?.noteworthy ?? null,
    testStatus: testStatus,
  };
}
