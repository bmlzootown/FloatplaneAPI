/**
 * Pure decision logic for Phase 1.2 frontend monitoring orchestration.
 *
 * Inputs are already-interpreted watcher results + any open monitoring PRs.
 * No git / network side effects here.
 */

import { EXIT } from './constants.mjs';
import { MONITOR_BRANCH, PR_TITLE_PREFIX } from './monitor-constants.mjs';

/**
 * @typedef {object} OpenMonitorPr
 * @property {number|string} number
 * @property {string} url
 * @property {string} title
 * @property {string} [body]
 * @property {string} [headRefName]
 * @property {string|null} [observationId] parsed from body/title when available
 * @property {string|null} [buildId]
 * @property {string|null} [headSha]
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
 * Extract observationId from a PR body (marker line or JSON-ish fallback).
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
 * Normalize open-PR records for decisioning.
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
 * Prefer the fixed monitoring-branch PR; otherwise any open observation-titled PR.
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
 * Decide orchestration action from watcher exit + payload + open PRs.
 *
 * @param {object} input
 * @param {number} input.exitCode watcher exit code (0/1/2)
 * @param {CheckPayload|null} input.checkResult parsed JSON from watcher stdout
 * @param {OpenMonitorPr[]} [input.openMonitorPrs]
 * @param {object} [input.testStatus] optional unit-test summary from the run
 * @returns {object} machine-readable decision
 */
export function decideMonitorAction({
  exitCode,
  checkResult,
  openMonitorPrs = [],
  testStatus = null,
}) {
  const monitorPr = selectMonitorPr(openMonitorPrs);

  if (exitCode === EXIT.UNCHANGED) {
    return {
      schemaVersion: 1,
      action: 'noop',
      reason: 'unchanged',
      exitCode,
      monitorBranch: MONITOR_BRANCH,
      openMonitorPr: summarizePr(monitorPr),
      createPullRequest: false,
      mutateDefaultBranch: false,
      notes: [
        'Live frontend matches last-known-good on the checkout base (default branch).',
        'No repo changes, no PR, quiet success.',
      ],
    };
  }

  if (exitCode === EXIT.FAILURE) {
    const error =
      checkResult?.error ||
      (checkResult?.ok === false ? 'watcher reported failure' : 'watcher operational failure');
    return {
      schemaVersion: 1,
      action: 'report_failure',
      reason: 'operational_failure',
      exitCode,
      error,
      checkResult: checkResult || null,
      monitorBranch: MONITOR_BRANCH,
      openMonitorPr: summarizePr(monitorPr),
      createPullRequest: false,
      mutateDefaultBranch: false,
      mutateLastKnownGood: false,
      notes: [
        'Watcher exit 1: do not mutate state/LKG, do not open a deployment observation PR.',
        'Report enough context to diagnose (error message, network/parse hints).',
        'Unmerged prior observation PRs are left untouched.',
      ],
    };
  }

  if (exitCode !== EXIT.CHANGED) {
    return {
      schemaVersion: 1,
      action: 'report_failure',
      reason: 'unexpected_exit_code',
      exitCode,
      error: `Unexpected watcher exit code: ${exitCode}`,
      createPullRequest: false,
      mutateDefaultBranch: false,
      notes: ['Treat as operational failure; do not open an observation PR.'],
    };
  }

  // exit 2 — change detected
  const observationId = checkResult?.observationId || null;
  const buildId = checkResult?.buildId || null;
  if (!observationId || !buildId) {
    return {
      schemaVersion: 1,
      action: 'report_failure',
      reason: 'changed_but_incomplete_payload',
      exitCode,
      error: 'Watcher exit 2 but JSON lacked observationId/buildId',
      checkResult,
      createPullRequest: false,
      mutateDefaultBranch: false,
      notes: ['Do not invent observation metadata; fail closed.'],
    };
  }

  const prTitle = `${PR_TITLE_PREFIX} ${buildId}`;

  if (monitorPr && monitorPr.observationId && monitorPr.observationId === observationId) {
    return {
      schemaVersion: 1,
      action: 'noop',
      reason: 'duplicate_open_pr_same_observation',
      exitCode,
      observationId,
      buildId,
      monitorBranch: MONITOR_BRANCH,
      openMonitorPr: summarizePr(monitorPr),
      createPullRequest: false,
      mutateDefaultBranch: false,
      discardWorkingTreeChanges: true,
      notes: [
        'Same observationId already has an open monitoring PR.',
        'Do not open a duplicate PR. Discard local watcher writes if the checkout should stay clean.',
        'Unmerged observation is NOT treated as committed to default.',
      ],
      checkSummary: summarizeCheck(checkResult, testStatus),
    };
  }

  if (monitorPr && monitorPr.observationId && monitorPr.observationId !== observationId) {
    return {
      schemaVersion: 1,
      action: 'update_monitor_pr',
      reason: 'supersede_unmerged_observation',
      exitCode,
      observationId,
      buildId,
      previousOpenObservationId: monitorPr.observationId,
      previousOpenBuildId: monitorPr.buildId ?? null,
      monitorBranch: MONITOR_BRANCH,
      openMonitorPr: summarizePr(monitorPr),
      createPullRequest: false,
      updatePullRequest: true,
      prTitle,
      mutateDefaultBranch: false,
      preserveWatcherArtifactsExactly: true,
      accumulatePriorUnmergedArtifacts: true,
      notes: [
        'A newer deployment was observed while a prior observation PR is still open.',
        'Reuse the fixed monitoring branch/PR tip; do not open a second observation PR.',
        'Reset the monitoring branch from current default, commit exactly the watcher-produced state/artifacts for the new observation.',
        'Also carry forward prior unmerged observation artifact directories from the previous monitoring tip when still present (recovery aid only).',
        'Watcher state JSON is preserved exactly as produced from default-vs-live (previousObservationId points at default LKG, not the unmerged prior observation).',
        'Do not treat the prior unmerged observation as committed to default.',
        'Do not auto-merge. Do not claim API changed. Phase 1 only.',
      ],
      checkSummary: summarizeCheck(checkResult, testStatus),
    };
  }

  // No open monitor PR (or open PR without parseable observationId) → open/create
  const action = monitorPr ? 'update_monitor_pr' : 'open_monitor_pr';
  return {
    schemaVersion: 1,
    action,
    reason: monitorPr ? 'reuse_monitor_branch_unparsed_prior' : 'new_observation',
    exitCode,
    observationId,
    buildId,
    monitorBranch: MONITOR_BRANCH,
    openMonitorPr: summarizePr(monitorPr),
    createPullRequest: action === 'open_monitor_pr',
    updatePullRequest: action === 'update_monitor_pr',
    prTitle,
    mutateDefaultBranch: false,
    preserveWatcherArtifactsExactly: true,
    accumulatePriorUnmergedArtifacts: Boolean(monitorPr),
    notes: [
      monitorPr
        ? 'Monitoring branch PR exists but observationId could not be parsed; update that PR rather than opening another.'
        : 'No open monitoring PR for this observation; open one on the fixed monitoring branch.',
      'Commit only watcher-produced state + artifact paths. Do not edit OpenAPI/AsyncAPI/Hydravion.',
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
