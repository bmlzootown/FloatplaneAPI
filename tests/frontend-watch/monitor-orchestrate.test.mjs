import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { EXIT } from '../../tools/fp-frontend-watch/lib/constants.mjs';
import {
  MONITOR_BRANCH,
  PR_TITLE_PREFIX,
} from '../../tools/fp-frontend-watch/lib/monitor-constants.mjs';
import {
  assessPendingLedger,
  decideAfterMainSync,
  decideMonitorAction,
  decidePushRace,
  decideWorkspacePrep,
  hasMonitoringConflict,
  parseObservationIdFromPrBody,
  parseBuildIdFromPrTitle,
  selectMonitorPr,
} from '../../tools/fp-frontend-watch/lib/monitor-decision.mjs';
import { formatObservationPrBody } from '../../tools/fp-frontend-watch/lib/monitor-pr-body.mjs';

const OBS_A = 'a'.repeat(64);
const OBS_B = 'b'.repeat(64);
const OBS_C = 'c'.repeat(64);
const OBS_D = 'd'.repeat(64);

function obs(id, buildId, previousObservationId, extras = {}) {
  return {
    observationId: id,
    previousObservationId,
    buildId,
    observedAt: '2026-09-24T12:00:00.000Z',
    artifactDir: `artifacts/frontend/${buildId}/${id}`,
    artifacts: [
      {
        path: 'js/index-x.js',
        sha256: 'e'.repeat(64),
        bytes: 12,
        url: `https://frontend.floatplane.com/user/${buildId}/js/index-x.js`,
      },
    ],
    layout: 'vite-user',
    ...extras,
  };
}

function changePayload(observationId, buildId, previousObservationId) {
  return {
    ok: true,
    changed: true,
    ...obs(observationId, buildId, previousObservationId),
    statePath: 'state/last-known-frontend.json',
    comparison: { status: 'changed', summary: 'new observation' },
  };
}

function openPrFor(observationId, buildId) {
  return {
    number: 42,
    url: 'https://github.com/bmlzootown/FloatplaneAPI/pull/42',
    title: `${PR_TITLE_PREFIX} ${buildId}`,
    body: `observationId: ${observationId}\nbuildId: ${buildId}\n`,
    headRefName: MONITOR_BRANCH,
    headSha: 'tipsha',
  };
}

/** After A→B→C pending, main has C via any landing style. */
function landedAssessment(mode) {
  return assessPendingLedger({
    mainObservationId: OBS_C,
    monitorTipObservationId: OBS_C,
    monitoringPathDiffs: [],
    // Squash/rebase often leave ancestry "ahead" even though state matches.
    commitsAheadOfMain: mode === 'merge' ? 0 : 3,
    openMonitorPr: null,
    landingModeHint: mode,
  });
}

