import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { EXIT } from '../../tools/fp-frontend-watch/lib/constants.mjs';
import { MONITOR_BRANCH, PR_TITLE_PREFIX } from '../../tools/fp-frontend-watch/lib/monitor-constants.mjs';
import {
  decideMonitorAction,
  parseObservationIdFromPrBody,
  parseBuildIdFromPrTitle,
  selectMonitorPr,
} from '../../tools/fp-frontend-watch/lib/monitor-decision.mjs';
import { formatObservationPrBody } from '../../tools/fp-frontend-watch/lib/monitor-pr-body.mjs';

const OBS_A = 'a'.repeat(64);
const OBS_B = 'b'.repeat(64);
const OBS_DEFAULT = 'd'.repeat(64);

function changePayload(overrides = {}) {
  return {
    ok: true,
    changed: true,
    observationId: OBS_A,
    previousObservationId: OBS_DEFAULT,
    buildId: '9.9.9-1-abc',
    observedAt: '2026-09-24T12:00:00.000Z',
    artifactDir: `artifacts/frontend/9.9.9-1-abc/${OBS_A}`,
    layout: 'vite-user',
    statePath: 'state/last-known-frontend.json',
    artifacts: [
      {
        path: 'js/index-x.js',
        sha256: 'c'.repeat(64),
        bytes: 12,
        url: 'https://frontend.floatplane.com/user/9.9.9-1-abc/js/index-x.js',
      },
    ],
    comparison: { status: 'changed', summary: 'new observation' },
    ...overrides,
  };
}

describe('monitor-decision Phase 1.2 validation cases', () => {
  it('case 1: default already current → noop, no PR', () => {
    const d = decideMonitorAction({
      exitCode: EXIT.UNCHANGED,
      checkResult: { ok: true, changed: false, observationId: OBS_DEFAULT, buildId: '1.0.0' },
      openMonitorPrs: [],
    });
    assert.equal(d.action, 'noop');
    assert.equal(d.reason, 'unchanged');
    assert.equal(d.createPullRequest, false);
  });

  it('case 2: new deployment → open one observation PR', () => {
    const d = decideMonitorAction({
      exitCode: EXIT.CHANGED,
      checkResult: changePayload(),
      openMonitorPrs: [],
    });
    assert.equal(d.action, 'open_monitor_pr');
    assert.equal(d.reason, 'new_observation');
    assert.equal(d.createPullRequest, true);
    assert.equal(d.prTitle, `${PR_TITLE_PREFIX} 9.9.9-1-abc`);
    assert.equal(d.monitorBranch, MONITOR_BRANCH);
    assert.equal(d.preserveWatcherArtifactsExactly, true);
  });

  it('case 3: same deployment while PR open → no duplicate', () => {
    const d = decideMonitorAction({
      exitCode: EXIT.CHANGED,
      checkResult: changePayload(),
      openMonitorPrs: [
        {
          number: 42,
          url: 'https://github.com/bmlzootown/FloatplaneAPI/pull/42',
          title: `${PR_TITLE_PREFIX} 9.9.9-1-abc`,
          body: `observationId: ${OBS_A}\nbuildId: 9.9.9-1-abc\n`,
          headRefName: MONITOR_BRANCH,
          headSha: 'deadbeef',
        },
      ],
    });
    assert.equal(d.action, 'noop');
    assert.equal(d.reason, 'duplicate_open_pr_same_observation');
    assert.equal(d.createPullRequest, false);
    assert.equal(d.discardWorkingTreeChanges, true);
  });

  it('case 4: another new deployment while prior PR open → update/supersede same PR', () => {
    const d = decideMonitorAction({
      exitCode: EXIT.CHANGED,
      checkResult: changePayload({ observationId: OBS_B, buildId: '9.9.9-2-def' }),
      openMonitorPrs: [
        {
          number: 42,
          url: 'https://github.com/bmlzootown/FloatplaneAPI/pull/42',
          title: `${PR_TITLE_PREFIX} 9.9.9-1-abc`,
          body: `observationId: ${OBS_A}\nbuildId: 9.9.9-1-abc\n`,
          headRefName: MONITOR_BRANCH,
          headSha: 'oldtipsha',
        },
      ],
    });
    assert.equal(d.action, 'update_monitor_pr');
    assert.equal(d.reason, 'supersede_unmerged_observation');
    assert.equal(d.createPullRequest, false);
    assert.equal(d.updatePullRequest, true);
    assert.equal(d.previousOpenObservationId, OBS_A);
    assert.equal(d.accumulatePriorUnmergedArtifacts, true);
    assert.equal(d.preserveWatcherArtifactsExactly, true);
    assert.match(d.notes.join('\n'), /not treat.*unmerged/i);
  });

  it('case 5: Floatplane/network down → report_failure, no deployment PR, no LKG mutation', () => {
    const d = decideMonitorAction({
      exitCode: EXIT.FAILURE,
      checkResult: { ok: false, error: 'homepage fetch failed: network down' },
      openMonitorPrs: [
        {
          number: 42,
          url: 'https://github.com/bmlzootown/FloatplaneAPI/pull/42',
          title: `${PR_TITLE_PREFIX} 9.9.9-1-abc`,
          body: `observationId: ${OBS_A}\n`,
          headRefName: MONITOR_BRANCH,
        },
      ],
    });
    assert.equal(d.action, 'report_failure');
    assert.equal(d.createPullRequest, false);
    assert.equal(d.mutateLastKnownGood, false);
    assert.equal(d.mutateDefaultBranch, false);
    assert.match(d.error, /network down/);
    assert.equal(d.openMonitorPr.number, 42);
  });
});

describe('monitor PR helpers', () => {
  it('parses observationId and buildId markers', () => {
    assert.equal(
      parseObservationIdFromPrBody(`hello\nobservationId: ${OBS_A}\n`),
      OBS_A,
    );
    assert.equal(parseBuildIdFromPrTitle(`${PR_TITLE_PREFIX} 4.5.22-316-d74397b`), '4.5.22-316-d74397b');
  });

  it('selects fixed monitoring branch PR over title-only matches', () => {
    const selected = selectMonitorPr([
      {
        number: 1,
        url: 'u1',
        title: `${PR_TITLE_PREFIX} other`,
        body: `observationId: ${OBS_B}\n`,
        headRefName: 'cursor/other',
      },
      {
        number: 2,
        url: 'u2',
        title: `${PR_TITLE_PREFIX} main`,
        body: `observationId: ${OBS_A}\n`,
        headRefName: MONITOR_BRANCH,
      },
    ]);
    assert.equal(selected.number, 2);
    assert.equal(selected.observationId, OBS_A);
  });

  it('formats factual Phase 1 PR body without API claims', () => {
    const body = formatObservationPrBody({
      checkSummary: changePayload(),
      testStatus: { frontendWatchTest: 'pass' },
      supersede: {
        previousOpenObservationId: OBS_A,
        previousOpenBuildId: '9.9.9-1-abc',
        previousHeadSha: 'abc123',
      },
    });
    assert.match(body, /observationId: a{64}/);
    assert.match(body, /does \*\*not\*\* claim.*API changed/i);
    assert.doesNotMatch(body, /OpenAPI changed/i);
    assert.match(body, /Superseded unmerged observation/);
    assert.match(body, /frontend-watch-test: pass/);
  });
});
