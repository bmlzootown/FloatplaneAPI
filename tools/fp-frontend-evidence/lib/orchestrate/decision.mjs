/**
 * Pure Phase 2.3 decision helpers: commit sequencing, push races, PR actions.
 * No git/network side effects.
 */

import {
  COMMIT_STRATEGY,
  COMPARE_COMMIT_PREFIX,
  EXTRACT_COMMIT_PREFIX,
  EXTRACT_COMPARE_COMMIT_PREFIX,
  GROWTH_ESTIMATE,
} from './constants.mjs';
import { MONITOR_BRANCH, DEFAULT_BRANCH } from '../../../fp-frontend-watch/lib/monitor-constants.mjs';

/**
 * Classify Phase 2 commit unit for one processed observation result.
 * @param {{ didExtract: boolean, didCompare: boolean, buildId: string }} result
 * @returns {{ kind: 'none'|'extract'|'compare'|'extract_compare', message: string|null }}
 */
export function classifyPhase2Commit(result) {
  if (result.didExtract && result.didCompare) {
    return {
      kind: 'extract_compare',
      message: `${EXTRACT_COMPARE_COMMIT_PREFIX} ${result.buildId}`,
    };
  }
  if (result.didExtract) {
    return {
      kind: 'extract',
      message: `${EXTRACT_COMMIT_PREFIX} ${result.buildId}`,
    };
  }
  if (result.didCompare) {
    return {
      kind: 'compare',
      message: `${COMPARE_COMMIT_PREFIX} ${result.buildId}`,
    };
  }
  return { kind: 'none', message: null };
}

/**
 * Build commit plan: Phase 1 Observe (if any) ALWAYS before Phase 2 units.
 * Never one transactional unit that rolls back Observe on Phase 2 fail.
 *
 * @param {{
 *   phase1Append: boolean,
 *   phase1CommitMessage: string|null,
 *   phase1Paths: string[],
 *   phase2Results: Array<{
 *     didExtract: boolean,
 *     didCompare: boolean,
 *     extractFailed?: boolean,
 *     compareFailed?: boolean,
 *     buildId: string,
 *     observationId: string,
 *     touchedRelPaths: string[],
 *   }>,
 *   indexPath?: string|null,
 * }} input
 */
export function buildCommitSequence(input) {
  /** @type {Array<{
   *   step: string,
   *   phase: 'phase1'|'phase2',
   *   message: string,
   *   paths: string[],
   *   observationId?: string,
   * }>} */
  const commits = [];

  if (input.phase1Append && input.phase1CommitMessage) {
    commits.push({
      step: 'observe',
      phase: 'phase1',
      message: input.phase1CommitMessage,
      paths: input.phase1Paths.filter(Boolean),
    });
  }

  for (const r of input.phase2Results || []) {
    const cls = classifyPhase2Commit(r);
    if (cls.kind === 'none' || !cls.message) continue;
    const paths = [...(r.touchedRelPaths || [])];
    if (input.indexPath) paths.push(input.indexPath);
    commits.push({
      step: cls.kind,
      phase: 'phase2',
      message: cls.message,
      paths: [...new Set(paths)],
      observationId: r.observationId,
    });
  }

  return {
    commitStrategy: COMMIT_STRATEGY,
    growthEstimate: GROWTH_ESTIMATE,
    commits,
    notes: [
      COMMIT_STRATEGY.rationale,
      'If Phase 2 fails after Observe is committed, leave Observe in place; retry Phase 2 on next run.',
      'Never combine Phase 1 Observe with Phase 2 extract/compare in one commit.',
    ],
  };
}

/**
 * Fast-forward-only Phase 2 push race policy (§10).
 * @param {{
 *   pushRejected: boolean,
 *   remoteAlreadyHasEvidence: boolean,
 *   remoteTipDifferent: boolean,
 *   localPhase2Mutations?: boolean,
 * }} input
 */
export function decidePhase2PushRace(input) {
  if (!input.pushRejected) {
    return {
      action: 'proceed',
      reason: 'push_accepted_or_not_attempted',
      forcePush: false,
      discardLocalPhase2Mutations: false,
      notes: ['FF-only; never force-push Phase 2 evidence commits.'],
    };
  }
  if (input.remoteAlreadyHasEvidence) {
    return {
      action: 'noop',
      reason: 'remote_already_has_evidence',
      forcePush: false,
      discardLocalPhase2Mutations: true,
      refetch: true,
      notes: [
        'Remote already has Phase 2 evidence for this observation — refetch and noop.',
        'Discard stale local Phase 2 mutations. Never force-push.',
      ],
    };
  }
  if (input.remoteTipDifferent) {
    return {
      action: 'discard_and_reevaluate',
      reason: 'remote_tip_advanced',
      forcePush: false,
      discardLocalPhase2Mutations: true,
      refetch: true,
      notes: [
        'Remote tip is a different state — discard stale local Phase 2 mutations and reevaluate.',
        'Never force-push.',
      ],
    };
  }
  return {
    action: 'abort',
    reason: 'push_rejected_ambiguous',
    forcePush: false,
    discardLocalPhase2Mutations: false,
    notes: ['Push rejected without clear remote-has-evidence signal; abort and report.'],
  };
}