describe('Phase 1.2 cumulative ledger — required orchestration cases', () => {
  it('1. main A; Floatplane A → noop', () => {
    const prep = decideWorkspacePrep({
      fetchOk: true,
      monitorBranchExists: false,
      pendingAssessment: assessPendingLedger({
        mainObservationId: OBS_A,
        monitorTipObservationId: null,
        monitoringPathDiffs: [],
        commitsAheadOfMain: 0,
      }),
      mainObservationId: OBS_A,
      monitorTipObservationId: null,
      pendingObservations: [],
      openMonitorPr: null,
    });
    assert.equal(prep.action, 'use_main');
    assert.equal(prep.runWatcher, true);

    const d = decideMonitorAction({
      exitCode: EXIT.UNCHANGED,
      checkResult: { ok: true, changed: false, observationId: OBS_A, buildId: '1.0.0' },
      baselineObservationId: OBS_A,
      pendingObservations: [],
    });
    assert.equal(d.action, 'noop');
    assert.equal(d.reason, 'unchanged');
    assert.equal(d.appendObservationCommit, false);
    assert.equal(d.createPullRequest, false);
  });

  it('2. main A; Floatplane B → one pending PR/branch observation B', () => {
    const d = decideMonitorAction({
      exitCode: EXIT.CHANGED,
      checkResult: changePayload(OBS_B, '2.0.0', OBS_A),
      baselineObservationId: OBS_A,
      pendingObservations: [],
      openMonitorPr: null,
    });
    assert.equal(d.action, 'open_monitor_pr');
    assert.equal(d.reason, 'new_pending_observation');
    assert.equal(d.appendObservationCommit, true);
    assert.equal(d.createPullRequest, true);
    assert.equal(d.forcePush, false);
    assert.equal(d.resetFromMain, false);
    assert.equal(d.pendingObservations.length, 1);
    assert.equal(d.pendingObservations[0].observationId, OBS_B);
    assert.equal(d.previousObservationId, OBS_A);
    assert.equal(d.prTitle, `${PR_TITLE_PREFIX} 2.0.0`);
    assert.match(d.commitMessage, /^Observe Floatplane frontend 2\.0\.0$/);
  });

  it('3. pending B; Floatplane B → noop', () => {
    const prep = decideWorkspacePrep({
      fetchOk: true,
      monitorBranchExists: true,
      pendingAssessment: assessPendingLedger({
        mainObservationId: OBS_A,
        monitorTipObservationId: OBS_B,
        monitoringPathDiffs: ['state/last-known-frontend.json'],
        commitsAheadOfMain: 1,
        openMonitorPr: openPrFor(OBS_B, '2.0.0'),
      }),
      mainObservationId: OBS_A,
      monitorTipObservationId: OBS_B,
      pendingObservations: [obs(OBS_B, '2.0.0', OBS_A)],
      openMonitorPr: openPrFor(OBS_B, '2.0.0'),
    });
    assert.equal(prep.action, 'use_monitor_branch');
    assert.equal(prep.syncMainFirst, true);
    assert.equal(prep.expectedBaselineObservationId, OBS_B);

    const d = decideMonitorAction({
      exitCode: EXIT.UNCHANGED,
      checkResult: { ok: true, changed: false, observationId: OBS_B, buildId: '2.0.0' },
      baselineObservationId: OBS_B,
      pendingObservations: [obs(OBS_B, '2.0.0', OBS_A)],
      openMonitorPr: openPrFor(OBS_B, '2.0.0'),
      workspaceFromMonitor: true,
    });
    assert.equal(d.action, 'noop');
    assert.equal(d.appendObservationCommit, false);
    assert.equal(d.createPullRequest, false);
  });

  it('4. pending B; Floatplane C → append C after B same branch', () => {
    const d = decideMonitorAction({
      exitCode: EXIT.CHANGED,
      checkResult: changePayload(OBS_C, '3.0.0', OBS_B),
      baselineObservationId: OBS_B,
      pendingObservations: [obs(OBS_B, '2.0.0', OBS_A)],
      openMonitorPr: openPrFor(OBS_B, '2.0.0'),
      workspaceFromMonitor: true,
    });
    assert.equal(d.action, 'update_monitor_pr');
    assert.equal(d.reason, 'append_pending_observation');
    assert.equal(d.appendObservationCommit, true);
    assert.equal(d.createPullRequest, false);
    assert.equal(d.updatePullRequest, true);
    assert.equal(d.forcePush, false);
    assert.equal(d.resetFromMain, false);
    assert.equal(d.pendingObservations.map((p) => p.observationId).join(','), `${OBS_B},${OBS_C}`);
  });

  it('5. C.previousObservationId == B', () => {
    const d = decideMonitorAction({
      exitCode: EXIT.CHANGED,
      checkResult: changePayload(OBS_C, '3.0.0', OBS_B),
      baselineObservationId: OBS_B,
      pendingObservations: [obs(OBS_B, '2.0.0', OBS_A)],
      openMonitorPr: openPrFor(OBS_B, '2.0.0'),
      workspaceFromMonitor: true,
    });
    assert.equal(d.previousObservationId, OBS_B);
    assert.equal(d.pendingObservations[1].previousObservationId, OBS_B);
    assert.equal(d.baselineObservationId, OBS_B);
  });

  it('5b. rejects lineage that skips pending tip (would be A→C)', () => {
    const d = decideMonitorAction({
      exitCode: EXIT.CHANGED,
      checkResult: changePayload(OBS_C, '3.0.0', OBS_A),
      baselineObservationId: OBS_B,
      pendingObservations: [obs(OBS_B, '2.0.0', OBS_A)],
      openMonitorPr: openPrFor(OBS_B, '2.0.0'),
      workspaceFromMonitor: true,
    });
    assert.equal(d.action, 'report_failure');
    assert.equal(d.reason, 'previous_observation_mismatch');
    assert.equal(d.appendObservationCommit, false);
  });

  it('6. pending B+C merged → next C run noop from main', () => {
    const assessment = landedAssessment('merge');
    assert.equal(assessment.fullyLanded, true);
    assert.equal(assessment.hasUniquePending, false);

    const prep = decideWorkspacePrep({
      fetchOk: true,
      monitorBranchExists: true,
      pendingAssessment: assessment,
      mainObservationId: OBS_C,
      monitorTipObservationId: OBS_C,
      pendingObservations: [],
      openMonitorPr: null,
    });
    assert.equal(prep.action, 'use_main');
    assert.equal(prep.resetMonitorFromMain, true);
    assert.equal(prep.allowForceWithLeaseReset, true);

    const d = decideMonitorAction({
      exitCode: EXIT.UNCHANGED,
      checkResult: { ok: true, changed: false, observationId: OBS_C, buildId: '3.0.0' },
      baselineObservationId: OBS_C,
      pendingObservations: [],
    });
    assert.equal(d.action, 'noop');
    assert.equal(d.createPullRequest, false);
  });

  it('7. unrelated main commit while B pending → sync without losing B', () => {
    const prep = decideWorkspacePrep({
      fetchOk: true,
      monitorBranchExists: true,
      pendingAssessment: assessPendingLedger({
        mainObservationId: OBS_A,
        monitorTipObservationId: OBS_B,
        monitoringPathDiffs: ['state/last-known-frontend.json'],
        commitsAheadOfMain: 1,
        openMonitorPr: openPrFor(OBS_B, '2.0.0'),
      }),
      mainObservationId: OBS_A,
      monitorTipObservationId: OBS_B,
      pendingObservations: [obs(OBS_B, '2.0.0', OBS_A)],
      openMonitorPr: openPrFor(OBS_B, '2.0.0'),
    });
    assert.equal(prep.action, 'use_monitor_branch');
    assert.equal(prep.syncMainFirst, true);
    assert.equal(prep.pendingObservations[0].observationId, OBS_B);

    const sync = decideAfterMainSync({
      syncAttempted: true,
      conflict: false,
    });
    assert.equal(sync.action, 'continue');
    assert.equal(sync.runWatcher, true);
    assert.equal(prep.expectedBaselineObservationId, OBS_B);
  });

  it('8. sync conflict → fail safely', () => {
    const sync = decideAfterMainSync({
      syncAttempted: true,
      conflict: true,
      conflictPaths: ['state/last-known-frontend.json', 'README.md'],
    });
    assert.equal(sync.action, 'abort');
    assert.equal(sync.reason, 'sync_conflict_monitoring_paths');
    assert.equal(sync.runWatcher, false);
    assert.equal(sync.mutateRepo, false);
    assert.equal(hasMonitoringConflict(['artifacts/frontend/x/y/z']), true);
    assert.equal(hasMonitoringConflict(['README.md']), false);
  });

  it('9. repo fetch failure → no watcher mutation', () => {
    const prep = decideWorkspacePrep({
      fetchOk: false,
      fetchError: 'git fetch origin main failed: network',
    });
    assert.equal(prep.action, 'abort');
    assert.equal(prep.reason, 'scm_refresh_failed');
    assert.equal(prep.runWatcher, false);
    assert.equal(prep.mutateRepo, false);
  });

  it('10. watcher network failure → no observation commit/PR mutation', () => {
    const d = decideMonitorAction({
      exitCode: EXIT.FAILURE,
      checkResult: { ok: false, error: 'homepage fetch failed: network down' },
      baselineObservationId: OBS_B,
      pendingObservations: [obs(OBS_B, '2.0.0', OBS_A)],
      openMonitorPr: openPrFor(OBS_B, '2.0.0'),
      workspaceFromMonitor: true,
    });
    assert.equal(d.action, 'report_failure');
    assert.equal(d.appendObservationCommit, false);
    assert.equal(d.createPullRequest, false);
    assert.equal(d.updatePullRequest, false);
    assert.equal(d.mutateLastKnownGood, false);
    assert.equal(d.openMonitorPr.number, 42);
  });
});

