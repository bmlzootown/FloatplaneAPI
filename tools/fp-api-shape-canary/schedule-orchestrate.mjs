#!/usr/bin/env node
/**
 * Phase 3.1 — scheduled authenticated API response-shape orchestrator.
 *
 * Separate lane from Phase 1/2 frontend watch (does not touch PROMPT.md).
 *
 * Flow:
 *   1. ensureAuth (refresh_token + DPoP when needed)
 *   2. allowlisted capture → structural diff vs committed baselines
 *   3. emit decision JSON: noop | open_shape_pr | update_shape_pr | needs_auth | report_failure
 *
 * Does not auto-edit OpenAPI. Does not create Cursor timer subscriptions.
 *
 * Usage:
 *   node tools/fp-api-shape-canary/schedule-orchestrate.mjs --json
 *   node tools/fp-api-shape-canary/schedule-orchestrate.mjs --decision-only --capture-json '{...}'
 *   make api-shape-schedule-json
 */

import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  DEFAULT_ARTIFACTS_ROOT,
  DEFAULT_AUTH_FILE,
  DEFAULT_TOKEN_FILE,
  EXIT,
  OIDC,
  SHAPE_DEFAULT_BRANCH,
  SHAPE_MONITOR_BRANCH,
  SHAPE_PR_TITLE_PREFIX,
  TOOL_ID,
  TOOL_VERSION,
} from './lib/constants.mjs';
import { decideShapeMonitorAction, formatShapePrBody } from './lib/schedule-decision.mjs';
import { ensureAuthSession, runCapture } from './lib/run.mjs';
import { notifyFromDecision } from '../fp-notify/lib/notify.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..', '..');
const ORCHESTRATOR_ID = 'fp-api-shape-schedule';
const ORCHESTRATOR_VERSION = '3.1.1';
/** Cap path samples embedded in decision JSON for Fluxer alerts / PR bodies. */
const PATH_SAMPLE_CAP = 12;

/**
 * Counts + capped path samples for alerts (no response bodies).
 * @param {object} d
 */
function summarizeEndpointDiff(d) {
  const added = d.added || [];
  const removed = d.removed || [];
  const typeChanged = d.typeChanged || [];
  return {
    hasDrift: Boolean(d.hasDrift),
    addedCount: added.length,
    removedCount: removed.length,
    typeChangedCount: typeChanged.length,
    // Keep array fields for notifier examples; also expose counts for older readers.
    added: added.slice(0, PATH_SAMPLE_CAP),
    removed: removed.slice(0, PATH_SAMPLE_CAP),
    typeChanged: typeChanged.slice(0, PATH_SAMPLE_CAP),
    truncated:
      added.length > PATH_SAMPLE_CAP ||
      removed.length > PATH_SAMPLE_CAP ||
      typeChanged.length > PATH_SAMPLE_CAP,
    note: d.note || undefined,
  };
}

