#!/usr/bin/env node
/**
 * Phase 1.2 monitoring orchestrator — cumulative pending ledger.
 *
 * Every run:
 *   1. Explicitly refresh origin/main (+ monitoring branch if present)
 *   2. Prepare workspace (main, or monitoring tip with main merged in)
 *   3. Run frontend watcher against that baseline
 *   4. Emit machine-readable decision (append commit / open-or-update one PR)
 *
 * Does not force-reset the monitoring branch from main while pending commits exist.
 * Optional --with-gh is informational only; correctness uses fetched git refs.
 *
 * Usage:
 *   node tools/fp-frontend-watch/monitor-orchestrate.mjs [--json] [--with-gh] [--run-tests]
 *   node tools/fp-frontend-watch/monitor-orchestrate.mjs --decision-only ...
 */

import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { EXIT } from './lib/constants.mjs';
import {
  DEFAULT_BRANCH,
  MONITOR_BRANCH,
  PR_TITLE_PREFIX,
} from './lib/monitor-constants.mjs';
import {
  decideAfterMainSync,
  decideMonitorAction,
  decideWorkspacePrep,
  normalizeOpenMonitorPrs,
  selectMonitorPr,
} from './lib/monitor-decision.mjs';
import { formatObservationPrBody } from './lib/monitor-pr-body.mjs';
import {
  checkoutBranch,
  collectPendingObservations,
  git,
  mergeOriginMain,
  readStateFromTreeish,
  readWorkingState,
  refreshMonitoringRefs,
} from './lib/monitor-scm.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..', '..');
const CLI = path.join(__dirname, 'cli.mjs');