describe('Phase 1.2 post-merge cleanup — merge/squash/rebase landing', () => {
  for (const mode of /** @type {const} */ (['merge', 'squash', 'rebase'])) {
    it(`${mode}-equivalent landing: main=C, no unique pending, Floatplane=C → noop + safe reset`, () => {
      const assessment = landedAssessment(mode);
      assert.equal(assessment.fullyLanded, true);
      assert.equal(assessment.hasUniquePending, false);
      assert.equal(assessment.allowResetFromMain, true);
      assert.equal(assessment.reason, 'observation_state_matches_main');
      if (mode !== 'merge') {
        assert.ok(assessment.ancestryCommitsAhead > 0);
      }

      const prep = decideWorkspacePrep({
        fetchOk: true,
        monitorBranchExists: true,
        pendingAssessment: assessment,
        mainObservationId: OBS_C,
        monitorTipObservationId: OBS_C,
        pendingObservations: [],
        openMonitorPr: null,
      });
      assert.equal(prep.action, 'use_main');
      assert.equal(prep.resetMonitorFromMain, true);
      assert.equal(prep.allowForceWithLeaseReset, true);

      const d = decideMonitorAction({
        exitCode: EXIT.UNCHANGED,
        checkResult: { ok: true, changed: false, observationId: OBS_C, buildId: '3.0.0' },
        baselineObservationId: OBS_C,
        pendingObservations: [],
      });
      assert.equal(d.action, 'noop');
    });
  }

  it('does not treat ancestry-ahead alone as unique pending when observationIds match', () => {
    const assessment = assessPendingLedger({
      mainObservationId: OBS_C,
      monitorTipObservationId: OBS_C,
      monitoringPathDiffs: [],
      commitsAheadOfMain: 99,
      openMonitorPr: null,
      landingModeHint: 'squash',
    });
    assert.equal(assessment.hasUniquePending, false);
    assert.equal(assessment.fullyLanded, true);
  });

  it('refuses reset when observationIds match but monitoring paths still differ', () => {
    const assessment = assessPendingLedger({
      mainObservationId: OBS_C,
      monitorTipObservationId: OBS_C,
      monitoringPathDiffs: ['artifacts/frontend/x/old.js'],
      commitsAheadOfMain: 0,
      openMonitorPr: null,
    });
    assert.equal(assessment.hasUniquePending, true);
    assert.equal(assessment.allowResetFromMain, false);
  });

  it('never discards monitoring solely because a PR looks merged while tip still differs', () => {
    const assessment = assessPendingLedger({
      mainObservationId: OBS_A,
      monitorTipObservationId: OBS_C,
      monitoringPathDiffs: ['state/last-known-frontend.json'],
      commitsAheadOfMain: 0,
      openMonitorPr: null,
    });
    assert.equal(assessment.hasUniquePending, true);
    assert.equal(assessment.allowResetFromMain, false);

    const prep = decideWorkspacePrep({
      fetchOk: true,
      monitorBranchExists: true,
      pendingAssessment: assessment,
      mainObservationId: OBS_A,
      monitorTipObservationId: OBS_C,
      pendingObservations: [obs(OBS_B, '2.0.0', OBS_A), obs(OBS_C, '3.0.0', OBS_B)],
      openMonitorPr: null,
    });
    assert.equal(prep.action, 'use_monitor_branch');
    assert.equal(prep.resetMonitorFromMain, false);
    assert.equal(prep.allowForceWithLeaseReset, false);
  });
});