async function main(argv) {
  const args = parseArgs(argv);
  if (args.help) {
    printHelp();
    process.exit(0);
  }

  if (args.decisionOnly) {
    const capture = args.captureJson ? JSON.parse(args.captureJson) : null;
    const auth = args.authJson ? JSON.parse(args.authJson) : { ok: true, refreshed: false };
    const decision = decideShapeMonitorAction({
      auth,
      capture,
      openShapePrs: args.openPrsJson || [],
      nowIso: args.nowIso || new Date().toISOString(),
    });
    attachPrArtifacts(decision);
    const wrapped = wrap(decision);
    if (args.notify) {
      wrapped.notify = await maybeNotify(wrapped, args);
    }
    emit(wrapped, args);
    process.exit(mapExit(decision));
  }

  const authFile = path.resolve(REPO_ROOT, args.authFile || DEFAULT_AUTH_FILE);
  const tokenFile = path.resolve(REPO_ROOT, args.tokenFile || DEFAULT_TOKEN_FILE);
  const artifactsRoot = path.resolve(REPO_ROOT, args.artifacts || DEFAULT_ARTIFACTS_ROOT);

  const auth = await ensureAuthSession({
    authFile,
    tokenFile,
    forceRefresh: Boolean(args.forceRefresh),
  });

  if (!auth.ok) {
    const decision = decideShapeMonitorAction({
      auth,
      capture: null,
      openShapePrs: args.openPrsJson || [],
      nowIso: new Date().toISOString(),
    });
    attachPrArtifacts(decision);
    const wrapped = wrap(decision);
    if (args.notify) {
      wrapped.notify = await maybeNotify(wrapped, args);
    }
    emit(wrapped, args);
    process.exit(mapExit(decision));
  }

  const capture = await runCapture({
    artifactsRoot,
    accessToken: auth.session.accessToken,
    dpopKeyPair: auth.session.dpopKeyPair,
    includeOptionalVideo: Boolean(args.includeVideo),
    unauthList: Boolean(args.withUnauthList),
    promoteBaselines: false,
    dryRun: Boolean(args.dryRun),
  });

  const decision = decideShapeMonitorAction({
    auth,
    capture: summarizeCapture(capture),
    openShapePrs: args.openPrsJson || [],
    nowIso: new Date().toISOString(),
  });
  attachPrArtifacts(decision, capture);
  const wrapped = wrap(decision, { auth, capture });
  if (args.notify) {
    wrapped.notify = await maybeNotify(wrapped, args);
  }
  emit(wrapped, args);
  process.exit(mapExit(decision));
}

function summarizeCapture(capture) {
  return {
    exitCode: capture.exitCode,
    captureId: capture.captureId,
    dir: capture.dir,
    endpointIds: Object.keys(capture.trees || {}),
    notes: capture.notes || [],
    errors: capture.errors || [],
    hasDrift: Boolean(capture.diff?.hasDrift),
    firstCapture: Boolean(capture.diff?.firstCapture),
    byEndpoint: capture.diff?.byEndpoint
      ? Object.fromEntries(
          Object.entries(capture.diff.byEndpoint).map(([id, d]) => [
            id,
            summarizeEndpointDiff(d),
          ]),
        )
      : {},
    calls: (capture.calls || []).map((c) => ({
      id: c.id,
      status: c.status,
      ok: c.ok,
      auth: c.auth,
    })),
  };
}

