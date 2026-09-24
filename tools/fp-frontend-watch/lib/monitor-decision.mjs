/**
 * Pure decision logic for Phase 1.2 cumulative pending observation ledger.
 *
 * main = authoritative merged history
 * cursor/frontend-observation = pending durable ledger (append-only while PR open)
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
 * Decide workspace preparation after an explicit SCM refresh.
 *
 * @param {object} input
 * @param {boolean} input.fetchOk
 * @param {string} [input.fetchError]
 * @param {boolean} [input.monitorBranchExists]
 * @param {boolean} [input.monitorHasPendingCommits] commits on monitor not in main
 * @param {string|null} [input.mainObservationId]
 * @param {string|null} [input.monitorTipObservationId]
 * @param {PendingObservation[]} [input.pendingObservations]
 * @param {OpenMonitorPr|null} [input.openMonitorPr]
 */
export function decideWorkspacePrep({
  fetchOk,
  fetchError = null,
  monitorBranchExists = false,
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

  const hasPending =
    monitorHasPendingCommits ||
    pendingObservations.length > 0 ||
    Boolean(openMonitorPr);

  if (monitorBranchExists && hasPending) {
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
      openMonitorPr: summarizePr(openMonitorPr),
      monitorBranch: MONITOR_BRANCH,
      defaultBranch: DEFAULT_BRANCH,
      notes: [
        'Pending observation ledger exists on the monitoring branch.',
        'Merge newest origin/main into the monitoring branch before watching.',
        'Watcher comparison baseline = latest successful observation on the monitoring tip.',
      ],
    };
  }

  // No pending ledger — work from main. Reset orphan monitoring tip only when safe.
  return {
    schemaVersion: 2,
    action: 'use_main',
    reason: monitorBranchExists
      ? 'monitor_fully_merged_or_empty'
      : 'no_monitor_branch',
    runWatcher: true,
    checkout: DEFAULT_BRANCH,
    syncMainFirst: false,
    resetMonitorFromMain:
      monitorBranchExists && !monitorHasPendingCommits && !openMonitorPr,
    baselineSource: 'main',
    expectedBaselineObservationId: mainObservationId,
    mainObservationId,
    pendingObservations: [],
    openMonitorPr: summarizePr(openMonitorPr),
    monitorBranch: MONITOR_BRANCH,
    defaultBranch: DEFAULT_BRANCH,
    notes: [
      'No pending observation commits absent from main.',
      'Checkout main as authoritative baseline.',
      monitorBranchExists && !openMonitorPr
        ? 'Monitoring branch may be reset from main only when it has no pending commits.'
        : 'Create monitoring branch from main only when a new observation must be committed.',
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
  // If we already have pending or an open PR, always update; first observation opens.
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
    notes: [
      pendingObservations.length > 0
        ? `Append observation ${observationId.slice(0, 12)}… after pending tip (previousObservationId must be the prior pending observation).`
        : 'Start pending ledger from main: create monitoring branch, commit this observation, open one PR.',
      'Push normally (fast-forward). Do not force-reset the monitoring branch from main while pending commits exist.',
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