describe('Phase 1.2 overlapping/racing Automation runs', () => {
  it('two runs discover same observation; remote already has it → noop success', () => {
    const race = decidePushRace({
      pushRejected: true,
      localObservationId: OBS_B,
      localPreviousObservationId: OBS_A,
      remoteTipObservationIdAfterFetch: OBS_B,
      remoteLedgerObservationIds: [OBS_B],
      refetchOk: true,
    });
    assert.equal(race.action, 'noop');
    assert.equal(race.reason, 'remote_already_has_observation');
    assert.equal(race.forcePush, false);
    assert.equal(race.discardLocalMutation, true);
    assert.equal(race.createPullRequest, false);
  });

  it('remote advances to same observation before push → success/no-op', () => {
    const race = decidePushRace({
      pushRejected: true,
      localObservationId: OBS_C,
      localPreviousObservationId: OBS_B,
      remoteTipObservationIdAfterFetch: OBS_C,
      remoteLedgerObservationIds: [OBS_B, OBS_C],
      refetchOk: true,
    });
    assert.equal(race.action, 'noop');
    assert.equal(race.forcePush, false);
    assert.equal(race.preserveLineage, true);
  });

  it('remote advances to different/newer observation before push → reevaluate, never overwrite', () => {
    const race = decidePushRace({
      pushRejected: true,
      localObservationId: OBS_C,
      localPreviousObservationId: OBS_B,
      remoteTipObservationIdAfterFetch: OBS_D,
      remoteLedgerObservationIds: [OBS_B, OBS_D],
      refetchOk: true,
    });
    assert.equal(race.action, 'reevaluate_from_remote');
    assert.equal(race.reason, 'remote_advanced_different_observation');
    assert.equal(race.forcePush, false);
    assert.equal(race.discardLocalMutation, true);
    assert.equal(race.newBaselineObservationId, OBS_D);
    assert.equal(race.createPullRequest, false);
    assert.match(race.notes.join('\n'), /Do not rewrite B→C as B→D/i);
  });

  it('push rejected and refetch fails → fail closed', () => {
    const race = decidePushRace({
      pushRejected: true,
      localObservationId: OBS_C,
      remoteTipObservationIdAfterFetch: null,
      refetchOk: false,
      refetchError: 'fetch failed',
    });
    assert.equal(race.action, 'abort');
    assert.equal(race.reason, 'push_race_refetch_failed');
    assert.equal(race.forcePush, false);
  });

  it('unreconciled race → fail closed (no competing history)', () => {
    const race = decidePushRace({
      pushRejected: true,
      localObservationId: OBS_C,
      remoteTipObservationIdAfterFetch: null,
      remoteLedgerObservationIds: [],
      refetchOk: true,
    });
    assert.equal(race.action, 'abort');
    assert.equal(race.reason, 'push_race_unreconciled');
    assert.equal(race.forcePush, false);
    assert.equal(race.createPullRequest, false);
  });

  it('successful push path never requests force', () => {
    const race = decidePushRace({
      pushRejected: false,
      localObservationId: OBS_B,
      remoteTipObservationIdAfterFetch: OBS_B,
    });
    assert.equal(race.action, 'success');
    assert.equal(race.forcePush, false);
  });

  it('append decision itself forbids force-push of observation commits', () => {
    const d = decideMonitorAction({
      exitCode: EXIT.CHANGED,
      checkResult: changePayload(OBS_B, '2.0.0', OBS_A),
      baselineObservationId: OBS_A,
      pendingObservations: [],
    });
    assert.equal(d.forcePush, false);
    assert.equal(d.pushRacePolicy, 'fetch_and_reconcile_never_force_observation_push');
  });
});

