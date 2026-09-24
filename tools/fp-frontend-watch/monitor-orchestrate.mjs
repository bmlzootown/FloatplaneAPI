#!/usr/bin/env node
/**
 * Phase 1.2 monitoring orchestrator.
 *
 * Runs the existing frontend watcher as source of truth, then emits a
 * machine-readable decision for Cursor Automation (or a human operator).
 *
 * Does not open PRs itself (Cloud Agent / Automation owns git PR tools).
 * Optional --with-gh inspects open monitoring PRs via `gh` for duplicate suppression.
 *
 * Usage:
 *   node tools/fp-frontend-watch/monitor-orchestrate.mjs [--json] [--with-gh] [--skip-check]
 *   node tools/fp-frontend-watch/monitor-orchestrate.mjs --decision-only --exit-code N --check-json '{...}'
 *
 * Exit codes mirror the watcher when a check is run (0/1/2), except
 * decision-only mode always exits 0 after printing the decision unless --fail-on-failure.
 */

import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { EXIT } from './lib/constants.mjs';
import {
  MONITOR_BRANCH,
  PR_TITLE_PREFIX,
} from './lib/monitor-constants.mjs';
import { decideMonitorAction, normalizeOpenMonitorPrs } from './lib/monitor-decision.mjs';
import { formatObservationPrBody } from './lib/monitor-pr-body.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..', '..');
const CLI = path.join(__dirname, 'cli.mjs');

async function main(argv) {
  const args = parseArgs(argv);
  if (args.help) {
    printHelp();
    process.exit(0);
  }

  let exitCode;
  let checkResult;

  if (args.decisionOnly) {
    exitCode = args.exitCode;
    checkResult = args.checkJson;
  } else {
    const ran = runWatcherCheck({ dryRun: args.dryRun });
    exitCode = ran.exitCode;
    checkResult = ran.json;
  }

  let openMonitorPrs = args.openPrsJson || [];
  if (args.withGh && !args.decisionOnly) {
    openMonitorPrs = listOpenMonitorPrsViaGh();
  }
  openMonitorPrs = normalizeOpenMonitorPrs(openMonitorPrs);

  let testStatus = args.testStatusJson || null;
  if (args.runTests) {
    testStatus = runFrontendWatchTests();
  }

  const decision = decideMonitorAction({
    exitCode,
    checkResult,
    openMonitorPrs,
    testStatus,
  });

  if (
    decision.action === 'open_monitor_pr' ||
    decision.action === 'update_monitor_pr'
  ) {
    decision.prBody = formatObservationPrBody({
      checkSummary: decision.checkSummary,
      watcherResult: 'CHANGE DETECTED (exit 2)',
      testStatus,
      supersede:
        decision.reason === 'supersede_unmerged_observation'
          ? {
              previousOpenObservationId: decision.previousOpenObservationId,
              previousOpenBuildId: decision.previousOpenBuildId,
              previousHeadSha: decision.openMonitorPr?.headSha ?? null,
            }
          : null,
      extraNotes: decision.notes,
    });
    decision.gitHints = {
      baseBranch: 'main',
      monitorBranch: MONITOR_BRANCH,
      commitMessage: `Floatplane frontend observation ${decision.buildId} (${String(decision.observationId).slice(0, 12)})`,
      pathsHint: [
        'state/last-known-frontend.json',
        decision.checkSummary?.artifactDir,
        'Any carried-forward prior unmerged artifact dirs under artifacts/frontend/ (update case only)',
      ].filter(Boolean),
    };
  }

  if (args.json || args.decisionOnly) {
    console.log(JSON.stringify(decision, null, 2));
  } else {
    printHuman(decision);
  }

  if (args.decisionOnly) {
    process.exit(args.failOnFailure && exitCode === EXIT.FAILURE ? EXIT.FAILURE : 0);
  }
  process.exit(exitCode);
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
    ['--test', 'tests/frontend-watch/frontend-watch.test.mjs'],
    { cwd: REPO_ROOT, encoding: 'utf8', maxBuffer: 20 * 1024 * 1024 },
  );
  const ok = proc.status === 0;
  return {
    frontendWatchTest: ok ? 'pass' : 'fail',
    status: ok ? 'pass' : 'fail',
    exitCode: proc.status,
    detail: ok ? 'node --test tests/frontend-watch/*.mjs exited 0' : (proc.stderr || proc.stdout || '').trim().slice(0, 1000),
  };
}

/**
 * List open PRs on the monitoring branch or with the observation title prefix.
 * Requires GitHub CLI (`gh`) authenticated for the repo.
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
  console.log(`exitCode:   ${decision.exitCode}`);
  if (decision.observationId) console.log(`observation:${decision.observationId}`);
  if (decision.buildId) console.log(`buildId:    ${decision.buildId}`);
  if (decision.openMonitorPr?.url) {
    console.log(`open PR:    ${decision.openMonitorPr.url}`);
  }
  if (decision.error) console.log(`error:      ${decision.error}`);
  if (decision.prTitle) console.log(`prTitle:    ${decision.prTitle}`);
  for (const n of decision.notes || []) console.log(`- ${n}`);
}

function printHelp() {
  console.log(`Floatplane frontend monitor orchestrator (Phase 1.2)

Runs tools/fp-frontend-watch/cli.mjs check --json, then prints a decision for
Cursor Automation duplicate-PR suppression / update behavior.

Options:
  --json              Print decision JSON (default when piping; always for automation)
  --with-gh           Query open monitoring PRs via GitHub CLI
  --run-tests         Also run make frontend-watch-test and attach status
  --dry-run           Pass --dry-run to the watcher (no state/artifact writes)
  --decision-only     Skip live check; require --exit-code and --check-json
  --exit-code <n>     For --decision-only
  --check-json <json> For --decision-only
  --open-prs-json <json>  Inject open PR list (tests / offline)
  --fail-on-failure   With --decision-only, exit 1 when exit-code is 1
  -h, --help          Show help

Monitoring branch: ${MONITOR_BRANCH}
PR title prefix:   ${PR_TITLE_PREFIX} <buildId>
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
    exitCode: null,
    checkJson: null,
    openPrsJson: null,
    testStatusJson: null,
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--json') out.json = true;
    else if (a === '--with-gh') out.withGh = true;
    else if (a === '--run-tests') out.runTests = true;
    else if (a === '--dry-run') out.dryRun = true;
    else if (a === '--decision-only') out.decisionOnly = true;
    else if (a === '--fail-on-failure') out.failOnFailure = true;
    else if (a === '-h' || a === '--help') out.help = true;
    else if (a === '--exit-code') out.exitCode = Number(argv[++i]);
    else if (a === '--check-json') out.checkJson = JSON.parse(argv[++i]);
    else if (a === '--open-prs-json') out.openPrsJson = JSON.parse(argv[++i]);
    else if (a === '--test-status-json') out.testStatusJson = JSON.parse(argv[++i]);
    else {
      console.error(`Unknown option: ${a}`);
      out.help = true;
    }
  }
  if (out.decisionOnly && (out.exitCode == null || Number.isNaN(out.exitCode))) {
    console.error('--decision-only requires --exit-code');
    out.help = true;
  }
  return out;
}

main(process.argv.slice(2)).catch((err) => {
  console.error(err);
  process.exit(EXIT.FAILURE);
});
