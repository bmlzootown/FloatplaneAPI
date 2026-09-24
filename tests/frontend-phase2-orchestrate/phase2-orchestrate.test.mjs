/**
 * Phase 2.3 offline integration tests (§15 cases 1–15).
 * Uses fixture inventories only — no live Floatplane, no fabricated real changes.
 */

import { describe, it, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { mkdir, rm, writeFile, readFile, access } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  makeEvidenceDoc,
  structuredOp,
  writeObservationInventory,
} from '../frontend-evidence-diff/helpers.mjs';
import {
  EXTRACT_STATUS,
  COMPARISON_STATUS,
  COMMIT_STRATEGY,
  GROWTH_ESTIMATE,
  PROCESSING_INDEX_FILE,
} from '../../tools/fp-frontend-evidence/lib/orchestrate/constants.mjs';
import {
  buildProcessingRecord,
  extractNeedsWork,
  comparisonNeedsWork,
  writeProcessingRecord,
  writeProcessingIndex,
  inspectExtractArtifacts,
  readOrDeriveProcessing,
  validateProcessingConsistency,
} from '../../tools/fp-frontend-evidence/lib/orchestrate/status.mjs';
import {
  buildBacklog,
  orderByLineage,
  scanProcessingRecords,
} from '../../tools/fp-frontend-evidence/lib/orchestrate/backlog.mjs';
import { processOneObservation } from '../../tools/fp-frontend-evidence/lib/orchestrate/process-one.mjs';
import { runPhase2Backlog } from '../../tools/fp-frontend-evidence/lib/orchestrate/run.mjs';
import {
  buildCommitSequence,
  decidePhase2PushRace,
  decidePhase2PrAction,
  classifyPhase2Commit,
  classifyMonitoringPathDiffs,
  isPhase2OwnedPath,
} from '../../tools/fp-frontend-evidence/lib/orchestrate/decision.mjs';
import {
  formatAnalysisPrSection,
} from '../../tools/fp-frontend-evidence/lib/orchestrate/pr-analysis.mjs';
import { formatObservationPrBody } from '../../tools/fp-frontend-watch/lib/monitor-pr-body.mjs';
import { runEvidenceDiff } from '../../tools/fp-frontend-evidence/lib/diff/run-diff.mjs';
import { PR_BODY_MARKERS } from '../../tools/fp-frontend-watch/lib/monitor-constants.mjs';
import { assessPendingLedger } from '../../tools/fp-frontend-watch/lib/monitor-decision.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TMP = path.join(__dirname, '.tmp-phase2-orch');

const OBS_A = 'a'.repeat(64);
const OBS_B = 'b'.repeat(64);
const OBS_C = 'c'.repeat(64);

async function exists(p) {
  try {
    await access(p);
    return true;
  } catch {
    return false;
  }
}

async function writeObs(opts) {
  const { obsDir } = await writeObservationInventory({
    artifactsRoot: opts.artifactsRoot,
    observationId: opts.observationId,
    buildId: opts.buildId,
    evidence: opts.evidence,
    closureStatus: opts.closureStatus,
    refuseRemoval: opts.refuseRemoval,
  });
  // Patch lineage into observation.json
  const obsPath = path.join(obsDir, 'observation.json');
  const observation = JSON.parse(await readFile(obsPath, 'utf8'));
  observation.previousObservationId =
    opts.previousObservationId === undefined ? null : opts.previousObservationId;
  if (opts.observedAt) observation.observedAt = opts.observedAt;
  await writeFile(obsPath, `${JSON.stringify(observation, null, 2)}\n`);
  return obsDir;
}

before(async () => {
  await rm(TMP, { recursive: true, force: true });
  await mkdir(TMP, { recursive: true });
});

after(async () => {
  await rm(TMP, { recursive: true, force: true });
});

beforeEach(async () => {
  await rm(TMP, { recursive: true, force: true });
  await mkdir(TMP, { recursive: true });
});