describe('monitor PR helpers (cumulative body)', () => {
  it('parses observationId and buildId markers', () => {
    assert.equal(parseObservationIdFromPrBody(`observationId: ${OBS_A}\n`), OBS_A);
    assert.equal(
      parseBuildIdFromPrTitle(`${PR_TITLE_PREFIX} 4.5.22-316-d74397b`),
      '4.5.22-316-d74397b',
    );
  });

  it('selects fixed monitoring branch PR over title-only matches', () => {
    const selected = selectMonitorPr([
      {
        number: 1,
        url: 'u1',
        title: `${PR_TITLE_PREFIX} other`,
        body: `observationId: ${OBS_C}\n`,
        headRefName: 'cursor/other',
      },
      {
        number: 2,
        url: 'u2',
        title: `${PR_TITLE_PREFIX} main`,
        body: `observationId: ${OBS_B}\n`,
        headRefName: MONITOR_BRANCH,
      },
    ]);
    assert.equal(selected.number, 2);
    assert.equal(selected.observationId, OBS_B);
  });

  it('formats PR body summarizing all pending observations', () => {
    const body = formatObservationPrBody({
      pendingObservations: [obs(OBS_B, '2.0.0', OBS_A), obs(OBS_C, '3.0.0', OBS_B)],
      latestCheckSummary: changePayload(OBS_C, '3.0.0', OBS_B),
      testStatus: { frontendWatchTest: 'pass' },
      mainObservationId: OBS_A,
    });
    assert.match(body, /pendingObservationCount: 2/);
    assert.match(body, /#### 1\. buildId `2\.0\.0`/);
    assert.match(body, /#### 2\. buildId `3\.0\.0`/);
    assert.match(body, new RegExp(`previousObservationId: \`${OBS_B}\``));
    assert.match(body, /does \*\*not\*\* claim.*API changed/i);
    assert.doesNotMatch(body, /Superseded unmerged/);
    assert.match(body, /A→B→C/);
    assert.match(body, /frontend-watch-test: pass/);
  });
});