async function main(argv) {
  const args = parseArgs(argv);
  if (args.help) {
    printHelp();
    process.exit(0);
  }

  // Pure decision-only path (offline tests / injected fixtures).
  if (args.decisionOnly) {
    const decision = buildDecisionFromInjected(args);
    emit(decision, args);
    process.exit(
      args.failOnFailure && args.exitCode === EXIT.FAILURE ? EXIT.FAILURE : 0,
    );
  }

  // --- Live orchestration ---
  const refreshed = refreshMonitoringRefs(REPO_ROOT);
  if (!refreshed.ok) {
    const decision = decideWorkspacePrep({
      fetchOk: false,
      fetchError: refreshed.error,
    });
    emit(decision, args);
    process.exit(EXIT.FAILURE);
  }

  const pendingCollected = await collectPendingObservations(REPO_ROOT);
  if (!pendingCollected.ok) {
    const decision = {
      schemaVersion: 2,
      action: 'abort',
      reason: 'pending_ledger_inspect_failed',
      runWatcher: false,
      mutateRepo: false,
      error: pendingCollected.error,
      notes: ['Could not inspect pending monitoring commits after fetch. Fail closed.'],
    };
    emit(decision, args);
    process.exit(EXIT.FAILURE);
  }

  let openMonitorPrs = args.openPrsJson || [];
  if (args.withGh) {
    try {
      openMonitorPrs = listOpenMonitorPrsViaGh();
    } catch (err) {
      // gh is optional — continue with git-derived pending ledger.
      console.error(
        `Warning: --with-gh failed (${err instanceof Error ? err.message : err}); continuing with git refs only.`,
      );
    }
  }
  const openMonitorPr = selectMonitorPr(normalizeOpenMonitorPrs(openMonitorPrs));

  const mainState = await readStateFromTreeish(REPO_ROOT, `origin/${DEFAULT_BRANCH}`);
  const monitorState = refreshed.monitorBranchExists
    ? await readStateFromTreeish(REPO_ROOT, `origin/${MONITOR_BRANCH}`)
    : null;

  const prep = decideWorkspacePrep({
    fetchOk: true,
    monitorBranchExists: refreshed.monitorBranchExists,
    monitorHasPendingCommits: pendingCollected.pending.length > 0,
    mainObservationId: mainState?.observationId ?? null,
    monitorTipObservationId: monitorState?.observationId ?? null,
    pendingObservations: pendingCollected.pending,
    openMonitorPr,
  });

  if (prep.action === 'abort' || !prep.runWatcher) {
    emit(prep, args);
    process.exit(EXIT.FAILURE);
  }

  // Prepare checkout
  if (prep.action === 'use_monitor_branch') {
    const co = checkoutBranch(REPO_ROOT, MONITOR_BRANCH);
    if (!co.ok) {
      emit(
        {
          schemaVersion: 2,
          action: 'abort',
          reason: 'checkout_failed',
          runWatcher: false,
          error: co.error,
          notes: ['Failed to checkout monitoring branch after refresh.'],
        },
        args,
      );
      process.exit(EXIT.FAILURE);
    }
    if (prep.syncMainFirst) {
      const merged = mergeOriginMain(REPO_ROOT);
      const syncDecision = decideAfterMainSync({
        syncAttempted: true,
        conflict: merged.conflict,
        conflictPaths: merged.conflictPaths,
        syncError: !merged.ok && !merged.conflict,
        error: merged.error,
      });
      if (syncDecision.action === 'abort') {
        emit({ ...prep, ...syncDecision, phase: 'sync' }, args);
        process.exit(EXIT.FAILURE);
      }
    }
  } else {
    // Authoritative baseline: origin/main
    const co = checkoutBranch(REPO_ROOT, DEFAULT_BRANCH);
    if (!co.ok) {
      const det = spawnSync(
        'git',
        ['checkout', '--detach', `origin/${DEFAULT_BRANCH}`],
        { cwd: REPO_ROOT, encoding: 'utf8' },
      );
      if (det.status !== 0) {
        emit(
          {
            schemaVersion: 2,
            action: 'abort',
            reason: 'checkout_failed',
            runWatcher: false,
            error: co.error || det.stderr || det.stdout,
          },
          args,
        );
        process.exit(EXIT.FAILURE);
      }
    }
    if (prep.resetMonitorFromMain) {
      // Safe only when decideWorkspacePrep said there are no pending commits.
      gitResetMonitorFromMain(REPO_ROOT);
    }
  }

  const baselineState = await readWorkingState(REPO_ROOT);
  const baselineObservationId = baselineState?.observationId ?? prep.expectedBaselineObservationId;

  let testStatus = args.testStatusJson || null;
  if (args.runTests) {
    testStatus = runFrontendWatchTests();
    if (testStatus.status === 'fail') {
      emit(
        {
          schemaVersion: 2,
          action: 'report_failure',
          reason: 'unit_tests_failed',
          runWatcher: false,
          appendObservationCommit: false,
          createPullRequest: false,
          error: testStatus.detail || 'frontend-watch-test failed',
          testStatus,
          notes: ['Unit tests failed before watcher; no observation mutation.'],
        },
        args,
      );
      process.exit(EXIT.FAILURE);
    }
  }

  const ran = runWatcherCheck({ dryRun: args.dryRun });
  const decision = decideMonitorAction({
    exitCode: ran.exitCode,
    checkResult: ran.json,
    baselineObservationId,
    pendingObservations: pendingCollected.pending,
    openMonitorPr,
    testStatus,
    workspaceFromMonitor: prep.action === 'use_monitor_branch',
  });

  attachPrArtifacts(decision, {
    testStatus,
    mainObservationId: mainState?.observationId ?? null,
  });

  emit(decision, args);
  process.exit(
    decision.action === 'abort' || decision.action === 'report_failure'
      ? EXIT.FAILURE
      : ran.exitCode,
  );
}

function buildDecisionFromInjected(args) {
  if (args.phase === 'prep') {
    return decideWorkspacePrep(args.prepJson || args.checkJson || {});
  }
  if (args.phase === 'sync') {
    return decideAfterMainSync(args.syncJson || args.checkJson || {});
  }

  const openMonitorPrs = normalizeOpenMonitorPrs(args.openPrsJson || []);
  const openMonitorPr = selectMonitorPr(openMonitorPrs);
  const decision = decideMonitorAction({
    exitCode: args.exitCode,
    checkResult: args.checkJson,
    baselineObservationId: args.baselineObservationId ?? null,
    pendingObservations: args.pendingJson || [],
    openMonitorPr,
    testStatus: args.testStatusJson || null,
    workspaceFromMonitor: Boolean(args.workspaceFromMonitor),
  });
  attachPrArtifacts(decision, {
    testStatus: args.testStatusJson || null,
    mainObservationId: args.mainObservationId ?? null,
  });
  return decision;
}

