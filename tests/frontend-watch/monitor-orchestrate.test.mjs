import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { EXIT } from '../../tools/fp-frontend-watch/lib/constants.mjs';
import {
  MONITOR_BRANCH,
  PR_TITLE_PREFIX,
} from '../../tools/fp-frontend-watch/lib/monitor-constants.mjs';
import {
  decideAfterMainSync,
  decideMonitorAction,
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

describe('Phase 1.2 cumulative ledger — required orchestration cases', () => {
  it('1. main A; Floatplane A → noop', () => {
    const prep = decideWorkspacePrep({
      fetchOk: true,
      monitorBranchExists: false,
      monitorHasPendingCommits: false,
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
      monitorHasPendingCommits: true,
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
      checkResult: changePayload(OBS_C, '3.0.0', OBS_A), // wrong: previous should be B
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
    const prep = decideWorkspacePrep({
      fetchOk: true,
      monitorBranchExists: true,
      monitorHasPendingCommits: false,
      mainObservationId: OBS_C,
      monitorTipObservationId: OBS_C,
      pendingObservations: [],
      openMonitorPr: null,
    });
    assert.equal(prep.action, 'use_main');
    assert.equal(prep.resetMonitorFromMain, true);

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
      monitorHasPendingCommits: true,
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
    // Pending B retained in prep; watcher baseline remains B.
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
