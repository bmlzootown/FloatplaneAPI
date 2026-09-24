#!/usr/bin/env node
/**
 * Phase 2.3 unified monitoring orchestrator.
 *
 * One scheduled command wrapping:
 *   sync + Phase 1 watch + Phase 2 backlog (extract + compare) + PR update hints
 *
 * Phase 1 remains independently durable:
 *   Observe commit first → then Phase 2 commits. Never one transactional unit.
 *
 * Does NOT run the full unit suite every cycle (--run-tests is opt-in / CI only).
 * Does NOT auto-merge. Does NOT probe authenticated Floatplane APIs.
 *
 * Usage:
 *   node tools/fp-frontend-watch/monitor-phase2-orchestrate.mjs [--json] [--with-gh]
 *   node tools/fp-frontend-watch/monitor-phase2-orchestrate.mjs --decision-only --phase2-json '{...}'
 *   make frontend-monitor-phase2-json
 */

import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { EXIT } from './lib/constants.mjs';
import {
  DEFAULT_BRANCH,
  MONITOR_BRANCH,
  OBSERVE_COMMIT_PREFIX,
} from './lib/monitor-constants.mjs';
import { formatObservationPrBody } from './lib/monitor-pr-body.mjs';
import {
  decidePhase2PushRace,
} from '../fp-frontend-evidence/lib/orchestrate/decision.mjs';
import { runPhase2Backlog } from '../fp-frontend-evidence/lib/orchestrate/run.mjs';
import {
  COMMIT_STRATEGY,
  GROWTH_ESTIMATE,
  ORCHESTRATOR_ID,
  ORCHESTRATOR_VERSION,
} from '../fp-frontend-evidence/lib/orchestrate/constants.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..', '..');
const PHASE1_ORCHESTRATOR = path.join(__dirname, 'monitor-orchestrate.mjs');