async function maybeNotify(decision, args) {
  try {
    return await notifyFromDecision({
      decision,
      prUrl: args.prUrl || decision.existingPr?.url || null,
      notifyOnAuth: Boolean(args.notifyAuth),
      dryRun: Boolean(args.notifyDryRun),
    });
  } catch (err) {
    return {
      notified: false,
      skipped: true,
      reason: 'notify-error',
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

function attachPrArtifacts(decision, capture = null) {
  if (decision.action !== 'open_shape_pr' && decision.action !== 'update_shape_pr') {
    return;
  }
  decision.branch = SHAPE_MONITOR_BRANCH;
  decision.baseBranch = SHAPE_DEFAULT_BRANCH;
  decision.prTitle =
    decision.prTitle ||
    `${SHAPE_PR_TITLE_PREFIX} structural drift ${decision.captureId || ''}`.trim();
  decision.prBody = formatShapePrBody({
    decision,
    captureSummary: decision.capture || summarizeCapture(capture || {}),
  });
  decision.gitHints = {
    branch: SHAPE_MONITOR_BRANCH,
    base: SHAPE_DEFAULT_BRANCH,
    paths: [
      capture?.dir,
      'artifacts/api-shape/baselines/',
    ].filter(Boolean),
    commitMessage: decision.commitMessage,
  };
}

function wrap(decision, extra = {}) {
  return {
    schemaVersion: 1,
    orchestratorId: ORCHESTRATOR_ID,
    orchestratorVersion: ORCHESTRATOR_VERSION,
    toolId: TOOL_ID,
    toolVersion: TOOL_VERSION,
    oidc: {
      issuer: OIDC.issuer,
      clientId: OIDC.clientId,
      scheduleScope: OIDC.scheduleScope,
    },
    separateFromFrontendWatch: true,
    ...decision,
    authLifetime: extra.auth?.lifetime || decision.authLifetime || null,
  };
}

function emit(decision, args) {
  if (args.json || args.decisionOnly) {
    console.log(JSON.stringify(decision, null, 2));
    return;
  }
  console.log('Floatplane API shape schedule decision');
  console.log(`action:  ${decision.action}`);
  console.log(`reason:  ${decision.reason}`);
  for (const n of decision.notes || []) console.log(`note: ${n}`);
  if (decision.error) console.error(`error: ${decision.error}`);
}

function mapExit(decision) {
  if (decision.action === 'needs_auth') return EXIT.NEEDS_AUTH;
  if (decision.action === 'noop') return EXIT.SUCCESS;
  if (decision.action === 'open_shape_pr' || decision.action === 'update_shape_pr') {
    return EXIT.DRIFT;
  }
  return EXIT.FAILURE;
}

function printHelp() {
  console.log(`Usage: node tools/fp-api-shape-canary/schedule-orchestrate.mjs [options]

Scheduled capture → structural baseline diff → decision JSON.
Separate from Phase 1/2 frontend Automation (do not edit that PROMPT).

Options:
  --json                 Emit decision JSON
  --force-refresh        Always refresh_token before capture
  --include-video        Optional content/video probe
  --with-unauth-list     Also snapshot unauth creator list
  --dry-run              Capture without writing artifacts
  --auth-file <path>     Default: ${DEFAULT_AUTH_FILE}
  --token-file <path>    Default: ${DEFAULT_TOKEN_FILE}
  --artifacts <dir>      Default: ${DEFAULT_ARTIFACTS_ROOT}
  --decision-only        Offline: build decision from injected JSON
  --capture-json <json>  For --decision-only
  --auth-json <json>     For --decision-only
  --open-prs-json <json> Injected open shape PRs [{number,url,headRefName}]
  --notify               After decision: Fluxer webhook on change (see tools/fp-notify)
  --notify-auth          Also notify on needs_auth
  --notify-dry-run       Build/resolve notify without POSTing
  --pr-url <url>         PR URL to attach when notifying
  --help
`);
}

function parseArgs(argv) {
  const args = {
    help: false,
    json: false,
    dryRun: false,
    forceRefresh: false,
    includeVideo: false,
    withUnauthList: false,
    decisionOnly: false,
    notify: false,
    notifyAuth: false,
    notifyDryRun: false,
    prUrl: null,
    authFile: null,
    tokenFile: null,
    artifacts: null,
    captureJson: null,
    authJson: null,
    openPrsJson: null,
    nowIso: null,
  };
  const rest = [...argv];
  while (rest.length) {
    const a = rest.shift();
    if (a === '--help' || a === '-h') args.help = true;
    else if (a === '--json') args.json = true;
    else if (a === '--dry-run') args.dryRun = true;
    else if (a === '--force-refresh') args.forceRefresh = true;
    else if (a === '--include-video') args.includeVideo = true;
    else if (a === '--with-unauth-list') args.withUnauthList = true;
    else if (a === '--decision-only') args.decisionOnly = true;
    else if (a === '--notify') args.notify = true;
    else if (a === '--notify-auth') args.notifyAuth = true;
    else if (a === '--notify-dry-run') {
      args.notify = true;
      args.notifyDryRun = true;
    } else if (a === '--pr-url') args.prUrl = rest.shift();
    else if (a === '--auth-file') args.authFile = rest.shift();
    else if (a === '--token-file') args.tokenFile = rest.shift();
    else if (a === '--artifacts') args.artifacts = rest.shift();
    else if (a === '--capture-json') args.captureJson = rest.shift();
    else if (a === '--auth-json') args.authJson = rest.shift();
    else if (a === '--open-prs-json') args.openPrsJson = JSON.parse(rest.shift());
    else if (a === '--now-iso') args.nowIso = rest.shift();
    else {
      console.error(`Unknown option: ${a}`);
      args.help = true;
    }
  }
  return args;
}

main(process.argv.slice(2)).catch((err) => {
  console.error(`${ORCHESTRATOR_ID} error: ${err?.message || err}`);
  process.exit(EXIT.FAILURE);
});