describe('Phase 2.3 orchestration — offline cases 1–15', () => {
  it('1. Phase 1 Observe commit stays durable when Phase 2 fails', () => {
    const plan = buildCommitSequence({
      phase1Append: true,
      phase1CommitMessage: 'Observe Floatplane frontend 2.0.0',
      phase1Paths: ['state/last-known-frontend.json', 'artifacts/frontend/2.0.0/bbb'],
      phase2Results: [
        {
          didExtract: false,
          didCompare: false,
          extractFailed: true,
          buildId: '2.0.0',
          observationId: OBS_B,
          touchedRelPaths: [],
        },
      ],
    });
    assert.equal(plan.commits.length, 1);
    assert.equal(plan.commits[0].phase, 'phase1');
    assert.equal(plan.commits[0].step, 'observe');
    assert.equal(COMMIT_STRATEGY.observeSeparate, true);
    assert.match(plan.notes.join(' '), /Phase 2 fails/);
  });

  it('2. Backlog retries unprocessed Phase 1 even when live unchanged', async () => {
    const root = path.join(TMP, 'case2');
    await mkdir(root, { recursive: true });
    // Phase 1 observation exists, no phase2 yet
    const obsDir = path.join(root, 'build-x', OBS_B);
    await mkdir(path.join(obsDir, 'js'), { recursive: true });
    await writeFile(
      path.join(obsDir, 'observation.json'),
      JSON.stringify({
        observationId: OBS_B,
        buildId: 'build-x',
        previousObservationId: OBS_A,
        observedAt: '2026-09-24T13:00:00.000Z',
        artifacts: [{ path: 'js/index-AAAA.js', sha256: 'a'.repeat(64), bytes: 1 }],
      }),
    );
    await writeFile(path.join(obsDir, 'js/index-AAAA.js'), '//x\n');

    const { records, byId } = await scanProcessingRecords({ artifactsRoot: root });
    assert.equal(records.length, 1);
    assert.equal(records[0].extract.status, EXTRACT_STATUS.NOT_PROCESSED);
    const backlog = buildBacklog({ records, byId });
    assert.equal(backlog.length, 1);
    assert.equal(backlog[0].needExtract, true);
  });

  it('3. Lineage processes predecessor first (A→B then B→C, never A→C skip)', () => {
    const listed = [
      {
        observationId: OBS_C,
        buildId: 'c',
        previousObservationId: OBS_B,
        observedAt: '2026-09-24T15:00:00.000Z',
        observationDir: '/c',
        artifactDirRel: 'c',
      },
      {
        observationId: OBS_A,
        buildId: 'a',
        previousObservationId: null,
        observedAt: '2026-09-24T12:00:00.000Z',
        observationDir: '/a',
        artifactDirRel: 'a',
      },
      {
        observationId: OBS_B,
        buildId: 'b',
        previousObservationId: OBS_A,
        observedAt: '2026-09-24T13:00:00.000Z',
        observationDir: '/b',
        artifactDirRel: 'b',
      },
    ];
    const ordered = orderByLineage(listed);
    assert.deepEqual(
      ordered.map((o) => o.observationId),
      [OBS_A, OBS_B, OBS_C],
    );
  });

  it('4. Baseline with null previousObservationId: comparison not_applicable (no fabricated predecessor)', async () => {
    const root = path.join(TMP, 'case4');
    await writeObs({
      artifactsRoot: root,
      observationId: OBS_A,
      buildId: 'base',
      previousObservationId: null,
      evidence: makeEvidenceDoc({
        observationId: OBS_A,
        buildId: 'base',
        items: [structuredOp({ method: 'GET', path: '/api/v3/user' })],
      }),
    });
    const record = await buildProcessingRecord({
      observationDir: path.join(root, 'base', OBS_A),
      observationId: OBS_A,
      buildId: 'base',
      previousObservationId: null,
    });
    assert.equal(record.comparison.status, COMPARISON_STATUS.NOT_APPLICABLE);
    assert.equal(record.comparison.fromObservationId, null);
    assert.equal(comparisonNeedsWork(record), false);
  });

  it('5. Machine-readable processing statuses cover required vocabulary', async () => {
    const root = path.join(TMP, 'case5');
    await writeObs({
      artifactsRoot: root,
      observationId: OBS_A,
      buildId: 'b1',
      previousObservationId: null,
      evidence: makeEvidenceDoc({
        observationId: OBS_A,
        items: [structuredOp({ method: 'GET', path: '/api/v3/a' })],
      }),
      closureStatus: 'complete',
    });
    await writeObs({
      artifactsRoot: root,
      observationId: OBS_B,
      buildId: 'b2',
      previousObservationId: OBS_A,
      evidence: makeEvidenceDoc({
        observationId: OBS_B,
        items: [structuredOp({ method: 'GET', path: '/api/v3/a' })],
        closureStatus: 'incomplete',
      }),
      closureStatus: 'incomplete',
      refuseRemoval: true,
    });

    const complete = await inspectExtractArtifacts(path.join(root, 'b1', OBS_A));
    assert.equal(complete.extract.status, EXTRACT_STATUS.COMPLETE);

    const incomplete = await inspectExtractArtifacts(path.join(root, 'b2', OBS_B));
    assert.equal(incomplete.extract.status, EXTRACT_STATUS.INCOMPLETE_PROMOTED);

    const missing = path.join(root, 'b3', OBS_C);
    await mkdir(path.join(missing, 'js'), { recursive: true });
    await writeFile(
      path.join(missing, 'observation.json'),
      JSON.stringify({
        observationId: OBS_C,
        buildId: 'b3',
        previousObservationId: OBS_B,
        artifacts: [],
      }),
    );
    const np = await inspectExtractArtifacts(missing);
    assert.equal(np.extract.status, EXTRACT_STATUS.NOT_PROCESSED);

    // Partial → extract_failed
    await mkdir(path.join(missing, 'phase2'), { recursive: true });
    await writeFile(path.join(missing, 'phase2', 'status.json'), '{"status":"complete"}');
    const failed = await inspectExtractArtifacts(missing);
    assert.equal(failed.extract.status, EXTRACT_STATUS.EXTRACT_FAILED);

    assert.ok(Object.values(EXTRACT_STATUS).includes('not_processed'));
    assert.ok(Object.values(EXTRACT_STATUS).includes('complete'));
    assert.ok(Object.values(EXTRACT_STATUS).includes('incomplete_promoted'));
    assert.ok(Object.values(EXTRACT_STATUS).includes('extract_failed'));
    assert.ok(Object.values(COMPARISON_STATUS).includes('pending'));
    assert.ok(Object.values(COMPARISON_STATUS).includes('complete'));
    assert.ok(Object.values(COMPARISON_STATUS).includes('failed'));
    assert.ok(Object.values(COMPARISON_STATUS).includes('not_applicable'));
  });

  it('6. Valid incomplete inventory does not crash; compare uses directional gating; no endless extract retry', async () => {
    const root = path.join(TMP, 'case6');
    await writeObs({
      artifactsRoot: root,
      observationId: OBS_A,
      buildId: 'b1',
      previousObservationId: null,
      evidence: makeEvidenceDoc({
        observationId: OBS_A,
        items: [
          structuredOp({ method: 'GET', path: '/api/v3/keep' }),
          structuredOp({ method: 'GET', path: '/api/v3/gone' }),
        ],
      }),
    });
    await writeObs({
      artifactsRoot: root,
      observationId: OBS_B,
      buildId: 'b2',
      previousObservationId: OBS_A,
      evidence: makeEvidenceDoc({
        observationId: OBS_B,
        items: [
          structuredOp({ method: 'GET', path: '/api/v3/keep' }),
          structuredOp({ method: 'POST', path: '/api/v3/new' }),
        ],
        closureStatus: 'incomplete',
      }),
      closureStatus: 'incomplete',
      refuseRemoval: true,
    });

    const { records, byId } = await scanProcessingRecords({ artifactsRoot: root });
    const recB = byId.get(OBS_B);
    assert.equal(recB.extract.status, EXTRACT_STATUS.INCOMPLETE_PROMOTED);
    assert.equal(extractNeedsWork(recB), false); // no endless retry

    const diff = await runEvidenceDiff({
      repoRoot: TMP,
      artifactsRoot: root,
      fromObservationId: OBS_A,
      toObservationId: OBS_B,
      dryRun: true,
      labelAsReal: false,
    });
    assert.equal(diff.diff.disappearanceConclusionsAllowed, false);
    assert.equal(diff.diff.additionConclusionsAllowed, true);
    assert.ok(
      diff.diff.changes.some((c) => c.category === 'structured_operation_added'),
    );
    assert.ok(
      !diff.diff.changes.some(
        (c) => c.category === 'structured_operation_disappeared',
      ),
    );
  });

  it('7. Commit sequence: Observe separate; Extract+Compare combined when both succeed', () => {
    assert.equal(COMMIT_STRATEGY.extractCompareCombinedWhenPossible, true);
    const both = classifyPhase2Commit({
      didExtract: true,
      didCompare: true,
      buildId: '9.9.9',
    });
    assert.equal(both.kind, 'extract_compare');
    assert.match(both.message, /^Extract\+Compare/);

    const plan = buildCommitSequence({
      phase1Append: true,
      phase1CommitMessage: 'Observe Floatplane frontend 9.9.9',
      phase1Paths: ['state/last-known-frontend.json'],
      phase2Results: [
        {
          didExtract: true,
          didCompare: true,
          buildId: '9.9.9',
          observationId: OBS_B,
          touchedRelPaths: ['artifacts/frontend/9.9.9/' + OBS_B + '/phase2'],
        },
      ],
      indexPath: 'artifacts/frontend/' + PROCESSING_INDEX_FILE,
    });
    assert.equal(plan.commits.length, 2);
    assert.equal(plan.commits[0].phase, 'phase1');
    assert.equal(plan.commits[1].phase, 'phase2');
    assert.equal(plan.commits[1].step, 'extract_compare');
    // Never one unit combining phase1+phase2
    assert.ok(plan.commits.every((c) => c.phase === 'phase1' || c.phase === 'phase2'));
  });

  it('8. PR body expands with per-observation analysis links; no huge inventories; no server-API claims', async () => {
    const analyses = [
      {
        observationId: OBS_B,
        buildId: '2.0.0',
        previousObservationId: OBS_A,
        extractStatus: 'complete',
        closureStatus: 'complete',
        comparisonStatus: 'complete',
        comparisonOutcome: 'complete',
        inventoryMd: `artifacts/frontend/2.0.0/${OBS_B}/phase2/api-evidence.inventory.md`,
        diffMd: `artifacts/frontend/2.0.0/${OBS_B}/phase2/diffs/${OBS_A}/evidence-diff.md`,
        diffJson: null,
        compactCounts: {
          totalAtomic: 1,
          totalDerived: 0,
          suppressedTotal: 0,
          structured_operation_added: 1,
          structured_operation_disappeared: 0,
          method_set_changed: 0,
          provenance_moved: 0,
        },
        headline: '1 structured op(s) added in frontend evidence',
        disclaimer:
          'Frontend-evidence analysis only — does not claim the Floatplane server API changed.',
      },
    ];
    const body = formatObservationPrBody({
      pendingObservations: [
        {
          observationId: OBS_B,
          previousObservationId: OBS_A,
          buildId: '2.0.0',
          artifactDir: `artifacts/frontend/2.0.0/${OBS_B}`,
        },
      ],
      phase2Analyses: analyses,
      includePhase2: true,
      watcherResult: 'CHANGE DETECTED',
    });
    assert.match(body, /Phase 2 evidence analysis/);
    assert.match(body, /evidence-diff\.md/);
    assert.match(body, /does \*\*not\*\* claim/);
    assert.match(body, /\*\*not\*\* a server API changelog/);
    assert.doesNotMatch(body, /API endpoint (definitely )?added|breaking change/i);
    assert.match(body, /phase: 1-frontend-observation\+2-evidence-analysis/);
    assert.equal(body.includes(PR_BODY_MARKERS.phaseWithEvidence), true);
    // No huge inventory dump
    assert.doesNotMatch(body, /structured_operation:GET:/);
    const section = formatAnalysisPrSection(analyses);
    assert.match(section, /counts: atomic=1/);
  });

  it('9. Failure modes: extract_failed and compare failed are recorded and retryable', async () => {
    const root = path.join(TMP, 'case9');
    const obsDir = path.join(root, 'bx', OBS_B);
    await mkdir(path.join(obsDir, 'phase2'), { recursive: true });
    await writeFile(
      path.join(obsDir, 'observation.json'),
      JSON.stringify({
        observationId: OBS_B,
        buildId: 'bx',
        previousObservationId: OBS_A,
        artifacts: [{ path: 'js/index-AAAA.js', sha256: 'a'.repeat(64) }],
      }),
    );
    // Corrupt partial extract
    await writeFile(path.join(obsDir, 'phase2', 'status.json'), '{not-json');
    const insp = await inspectExtractArtifacts(obsDir);
    assert.equal(insp.extract.status, EXTRACT_STATUS.EXTRACT_FAILED);
    assert.equal(extractNeedsWork({ extract: insp.extract }), true);

    const raceAbort = decidePhase2PushRace({
      pushRejected: true,
      remoteAlreadyHasEvidence: false,
      remoteTipDifferent: false,
    });
    assert.equal(raceAbort.action, 'abort');
  });

  it('10. FF-only race: remote already has evidence → noop + discard local Phase 2 mutations', () => {
    const d = decidePhase2PushRace({
      pushRejected: true,
      remoteAlreadyHasEvidence: true,
      remoteTipDifferent: false,
    });
    assert.equal(d.action, 'noop');
    assert.equal(d.forcePush, false);
    assert.equal(d.discardLocalPhase2Mutations, true);
    assert.equal(d.refetch, true);

    const d2 = decidePhase2PushRace({
      pushRejected: true,
      remoteAlreadyHasEvidence: false,
      remoteTipDifferent: true,
    });
    assert.equal(d2.action, 'discard_and_reevaluate');
    assert.equal(d2.forcePush, false);
  });

  it('11. Works with no/one/many pending; main missing Phase 2 → analysis PR, never rewrite main', () => {
    const none = decidePhase2PrAction({
      phase1Action: 'noop',
      phase2CommitCount: 0,
      openMonitorPr: null,
      hasUniquePendingPhase1: false,
      phase2BacklogOnMainOnly: false,
    });
    assert.equal(none.action, 'noop');

    const one = decidePhase2PrAction({
      phase1Action: 'open_monitor_pr',
      phase2CommitCount: 1,
      openMonitorPr: null,
      hasUniquePendingPhase1: true,
      phase2BacklogOnMainOnly: false,
    });
    assert.equal(one.action, 'open_monitor_pr');
    assert.equal(one.neverRewriteMain, true);

    const mainMissing = decidePhase2PrAction({
      phase1Action: 'noop',
      phase2CommitCount: 1,
      openMonitorPr: null,
      hasUniquePendingPhase1: false,
      phase2BacklogOnMainOnly: true,
    });
    assert.equal(mainMissing.action, 'open_monitor_pr');
    assert.equal(mainMissing.useMonitorBranch, true);
    assert.equal(mainMissing.neverRewriteMain, true);
    assert.match(mainMissing.notes.join(' '), /never rewrite main/i);
  });

  it('12. Unified decision exposes single scheduled command contract (sync+P1+backlog+extract+compare+PR)', async () => {
    const root = path.join(TMP, 'case12');
    await writeObs({
      artifactsRoot: root,
      observationId: OBS_A,
      buildId: 'b1',
      previousObservationId: null,
      evidence: makeEvidenceDoc({
        observationId: OBS_A,
        items: [structuredOp({ method: 'GET', path: '/api/v3/a' })],
      }),
    });
    await writeObs({
      artifactsRoot: root,
      observationId: OBS_B,
      buildId: 'b2',
      previousObservationId: OBS_A,
      evidence: makeEvidenceDoc({
        observationId: OBS_B,
        items: [
          structuredOp({ method: 'GET', path: '/api/v3/a' }),
          structuredOp({ method: 'POST', path: '/api/v3/b' }),
        ],
      }),
    });

    const phase2 = await runPhase2Backlog({
      repoRoot: TMP,
      artifactsRoot: root,
      statePath: path.join(TMP, 'state.json'),
      dryRun: false,
      phase1Decision: {
        action: 'noop',
        reason: 'unchanged',
        appendObservationCommit: false,
        pendingObservations: [],
      },
      hasUniquePendingPhase1: false,
    });

    assert.ok(phase2.commitSequence);
    assert.ok(phase2.analyses);
    assert.equal(typeof phase2.action, 'string');
    // Compare should have run for B (both extracts already complete)
    const resB = phase2.results.find((r) => r.observationId === OBS_B);
    assert.ok(resB);
    assert.equal(resB.didCompare, true);
    assert.equal(resB.didExtract, false);
    assert.ok(
      await exists(
        path.join(root, 'b2', OBS_B, 'phase2', 'diffs', OBS_A, 'evidence-diff.md'),
      ),
    );
  });

  it('13. Scheduled path must not require full unit suite every 6h', () => {
    assert.equal(GROWTH_ESTIMATE.keepAllReachableJs, true);
    const body = formatObservationPrBody({
      pendingObservations: [],
      includePhase2: true,
      phase2Analyses: [],
    });
    assert.match(body, /do \*\*not\*\* execute the full unit suite every cycle/i);
  });

  it('14. Keep all reachable JS — growth estimate documented; no prune flag', () => {
    assert.equal(GROWTH_ESTIMATE.keepAllReachableJs, true);
    assert.match(GROWTH_ESTIMATE.note, /does not prune/i);
    assert.match(GROWTH_ESTIMATE.totalMbPerObservation, /5/);
  });

  it('15. End-to-end backlog: A complete, B missing extract blocked until predecessor; then A→B compare', async () => {
    const root = path.join(TMP, 'case15');
    await writeObs({
      artifactsRoot: root,
      observationId: OBS_A,
      buildId: 'b1',
      previousObservationId: null,
      observedAt: '2026-09-24T12:00:00.000Z',
      evidence: makeEvidenceDoc({
        observationId: OBS_A,
        items: [structuredOp({ method: 'GET', path: '/api/v3/a' })],
      }),
    });
    // B: Phase 1 only (no phase2)
    const bDir = path.join(root, 'b2', OBS_B);
    await mkdir(path.join(bDir, 'js'), { recursive: true });
    await writeFile(
      path.join(bDir, 'observation.json'),
      JSON.stringify({
        observationId: OBS_B,
        buildId: 'b2',
        previousObservationId: OBS_A,
        observedAt: '2026-09-24T13:00:00.000Z',
        artifacts: [{ path: 'js/index-AAAA.js', sha256: 'a'.repeat(64), bytes: 1 }],
      }),
    );
    await writeFile(path.join(bDir, 'js/index-AAAA.js'), '// entry\n');

    const { records, byId } = await scanProcessingRecords({ artifactsRoot: root });
    const backlog = buildBacklog({ records, byId });
    assert.ok(backlog.some((i) => i.observationId === OBS_B && i.needExtract));

    // Simulate B extract by writing inventory, then compare via processOne
    await writeObs({
      artifactsRoot: root,
      observationId: OBS_B,
      buildId: 'b2',
      previousObservationId: OBS_A,
      observedAt: '2026-09-24T13:00:00.000Z',
      evidence: makeEvidenceDoc({
        observationId: OBS_B,
        items: [
          structuredOp({ method: 'GET', path: '/api/v3/a' }),
          structuredOp({ method: 'GET', path: '/api/v3/new' }),
        ],
      }),
    });

    const refreshed = await scanProcessingRecords({ artifactsRoot: root });
    const result = await processOneObservation({
      repoRoot: TMP,
      artifactsRoot: root,
      statePath: path.join(TMP, 'noop-state.json'),
      observation: refreshed.listed.find((o) => o.observationId === OBS_B),
      record: refreshed.byId.get(OBS_B),
      byId: refreshed.byId,
      needExtract: false,
      needCompare: true,
    });
    assert.equal(result.didCompare, true);
    assert.equal(result.compareFailed, false);
    assert.equal(result.record.comparison.status, COMPARISON_STATUS.COMPLETE);

    await writeProcessingIndex({
      artifactsRoot: root,
      records: [result.record, refreshed.byId.get(OBS_A)],
    });
    assert.ok(await exists(path.join(root, PROCESSING_INDEX_FILE)));
  });
});