function attachPrArtifacts(decision, { testStatus, mainObservationId }) {
  if (
    decision.action !== 'open_monitor_pr' &&
    decision.action !== 'update_monitor_pr'
  ) {
    return;
  }
  decision.prBody = formatObservationPrBody({
    pendingObservations: decision.pendingObservations || [],
    latestCheckSummary: decision.checkSummary,
    watcherResult: 'CHANGE DETECTED (exit 2) — pending ledger updated',
    testStatus,
    extraNotes: decision.notes,
    mainObservationId,
  });
  decision.gitHints = {
    baseBranch: DEFAULT_BRANCH,
    monitorBranch: MONITOR_BRANCH,
    commitMessage: decision.commitMessage,
    forcePush: false,
    appendOnly: true,
    pathsHint: [
      'state/last-known-frontend.json',
      decision.checkSummary?.artifactDir,
    ].filter(Boolean),
  };
}

/** Local tip only — does not force-push; agent/ops may push when appropriate. */
function gitResetMonitorFromMain(repoRoot) {
  git(repoRoot, ['branch', '-f', MONITOR_BRANCH, `origin/${DEFAULT_BRANCH}`]);
}

function emit(decision, args) {
  if (args.json || args.decisionOnly) {
    console.log(JSON.stringify(decision, null, 2));
  } else {
    printHuman(decision);
  }
}

function runWatcherCheck({ dryRun }) {
  const nodeArgs = [CLI, 'check', '--json'];
  if (dryRun) nodeArgs.push('--dry-run');
  const proc = spawnSync(process.execPath, nodeArgs, {
    cwd: REPO_ROOT,
    encoding: 'utf8',
    maxBuffer: 20 * 1024 * 1024,
  });
  const exitCode = proc.status == null ? EXIT.FAILURE : proc.status;
  let json = null;
  const stdout = (proc.stdout || '').trim();
  if (stdout) {
    try {
      json = JSON.parse(stdout);
    } catch {
      json = {
        ok: false,
        error: `Failed to parse watcher JSON stdout: ${stdout.slice(0, 500)}`,
      };
    }
  } else if (exitCode === EXIT.FAILURE) {
    json = {
      ok: false,
      error: (proc.stderr || 'watcher failed with empty stdout').trim().slice(0, 2000),
    };
  }
  return { exitCode, json, stderr: proc.stderr || '' };
}

function runFrontendWatchTests() {
  const proc = spawnSync(
    process.execPath,
    [
      '--test',
      'tests/frontend-watch/frontend-watch.test.mjs',
      'tests/frontend-watch/monitor-orchestrate.test.mjs',
    ],
    { cwd: REPO_ROOT, encoding: 'utf8', maxBuffer: 20 * 1024 * 1024 },
  );
  const ok = proc.status === 0;
  return {
    frontendWatchTest: ok ? 'pass' : 'fail',
    status: ok ? 'pass' : 'fail',
    exitCode: proc.status,
    detail: ok
      ? 'node --test tests/frontend-watch/*.mjs exited 0'
      : (proc.stderr || proc.stdout || '').trim().slice(0, 1000),
  };
}

/**
 * Optional PR discovery. Monitoring correctness must not depend on gh auth.
 */
function listOpenMonitorPrsViaGh() {
  const proc = spawnSync(
    'gh',
    [
      'pr',
      'list',
      '--state',
      'open',
      '--json',
      'number,url,title,body,headRefName,headRefOid',
      '--limit',
      '50',
    ],
    { cwd: REPO_ROOT, encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 },
  );
  if (proc.status !== 0) {
    throw new Error(
      `gh pr list failed (status ${proc.status}): ${(proc.stderr || proc.stdout || '').trim()}`,
    );
  }
  const all = JSON.parse(proc.stdout || '[]');
  return all
    .filter(
      (pr) =>
        pr.headRefName === MONITOR_BRANCH ||
        (pr.title || '').startsWith(PR_TITLE_PREFIX),
    )
    .map((pr) => ({
      number: pr.number,
      url: pr.url,
      title: pr.title,
      body: pr.body,
      headRefName: pr.headRefName,
      headSha: pr.headRefOid || null,
    }));
}