async function main(argv) {
  const args = parseArgs(argv);
  if (args.help) {
    printHelp();
    process.exit(0);
  }

  if (args.decisionOnly) {
    const decision = await buildDecisionOnly(args);
    emit(decision, args);
    process.exit(
      decision.action === 'abort' || decision.action === 'report_failure'
        ? EXIT.FAILURE
        : 0,
    );
  }

  // --- Live: Phase 1 orchestrator first (sync + watch) ---
  const phase1 = runPhase1Orchestrator(args);
  if (!phase1.ok && phase1.decision?.action === 'abort') {
    emit(
      wrapUnified({
        action: 'abort',
        reason: phase1.decision.reason || 'phase1_abort',
        phase1: phase1.decision,
        phase2: null,
        error: phase1.decision.error || phase1.error,
        notes: [
          'Phase 1 orchestrator aborted (SCM/sync). Phase 2 backlog not run.',
          ...(phase1.decision.notes || []),
        ],
      }),
      args,
    );
    process.exit(EXIT.FAILURE);
  }

  const phase1Decision = phase1.decision;
  if (!phase1Decision) {
    emit(
      wrapUnified({
        action: 'report_failure',
        reason: 'phase1_decision_parse_failed',
        error: phase1.error || 'Could not parse Phase 1 decision JSON',
        phase1: null,
        phase2: null,
      }),
      args,
    );
    process.exit(EXIT.FAILURE);
  }

  // Phase 1 Observe must be treated as durable before Phase 2 mutations.
  // The agent commits Observe first when appendObservationCommit is true.
  // We still run Phase 2 against on-disk artifacts (including a just-written observation).

  const artifactsRoot = path.join(REPO_ROOT, 'artifacts', 'frontend');
  const statePath = path.join(REPO_ROOT, 'state', 'last-known-frontend.json');

  let phase2;
  try {
    phase2 = await runPhase2Backlog({
      repoRoot: REPO_ROOT,
      artifactsRoot,
      statePath,
      dryRun: Boolean(args.dryRun),
      force: Boolean(args.force),
      phase1Decision,
      openMonitorPr: phase1Decision.openMonitorPr || null,
      hasUniquePendingPhase1: Boolean(
        (phase1Decision.pendingObservations || []).length > 0 ||
          phase1Decision.appendObservationCommit,
      ),
    });
  } catch (err) {
    // Phase 2 failure must NOT imply rolling back Phase 1.
    const decision = wrapUnified({
      action:
        phase1Decision.appendObservationCommit
          ? phase1Decision.action
          : 'report_failure',
      reason: 'phase2_failed_phase1_preserved',
      phase1: phase1Decision,
      phase2: null,
      error: err instanceof Error ? err.message : String(err),
      commitSequence: {
        commitStrategy: COMMIT_STRATEGY,
        commits: phase1Decision.appendObservationCommit
          ? [
              {
                step: 'observe',
                phase: 'phase1',
                message:
                  phase1Decision.commitMessage ||
                  `${OBSERVE_COMMIT_PREFIX} ${phase1Decision.buildId || ''}`.trim(),
                paths: [
                  'state/last-known-frontend.json',
                  phase1Decision.checkSummary?.artifactDir,
                ].filter(Boolean),
              },
            ]
          : [],
        notes: [
          'Phase 2 failed; commit Phase 1 Observe if pending, then stop. Retry Phase 2 next run.',
        ],
      },
      notes: [
        'Phase 2 backlog failed. Phase 1 observation (if any) remains durable — commit Observe, do not roll back.',
        err instanceof Error ? err.message : String(err),
      ],
    });
    attachPrBody(decision, phase1Decision, null);
    emit(decision, args);
    process.exit(EXIT.FAILURE);
  }

  const unified = wrapUnified({
    action: phase2.action || phase1Decision.action,
    reason: phase2.reason || phase1Decision.reason,
    phase1: phase1Decision,
    phase2,
    commitSequence: phase2.commitSequence,
    analyses: phase2.analyses,
    createPullRequest: phase2.createPullRequest,
    updatePullRequest: phase2.updatePullRequest,
    appendObservationCommit: Boolean(phase1Decision.appendObservationCommit),
    appendPhase2Commits: Boolean(phase2.appendPhase2Commits),
    openMonitorPr: phase1Decision.openMonitorPr || null,
    pendingObservations: phase1Decision.pendingObservations || [],
    prTitle: phase1Decision.prTitle || null,
    monitorBranch: MONITOR_BRANCH,
    defaultBranch: DEFAULT_BRANCH,
    forcePush: false,
    runFullUnitSuite: false,
    pushRacePolicy: 'ff_only_refetch_noop_discard_stale_phase2',
    notes: [
      ...(phase1Decision.notes || []),
      ...(phase2.notes || []),
      'Commit order: Observe (if any) → Phase 2 Extract/Compare units → open/update PR body.',
      'Do not run make frontend-*-test on routine scheduled cycles.',
      GROWTH_ESTIMATE.note,
    ],
  });

  attachPrBody(unified, phase1Decision, phase2);
  emit(unified, args);

  const failed =
    unified.action === 'abort' ||
    unified.action === 'report_failure' ||
    phase1Decision.action === 'report_failure' ||
    phase1Decision.action === 'abort' ||
    (phase2.results || []).some((r) => r.extractFailed || r.compareFailed);

  process.exit(failed && !phase1Decision.appendObservationCommit ? EXIT.FAILURE : 0);
}

function wrapUnified(fields) {
  return {
    schemaVersion: 3,
    orchestratorId: ORCHESTRATOR_ID,
    orchestratorVersion: ORCHESTRATOR_VERSION,
    commitStrategy: COMMIT_STRATEGY,
    growthEstimate: GROWTH_ESTIMATE,
    mutateDefaultBranch: false,
    neverRewriteMain: true,
    forcePush: false,
    runFullUnitSuite: false,
    ...fields,
  };
}