/**
 * When Phase 1 is noop but Phase 2 backlog produced commits, still update PR.
 * When observations on main lack Phase 2 → use monitoring branch / analysis PR;
 * never rewrite main.
 *
 * @param {{
 *   phase1Action: string,
 *   phase2CommitCount: number,
 *   openMonitorPr: object|null,
 *   hasUniquePendingPhase1: boolean,
 *   phase2BacklogOnMainOnly: boolean,
 * }} input
 */
export function decidePhase2PrAction(input) {
  const hasPhase2Work = input.phase2CommitCount > 0;

  if (!hasPhase2Work && input.phase1Action === 'noop') {
    return {
      action: 'noop',
      reason: 'no_phase1_or_phase2_work',
      updatePullRequest: false,
      createPullRequest: false,
      useMonitorBranch: false,
      neverRewriteMain: true,
      notes: ['Quiet success — live unchanged and Phase 2 backlog empty.'],
    };
  }

  if (
    input.phase2BacklogOnMainOnly &&
    hasPhase2Work &&
    !input.hasUniquePendingPhase1
  ) {
    // Merged-to-main missing Phase 2 → analysis on monitoring branch, never rewrite main.
    if (input.openMonitorPr) {
      return {
        action: 'update_monitor_pr',
        reason: 'phase2_backlog_on_main_update_analysis_pr',
        updatePullRequest: true,
        createPullRequest: false,
        useMonitorBranch: true,
        neverRewriteMain: true,
        notes: [
          'Phase 2 missing for observation(s) already on main.',
          'Commit Phase 2 artifacts on cursor/frontend-observation and update the analysis PR.',
          'Never rewrite main history to backfill Phase 2.',
        ],
      };
    }
    return {
      action: 'open_monitor_pr',
      reason: 'phase2_backlog_on_main_open_analysis_pr',
      updatePullRequest: false,
      createPullRequest: true,
      useMonitorBranch: true,
      neverRewriteMain: true,
      notes: [
        'Phase 2 missing for observation(s) already on main.',
        'Open/update analysis on cursor/frontend-observation; never rewrite main.',
      ],
    };
  }

  if (input.phase1Action === 'open_monitor_pr' || input.phase1Action === 'update_monitor_pr') {
    return {
      action: input.phase1Action,
      reason: 'phase1_drives_pr_phase2_enriches_body',
      updatePullRequest: input.phase1Action === 'update_monitor_pr' || hasPhase2Work,
      createPullRequest: input.phase1Action === 'open_monitor_pr',
      useMonitorBranch: true,
      neverRewriteMain: true,
      notes: [
        'Commit Observe first, then Phase 2 commits, then open/update the same monitoring PR.',
        'PR body includes per-observation Phase 2 analysis summaries.',
      ],
    };
  }

  if (hasPhase2Work) {
    if (input.openMonitorPr) {
      return {
        action: 'update_monitor_pr',
        reason: 'phase2_backlog_while_live_unchanged',
        updatePullRequest: true,
        createPullRequest: false,
        useMonitorBranch: true,
        neverRewriteMain: true,
        notes: [
          'Live frontend unchanged but Phase 2 backlog had work — update monitoring PR.',
        ],
      };
    }
    return {
      action: 'open_monitor_pr',
      reason: 'phase2_backlog_needs_pr',
      updatePullRequest: false,
      createPullRequest: true,
      useMonitorBranch: true,
      neverRewriteMain: true,
      notes: [
        'Phase 2 backlog produced artifacts with no open monitoring PR — open analysis PR on monitor branch.',
      ],
    };
  }

  return {
    action: input.phase1Action || 'noop',
    reason: 'phase1_only',
    updatePullRequest: false,
    createPullRequest: false,
    useMonitorBranch: false,
    neverRewriteMain: true,
    notes: [],
  };
}

/**
 * @param {object} [extra]
 */
export function phase2DecisionScaffold(extra = {}) {
  return {
    schemaVersion: 3,
    orchestrator: 'phase2.3',
    monitorBranch: MONITOR_BRANCH,
    defaultBranch: DEFAULT_BRANCH,
    forcePush: false,
    mutateDefaultBranch: false,
    neverRewriteMain: true,
    runFullUnitSuite: false,
    commitStrategy: COMMIT_STRATEGY,
    growthEstimate: GROWTH_ESTIMATE,
    ...extra,
  };
}