function printHuman(decision) {
  console.log('Floatplane frontend monitor decision');
  console.log('------------------------------------');
  console.log(`action:     ${decision.action}`);
  console.log(`reason:     ${decision.reason}`);
  if (decision.exitCode != null) console.log(`exitCode:   ${decision.exitCode}`);
  if (decision.observationId) console.log(`observation:${decision.observationId}`);
  if (decision.buildId) console.log(`buildId:    ${decision.buildId}`);
  if (decision.previousObservationId)
    console.log(`previous:   ${decision.previousObservationId}`);
  if (decision.openMonitorPr?.url) console.log(`open PR:    ${decision.openMonitorPr.url}`);
  if (decision.error) console.log(`error:      ${decision.error}`);
  if (decision.prTitle) console.log(`prTitle:    ${decision.prTitle}`);
  for (const n of decision.notes || []) console.log(`- ${n}`);
}

function printHelp() {
  console.log(`Floatplane frontend monitor orchestrator (Phase 1.2)

Cumulative pending ledger on ${MONITOR_BRANCH}. Explicitly refreshes
origin/${DEFAULT_BRANCH} (and monitoring branch) every run before watching.

Options:
  --json                 Print decision JSON
  --with-gh              Optional open-PR hints via GitHub CLI (not required for correctness)
  --run-tests            Run frontend-watch unit tests before watcher
  --dry-run              Pass --dry-run to the watcher
  --decision-only        Skip live SCM/watcher; inject fixtures
  --phase prep|sync|watch  With --decision-only (default watch)
  --exit-code <n>        For watch phase
  --check-json <json>    Watcher payload or prep/sync fixture
  --baseline-observation-id <id>
  --pending-json <json>  Already-pending observations (array)
  --open-prs-json <json>
  --prep-json / --sync-json
  --fail-on-failure      With --decision-only, exit 1 when exit-code is 1
  -h, --help
`);
}

function parseArgs(argv) {
  const out = {
    json: false,
    withGh: false,
    runTests: false,
    dryRun: false,
    decisionOnly: false,
    failOnFailure: false,
    help: false,
    phase: 'watch',
    exitCode: null,
    checkJson: null,
    openPrsJson: null,
    testStatusJson: null,
    pendingJson: null,
    prepJson: null,
    syncJson: null,
    baselineObservationId: null,
    mainObservationId: null,
    workspaceFromMonitor: false,
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--json') out.json = true;
    else if (a === '--with-gh') out.withGh = true;
    else if (a === '--run-tests') out.runTests = true;
    else if (a === '--dry-run') out.dryRun = true;
    else if (a === '--decision-only') out.decisionOnly = true;
    else if (a === '--fail-on-failure') out.failOnFailure = true;
    else if (a === '--workspace-from-monitor') out.workspaceFromMonitor = true;
    else if (a === '-h' || a === '--help') out.help = true;
    else if (a === '--phase') out.phase = argv[++i];
    else if (a === '--exit-code') out.exitCode = Number(argv[++i]);
    else if (a === '--check-json') out.checkJson = JSON.parse(argv[++i]);
    else if (a === '--open-prs-json') out.openPrsJson = JSON.parse(argv[++i]);
    else if (a === '--test-status-json') out.testStatusJson = JSON.parse(argv[++i]);
    else if (a === '--pending-json') out.pendingJson = JSON.parse(argv[++i]);
    else if (a === '--prep-json') out.prepJson = JSON.parse(argv[++i]);
    else if (a === '--sync-json') out.syncJson = JSON.parse(argv[++i]);
    else if (a === '--baseline-observation-id') out.baselineObservationId = argv[++i];
    else if (a === '--main-observation-id') out.mainObservationId = argv[++i];
    else {
      console.error(`Unknown option: ${a}`);
      out.help = true;
    }
  }
  if (
    out.decisionOnly &&
    out.phase === 'watch' &&
    (out.exitCode == null || Number.isNaN(out.exitCode))
  ) {
    console.error('--decision-only watch phase requires --exit-code');
    out.help = true;
  }
  return out;
}

main(process.argv.slice(2)).catch((err) => {
  console.error(err);
  process.exit(EXIT.FAILURE);
});