function attachPrBody(unified, phase1Decision, phase2) {
  const pending = phase1Decision?.pendingObservations || [];
  const analyses = phase2?.analyses || unified.analyses || [];
  const shouldBody =
    unified.createPullRequest ||
    unified.updatePullRequest ||
    phase1Decision?.createPullRequest ||
    phase1Decision?.updatePullRequest ||
    analyses.length > 0;

  if (!shouldBody && unified.action === 'noop') return;

  unified.prTitle =
    phase1Decision?.prTitle ||
    unified.prTitle ||
    (pending[pending.length - 1]?.buildId
      ? `Floatplane frontend observation: ${pending[pending.length - 1].buildId}`
      : 'Floatplane frontend observation: phase2 analysis');

  unified.prBody = formatObservationPrBody({
    pendingObservations: pending,
    latestCheckSummary: phase1Decision?.checkSummary || null,
    watcherResult:
      phase1Decision?.action === 'noop'
        ? 'UNCHANGED (exit 0) — Phase 2 backlog may still update analysis'
        : phase1Decision?.action === 'report_failure'
          ? 'WATCHER FAILURE — Phase 1 not mutated; Phase 2 may still report backlog status'
          : 'CHANGE DETECTED (exit 2) — pending ledger updated',
    testStatus: null,
    extraNotes: unified.notes || [],
    mainObservationId: phase1Decision?.checkSummary
      ? null
      : null,
    phase2Analyses: analyses,
    includePhase2: true,
  });
}

function runPhase1Orchestrator(args) {
  const nodeArgs = [PHASE1_ORCHESTRATOR, '--json'];
  if (args.withGh) nodeArgs.push('--with-gh');
  if (args.dryRun) nodeArgs.push('--dry-run');
  // Never pass --run-tests on the scheduled path.
  if (args.runTests) nodeArgs.push('--run-tests');

  const proc = spawnSync(process.execPath, nodeArgs, {
    cwd: REPO_ROOT,
    encoding: 'utf8',
    maxBuffer: 20 * 1024 * 1024,
  });

  const stdout = (proc.stdout || '').trim();
  let decision = null;
  if (stdout) {
    try {
      decision = JSON.parse(stdout);
    } catch (err) {
      return {
        ok: false,
        decision: null,
        error: `Phase 1 JSON parse failed: ${err instanceof Error ? err.message : err}`,
        stderr: proc.stderr || '',
      };
    }
  }

  return {
    ok: proc.status === 0 || decision?.action === 'noop' || decision?.appendObservationCommit,
    decision,
    error: proc.status !== 0 && !decision ? (proc.stderr || '').trim() : null,
    exitCode: proc.status,
    stderr: proc.stderr || '',
  };
}

async function buildDecisionOnly(args) {
  if (args.phase === 'push-race' || args.phase === 'race') {
    return wrapUnified({
      action: 'phase2_push_race',
      phase2PushRace: decidePhase2PushRace(args.raceJson || args.phase2Json || {}),
    });
  }

  if (args.phase === 'phase2' || args.phase2Json) {
    const fixture = args.phase2Json || {};
    const phase1Decision = fixture.phase1Decision || args.phase1Json || {
      action: 'noop',
      reason: 'unchanged',
      appendObservationCommit: false,
      pendingObservations: [],
    };

    // Decision-only may inject precomputed phase2 results without touching disk.
    if (fixture.precomputed) {
      const unified = wrapUnified({
        action: fixture.action || 'noop',
        reason: fixture.reason || 'precomputed',
        phase1: phase1Decision,
        phase2: fixture.precomputed,
        commitSequence: fixture.precomputed.commitSequence,
        analyses: fixture.precomputed.analyses || [],
        createPullRequest: fixture.precomputed.createPullRequest,
        updatePullRequest: fixture.precomputed.updatePullRequest,
        notes: fixture.notes || [],
      });
      attachPrBody(unified, phase1Decision, fixture.precomputed);
      return unified;
    }

    const artifactsRoot = path.resolve(
      REPO_ROOT,
      fixture.artifactsRoot || 'artifacts/frontend',
    );
    const statePath = path.resolve(
      REPO_ROOT,
      fixture.statePath || 'state/last-known-frontend.json',
    );

    const phase2 = await runPhase2Backlog({
      repoRoot: REPO_ROOT,
      artifactsRoot,
      statePath,
      dryRun: fixture.dryRun !== false,
      force: Boolean(fixture.force),
      skipProcess: Boolean(fixture.skipProcess),
      phase1Decision,
      openMonitorPr: fixture.openMonitorPr || phase1Decision.openMonitorPr || null,
      hasUniquePendingPhase1: Boolean(fixture.hasUniquePendingPhase1),
      fetchImpl: fixture.fetchImpl,
      localBodies: fixture.localBodies,
    });

    const unified = wrapUnified({
      action: phase2.action,
      reason: phase2.reason,
      phase1: phase1Decision,
      phase2,
      commitSequence: phase2.commitSequence,
      analyses: phase2.analyses,
      createPullRequest: phase2.createPullRequest,
      updatePullRequest: phase2.updatePullRequest,
      notes: phase2.notes,
    });
    attachPrBody(unified, phase1Decision, phase2);
    return unified;
  }

  return wrapUnified({
    action: 'report_failure',
    reason: 'decision_only_needs_phase',
    error: 'Use --phase phase2|race with fixtures',
  });
}