describe('Phase 2.3.1 hardening — regression cases 1–8', () => {
  it('1. extract ok + compare fail → evidence retained; extract-only commit', async () => {
    assert.equal(COMMIT_STRATEGY.extractDurableIndependentOfCompare, true);
    const root = path.join(TMP, 'h1');
    await writeObs({
      artifactsRoot: root,
      observationId: OBS_A,
      buildId: 'b1',
      previousObservationId: null,
      evidence: makeEvidenceDoc({
        observationId: OBS_A,
        items: [structuredOp({ method: 'GET', path: '/api/v3/a' })],
      }),
    });
    await writeObs({
      artifactsRoot: root,
      observationId: OBS_B,
      buildId: 'b2',
      previousObservationId: OBS_A,
      evidence: makeEvidenceDoc({
        observationId: OBS_B,
        items: [
          structuredOp({ method: 'GET', path: '/api/v3/a' }),
          structuredOp({ method: 'POST', path: '/api/v3/b' }),
        ],
      }),
    });

    // Simulate extract succeeded then compare failed in same run.
    const obsDir = path.join(root, 'b2', OBS_B);
    const afterExtract = await buildProcessingRecord({
      observationDir: obsDir,
      observationId: OBS_B,
      buildId: 'b2',
      previousObservationId: OBS_A,
    });
    assert.equal(afterExtract.extract.status, EXTRACT_STATUS.COMPLETE);
    const failed = {
      ...afterExtract,
      comparison: {
        status: COMPARISON_STATUS.FAILED,
        fromObservationId: OBS_A,
        comparisonStatus: null,
        diffRelPath: null,
        comparedAt: null,
        error: 'simulated compare failure',
        summaryCounts: null,
      },
    };
    await writeProcessingRecord(obsDir, failed);

    // Evidence still on disk
    assert.ok(await exists(path.join(obsDir, 'phase2', 'api-evidence.json')));
    assert.ok(await exists(path.join(obsDir, 'phase2', 'status.json')));

    const plan = buildCommitSequence({
      phase1Append: false,
      phase1CommitMessage: null,
      phase1Paths: [],
      phase2Results: [
        {
          didExtract: true,
          didCompare: false,
          compareFailed: true,
          buildId: 'b2',
          observationId: OBS_B,
          touchedRelPaths: [
            `artifacts/frontend/b2/${OBS_B}/phase2`,
          ],
        },
      ],
      indexPath: `artifacts/frontend/${PROCESSING_INDEX_FILE}`,
    });
    assert.equal(plan.extractDurableDespiteCompareFailure, true);
    assert.equal(plan.commits.length, 1);
    assert.equal(plan.commits[0].step, 'extract');
    assert.match(plan.commits[0].durabilityBoundary, /compare_failed/);
  });

  it('2. next run retries compare only (no re-extract)', async () => {
    const root = path.join(TMP, 'h2');
    await writeObs({
      artifactsRoot: root,
      observationId: OBS_A,
      buildId: 'b1',
      previousObservationId: null,
      evidence: makeEvidenceDoc({
        observationId: OBS_A,
        items: [structuredOp({ method: 'GET', path: '/api/v3/a' })],
      }),
    });
    await writeObs({
      artifactsRoot: root,
      observationId: OBS_B,
      buildId: 'b2',
      previousObservationId: OBS_A,
      evidence: makeEvidenceDoc({
        observationId: OBS_B,
        items: [
          structuredOp({ method: 'GET', path: '/api/v3/a' }),
          structuredOp({ method: 'POST', path: '/api/v3/b' }),
        ],
      }),
    });
    const obsDir = path.join(root, 'b2', OBS_B);
    const base = await buildProcessingRecord({
      observationDir: obsDir,
      observationId: OBS_B,
      buildId: 'b2',
      previousObservationId: OBS_A,
    });
    await writeProcessingRecord(obsDir, {
      ...base,
      comparison: {
        status: COMPARISON_STATUS.FAILED,
        fromObservationId: OBS_A,
        comparisonStatus: null,
        diffRelPath: null,
        comparedAt: null,
        error: 'prior failure',
        summaryCounts: null,
      },
    });

    const { records, byId } = await scanProcessingRecords({ artifactsRoot: root });
    const recB = byId.get(OBS_B);
    assert.equal(extractNeedsWork(recB), false);
    assert.equal(comparisonNeedsWork(recB), true);
    const backlog = buildBacklog({ records, byId });
    const item = backlog.find((i) => i.observationId === OBS_B);
    assert.ok(item);
    assert.equal(item.needExtract, false);
    assert.equal(item.needCompare, true);

    // Actually retry compare successfully
    const result = await processOneObservation({
      repoRoot: TMP,
      artifactsRoot: root,
      statePath: path.join(TMP, 'state.json'),
      observation: {
        observationId: OBS_B,
        buildId: 'b2',
        previousObservationId: OBS_A,
        observationDir: obsDir,
      },
      record: recB,
      byId,
      needExtract: false,
      needCompare: true,
    });
    assert.equal(result.didExtract, false);
    assert.equal(result.didCompare, true);
    assert.equal(result.record.comparison.status, COMPARISON_STATUS.COMPLETE);
  });

  it('3. main has obs B, monitor has evidence B → cleanup forbidden', () => {
    const diffs = [
      `artifacts/frontend/b2/${OBS_B}/phase2/api-evidence.json`,
      `artifacts/frontend/b2/${OBS_B}/phase2/chunk-graph.json`,
      `artifacts/frontend/b2/${OBS_B}/phase2/processing.json`,
      'artifacts/frontend/phase2-processing-index.json',
    ];
    assert.ok(classifyMonitoringPathDiffs(diffs).hasPhase2OnlyPending);
    const a = assessPendingLedger({
      mainObservationId: OBS_B,
      monitorTipObservationId: OBS_B,
      monitoringPathDiffs: diffs,
      commitsAheadOfMain: 0,
    });
    assert.equal(a.fullyLanded, false);
    assert.equal(a.allowResetFromMain, false);
    assert.equal(a.hasUniquePending, true);
    assert.equal(a.phase2OnlyPending, true);
    assert.equal(a.reason, 'phase2_analysis_pending_survives_cleanup');
  });

  it('4. main has obs+evidence B, monitor has A→B report → cleanup forbidden', () => {
    const diffs = [
      `artifacts/frontend/b2/${OBS_B}/phase2/diffs/${OBS_A}/evidence-diff.json`,
      `artifacts/frontend/b2/${OBS_B}/phase2/diffs/${OBS_A}/evidence-diff.md`,
    ];
    assert.ok(diffs.every(isPhase2OwnedPath));
    const a = assessPendingLedger({
      mainObservationId: OBS_B,
      monitorTipObservationId: OBS_B,
      monitoringPathDiffs: diffs,
      commitsAheadOfMain: 2,
    });
    assert.equal(a.allowResetFromMain, false);
    assert.equal(a.fullyLanded, false);
    assert.equal(a.phase2OnlyPending, true);
  });

  it('5. main has all Phase 1+2 → cleanup allowed', () => {
    const a = assessPendingLedger({
      mainObservationId: OBS_B,
      monitorTipObservationId: OBS_B,
      monitoringPathDiffs: [],
      commitsAheadOfMain: 5, // ancestry noise ignored
    });
    assert.equal(a.fullyLanded, true);
    assert.equal(a.allowResetFromMain, true);
    assert.equal(a.hasUniquePending, false);
    assert.equal(a.phase2OnlyPending, false);
  });

  it('6. status complete, artifact missing → fail closed / recovery', async () => {
    const root = path.join(TMP, 'h6');
    const obsDir = path.join(root, 'bx', OBS_B);
    await mkdir(path.join(obsDir, 'phase2'), { recursive: true });
    await writeFile(
      path.join(obsDir, 'observation.json'),
      JSON.stringify({
        observationId: OBS_B,
        buildId: 'bx',
        previousObservationId: OBS_A,
        artifacts: [{ path: 'js/index-AAAA.js', sha256: 'a'.repeat(64) }],
      }),
    );
    // Claim complete without artifacts
    await writeFile(
      path.join(obsDir, 'phase2', 'processing.json'),
      JSON.stringify({
        schemaVersion: 1,
        observationId: OBS_B,
        buildId: 'bx',
        previousObservationId: OBS_A,
        extract: { status: EXTRACT_STATUS.COMPLETE },
        comparison: { status: COMPARISON_STATUS.COMPLETE },
      }),
    );

    const consistency = await validateProcessingConsistency({
      observationDir: obsDir,
      previousObservationId: OBS_A,
      stored: {
        extract: { status: EXTRACT_STATUS.COMPLETE },
        comparison: { status: COMPARISON_STATUS.COMPLETE },
      },
    });
    assert.equal(consistency.outcome, 'fail_closed');

    const reconciled = await readOrDeriveProcessing({
      observationDir: obsDir,
      observationId: OBS_B,
      buildId: 'bx',
      previousObservationId: OBS_A,
    });
    assert.equal(reconciled.extract.status, EXTRACT_STATUS.EXTRACT_FAILED);
    assert.equal(extractNeedsWork(reconciled), true);
  });

  it('7. artifact exists, index/status stale → deterministic reconciliation', async () => {
    const root = path.join(TMP, 'h7');
    await writeObs({
      artifactsRoot: root,
      observationId: OBS_A,
      buildId: 'b1',
      previousObservationId: null,
      evidence: makeEvidenceDoc({
        observationId: OBS_A,
        items: [structuredOp({ method: 'GET', path: '/api/v3/a' })],
      }),
    });
    const obsDir = path.join(root, 'b1', OBS_A);
    // Stale stored claim
    await writeFile(
      path.join(obsDir, 'phase2', 'processing.json'),
      JSON.stringify({
        schemaVersion: 1,
        observationId: OBS_A,
        buildId: 'b1',
        previousObservationId: null,
        extract: { status: EXTRACT_STATUS.NOT_PROCESSED },
        comparison: { status: COMPARISON_STATUS.NOT_APPLICABLE },
      }),
    );

    const consistency = await validateProcessingConsistency({
      observationDir: obsDir,
      previousObservationId: null,
      stored: { extract: { status: EXTRACT_STATUS.NOT_PROCESSED } },
    });
    assert.equal(consistency.outcome, 'repair');

    const reconciled = await readOrDeriveProcessing({
      observationDir: obsDir,
      observationId: OBS_A,
      buildId: 'b1',
      previousObservationId: null,
    });
    assert.equal(reconciled.extract.status, EXTRACT_STATUS.COMPLETE);
    assert.equal(extractNeedsWork(reconciled), false);
  });

  it('8. remote advances with extract during other run → refetch, no dup extract', () => {
    const d = decidePhase2PushRace({
      pushRejected: true,
      remoteAlreadyHasEvidence: false,
      remoteHasExtractOnly: true,
      remoteTipDifferent: false,
      localAttemptedExtract: true,
      localAttemptedCompare: true,
    });
    assert.equal(d.action, 'refetch_continue_compare');
    assert.equal(d.reExtract, false);
    assert.equal(d.retryCompare, true);
    assert.equal(d.forcePush, false);
    assert.equal(d.discardLocalPhase2Mutations, true);

    const tip = decidePhase2PushRace({
      pushRejected: true,
      remoteAlreadyHasEvidence: false,
      remoteHasExtractOnly: false,
      remoteTipDifferent: true,
    });
    assert.equal(tip.action, 'discard_and_reevaluate');
    assert.equal(tip.reExtract, false);
    assert.equal(tip.retryCompare, true);
  });
});