function emit(decision, args) {
  if (args.json || args.decisionOnly) {
    console.log(JSON.stringify(decision, null, 2));
  } else {
    printHuman(decision);
  }
}

function printHuman(decision) {
  console.log('Floatplane frontend monitor + Phase 2.3');
  console.log('---------------------------------------');
  console.log(`action:  ${decision.action}`);
  console.log(`reason:  ${decision.reason}`);
  console.log(`phase1:  ${decision.phase1?.action || '(none)'}`);
  console.log(`phase2:  ${decision.phase2?.action || decision.phase2?.reason || '(none)'}`);
  const commits = decision.commitSequence?.commits || [];
  if (commits.length) {
    console.log('commits:');
    for (const c of commits) {
      console.log(`  - [${c.phase}/${c.step}] ${c.message}`);
    }
  }
  for (const n of decision.notes || []) console.log(`- ${n}`);
}

function printHelp() {
  console.log(`Floatplane Phase 2.3 unified monitor orchestrator

Wraps Phase 1.2 sync+watch with Phase 2 backlog extract+compare.

Options:
  --json              Print unified decision JSON
  --with-gh           Optional (passed to Phase 1 orchestrator)
  --dry-run           Dry-run Phase 1 watcher + Phase 2 promote
  --force             Force re-extract/re-compare
  --run-tests         Opt-in only (NOT for scheduled 6h runs)
  --decision-only     Offline fixtures
  --phase phase2|race
  --phase2-json <json>
  --phase1-json <json>
  --race-json <json>
  -h, --help
`);
}

function parseArgs(argv) {
  const out = {
    json: false,
    withGh: false,
    dryRun: false,
    force: false,
    runTests: false,
    decisionOnly: false,
    help: false,
    phase: 'live',
    phase2Json: null,
    phase1Json: null,
    raceJson: null,
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--json') out.json = true;
    else if (a === '--with-gh') out.withGh = true;
    else if (a === '--dry-run') out.dryRun = true;
    else if (a === '--force') out.force = true;
    else if (a === '--run-tests') out.runTests = true;
    else if (a === '--decision-only') out.decisionOnly = true;
    else if (a === '-h' || a === '--help') out.help = true;
    else if (a === '--phase') out.phase = argv[++i];
    else if (a === '--phase2-json') out.phase2Json = JSON.parse(argv[++i]);
    else if (a === '--phase1-json') out.phase1Json = JSON.parse(argv[++i]);
    else if (a === '--race-json') out.raceJson = JSON.parse(argv[++i]);
    else {
      console.error(`Unknown option: ${a}`);
      out.help = true;
    }
  }
  return out;
}

main(process.argv.slice(2)).catch((err) => {
  console.error(err);
  process.exit(EXIT.FAILURE);
});
