#!/usr/bin/env node
/**
 * Phase 3.1 — authenticated API response-shape canary CLI
 *
 * Commands:
 *   device-login     Keycloak OIDC device flow (human approves); writes auth session
 *   refresh          Force refresh_token grant (DPoP); update local auth file
 *   ensure-auth      Refresh if access near expiry; exit 3 if re-login needed
 *   probe-refresh    Rolling-refresh evidence (redacted lifetimes only)
 *   capture          Allowlisted GETs → field-tree capture + structural diff
 *   diff-trees       Offline structural diff of two .schema.json trees
 *   unauth-list      Companion: unauthenticated GET /api/v3/content/creator field tree
 *
 * Exit codes:
 *   0 success / no drift
 *   1 operational failure
 *   2 structural drift vs baseline
 *   3 needs human auth / missing token
 *
 * Never invent tokens. Never commit secrets. Bodies are not stored by default.
 */

import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import {
  DEFAULT_ARTIFACTS_ROOT,
  DEFAULT_AUTH_FILE,
  DEFAULT_TOKEN_FILE,
  EXIT,
  OIDC,
  TOOL_ID,
  TOOL_VERSION,
} from './lib/constants.mjs';
import { redactAuthLifetime } from './lib/auth-refresh.mjs';
import { persistAuthToStore } from './lib/auth-store.mjs';
import { discoverOidc, requestDeviceAuthorization, pollDeviceToken } from './lib/device-flow.mjs';
import { generateDpopKeyPair } from './lib/dpop.mjs';
import { diffFieldTrees, formatDiffReportMarkdown } from './lib/diff.mjs';
import {
  ensureAuthSession,
  resolveAuthSession,
  runCapture,
  writeAuthFile,
  writeTokenFile,
} from './lib/run.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..', '..');

async function main(argv) {
  const args = parseArgs(argv);
  if (args.help || !args.command) {
    printHelp();
    process.exit(args.help ? 0 : EXIT.FAILURE);
  }

  try {
    if (args.command === 'device-login') {
      await cmdDeviceLogin(args);
      return;
    }
    if (args.command === 'refresh' || args.command === 'ensure-auth') {
      await cmdEnsureAuth(args, { forceRefresh: args.command === 'refresh' || args.forceRefresh });
      return;
    }
    if (args.command === 'probe-refresh') {
      await cmdProbeRefresh(args);
      return;
    }
    if (args.command === 'capture') {
      await cmdCapture(args);
      return;
    }
    if (args.command === 'unauth-list') {
      await cmdUnauthList(args);
      return;
    }
    if (args.command === 'diff-trees') {
      await cmdDiffTrees(args);
      return;
    }
    console.error(`Unknown command: ${args.command}`);
    printHelp();
    process.exit(EXIT.FAILURE);
  } catch (err) {
    console.error(`${TOOL_ID} error: ${err?.message || err}`);
    process.exit(EXIT.FAILURE);
  }
}

/** @param {ReturnType<typeof parseArgs>} args */
async function cmdDeviceLogin(args) {
  const discovery = await discoverOidc();
  if (args.json) {
    // discovery endpoints only — no secrets
    console.log(
      JSON.stringify(
        {
          issuer: discovery.issuer,
          deviceAuthorizationEndpoint: discovery.deviceAuthorizationEndpoint,
          tokenEndpoint: discovery.tokenEndpoint,
          clientId: args.clientId || OIDC.clientId,
          scope: args.scope || OIDC.defaultScope,
        },
        null,
        2,
      ),
    );
  }

  console.error(`OIDC issuer: ${discovery.issuer}`);
  console.error(`client_id: ${args.clientId || OIDC.clientId} (frontend evidence: fp-tv-app)`);
  console.error(`scope: ${args.scope || OIDC.defaultScope}`);
  console.error('security: PKCE S256 + DPoP ES256 (usesExtendedSecurity)');

  const started = await requestDeviceAuthorization({
    discovery,
    clientId: args.clientId || OIDC.clientId,
    scope: args.scope || OIDC.defaultScope,
  });

  // Emit a single machine-parseable line early so operators/agents can request approval ASAP.
  console.log(
    `DEVICE_LOGIN_PENDING ${JSON.stringify({
      userCode: started.userCode,
      verificationUri: started.verificationUri,
      verificationUriComplete: started.verificationUriComplete,
      expiresIn: started.expiresIn,
    })}`,
  );

  console.error('');
  console.error('=== Device login (human approval required) ===');
  console.error(`1. Open: ${started.verificationUri}`);
  if (started.verificationUriComplete) {
    console.error(`   Or:  ${started.verificationUriComplete}`);
  }
  console.error(`2. Enter code: ${started.userCode}`);
  console.error(`3. Approve access for this device (expires in ~${started.expiresIn}s)`);
  console.error('Polling for token… (Ctrl+C to cancel)');
  console.error('');

  if (args.noPoll) {
    console.log(
      JSON.stringify(
        {
          userCode: started.userCode,
          verificationUri: started.verificationUri,
          verificationUriComplete: started.verificationUriComplete,
          expiresIn: started.expiresIn,
          interval: started.interval,
          note: 'Polling skipped (--no-poll). Re-run without --no-poll after displaying the code.',
        },
        null,
        2,
      ),
    );
    process.exit(EXIT.NEEDS_AUTH);
  }

  const dpopKeyPair = await generateDpopKeyPair();
  const token = await pollDeviceToken({
    discovery,
    deviceCode: started.deviceCode,
    clientId: args.clientId || OIDC.clientId,
    codeVerifier: started.codeVerifier,
    dpopKeyPair,
    intervalSec: started.interval,
    expiresInSec: started.expiresIn,
    onPoll: (info) => {
      if (info.status !== 'authorized') {
        console.error(`  poll #${info.attempt}: ${info.status}`);
      }
    },
  });

  const authFile = path.resolve(REPO_ROOT, args.authFile || DEFAULT_AUTH_FILE);
  await writeAuthFile(authFile, {
    accessToken: token.accessToken,
    refreshToken: token.refreshToken,
    expiresIn: token.expiresIn,
    refreshExpiresIn: token.refreshExpiresIn,
    accessExpiresAtMs: token.accessExpiresAtMs,
    refreshExpiresAtMs: token.refreshExpiresAtMs,
    obtainedAtMs: token.obtainedAtMs,
    scope: token.scope,
    sessionState: token.sessionState,
    responseKeys: token.responseKeys,
    dpopKeyPair: token.dpopKeyPair,
  });
  const tokenFile = path.resolve(REPO_ROOT, args.tokenFile || DEFAULT_TOKEN_FILE);
  await writeTokenFile(tokenFile, token.accessToken);
  console.error(`Auth session written to ${authFile} (gitignored; mode 0600; includes DPoP keys).`);
  console.error(`Access token also at ${tokenFile} (gitignored; alone is insufficient for live DPoP APIs).`);
  const storePersist = await persistAuthToStore({ authFile });
  if (storePersist.persisted) {
    console.error(`Also persisted to FP_API_SHAPE_AUTH_STORE (${storePersist.store}).`);
  } else if (process.env.FP_API_SHAPE_AUTH_STORE) {
    console.error(`FP_API_SHAPE_AUTH_STORE set but persist skipped: ${storePersist.reason}`);
  }
  console.error('Do NOT commit these files.');
  const lifetime = redactAuthLifetime(token, { label: 'device-login' });
  console.error(
    `Lifetime: expires_in=${lifetime.expiresIn}s refresh_expires_in=${lifetime.refreshExpiresIn}s refreshExpiresAt=${lifetime.refreshExpiresAt}`,
  );
  console.error('');
  console.error('Next: make api-shape-capture  (or make api-shape-probe-refresh)');

  if (args.json) {
    console.log(
      JSON.stringify(
        {
          ok: true,
          authFile,
          tokenFile,
          lifetime,
          dpop: true,
        },
        null,
        2,
      ),
    );
  }
  process.exit(EXIT.SUCCESS);
}

/** @param {ReturnType<typeof parseArgs>} args */
async function cmdEnsureAuth(args, { forceRefresh }) {
  const tokenFile = path.resolve(REPO_ROOT, args.tokenFile || DEFAULT_TOKEN_FILE);
  const authFile = path.resolve(REPO_ROOT, args.authFile || DEFAULT_AUTH_FILE);
  const result = await ensureAuthSession({
    token: args.token || null,
    tokenFile,
    authFile,
    forceRefresh,
  });
  if (args.json) {
    console.log(
      JSON.stringify(
        {
          ok: result.ok,
          exitCode: result.exitCode,
          refreshed: result.refreshed,
          lifetime: result.lifetime,
          error: result.error,
          notes: result.notes,
        },
        null,
        2,
      ),
    );
  } else {
    console.log(`${TOOL_ID} ensure-auth ok=${result.ok} refreshed=${result.refreshed}`);
    if (result.lifetime) {
      console.log(
        `lifetime: expires_in=${result.lifetime.expiresIn} refresh_expires_in=${result.lifetime.refreshExpiresIn} refreshExpiresAt=${result.lifetime.refreshExpiresAt} rotated=${result.lifetime.refreshTokenRotated}`,
      );
    }
    for (const n of result.notes || []) console.log(`note: ${n}`);
    if (result.error) console.error(`error: ${result.error}`);
  }
  process.exit(result.exitCode);
}

/**
 * Rolling-refresh evidence: refresh N times; emit redacted lifetimes only.
 * @param {ReturnType<typeof parseArgs>} args
 */
async function cmdProbeRefresh(args) {
  const tokenFile = path.resolve(REPO_ROOT, args.tokenFile || DEFAULT_TOKEN_FILE);
  const authFile = path.resolve(REPO_ROOT, args.authFile || DEFAULT_AUTH_FILE);
  const rounds = Math.max(1, Number(args.rounds) || 3);
  const delayMs = Math.max(0, Number(args.delayMs) || 1500);
  /** @type {object[]} */
  const samples = [];
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  let initial = await resolveAuthSession({ authFile, tokenFile });
  if (!initial?.refreshToken || !initial.dpopKeyPair) {
    console.error('probe-refresh needs state/api-shape-auth.local.json with refresh_token + DPoP');
    process.exit(EXIT.NEEDS_AUTH);
  }
  samples.push(redactAuthLifetime(initial, { label: 'before' }));

  for (let i = 1; i <= rounds; i++) {
    const result = await ensureAuthSession({
      authFile,
      tokenFile,
      forceRefresh: true,
    });
    if (!result.ok) {
      const out = {
        ok: false,
        exitCode: result.exitCode,
        roundsRequested: rounds,
        roundsCompleted: i - 1,
        samples,
        error: result.error,
        notes: result.notes,
        conclusion: {
          indefiniteRollingRefresh: 'NO',
          reason: result.error || 'refresh failed',
        },
      };
      if (args.out) {
        await mkdir(path.dirname(path.resolve(args.out)), { recursive: true });
        await writeFile(path.resolve(args.out), `${JSON.stringify(out, null, 2)}\n`, 'utf8');
      }
      console.log(JSON.stringify(out, null, 2));
      process.exit(result.exitCode);
    }
    samples.push(result.lifetime);
    if (i < rounds && delayMs) await sleep(delayMs);
  }

  const measured = samples.filter(
    (s) => s.label === 'refreshed' && s.refreshExpiresIn != null && s.refreshExpiresAt,
  );
  const first = measured[0] || samples[0];
  const last = measured[measured.length - 1] || samples[samples.length - 1];
  const rotations = samples
    .filter((s) => s.label === 'refreshed')
    .map((s) => s.refreshTokenRotated)
    .filter((v) => v != null);
  const allRotated = rotations.length > 0 && rotations.every(Boolean);
  const anyRotated = rotations.some(Boolean);
  const refreshWallExtended =
    first.refreshExpiresAt &&
    last.refreshExpiresAt &&
    Date.parse(last.refreshExpiresAt) > Date.parse(first.refreshExpiresAt) + 2_000;
  const refreshWallShrunkOrSame =
    first.refreshExpiresAt &&
    last.refreshExpiresAt &&
    Date.parse(last.refreshExpiresAt) <= Date.parse(first.refreshExpiresAt) + 2_000;

  /** @type {'YES'|'NO'|'UNKNOWN'} */
  let indefinite = 'UNKNOWN';
  let reason = '';
  if (!samples.some((s) => s.hasRefreshToken)) {
    indefinite = 'NO';
    reason = 'No refresh_token issued';
  } else if (!measured.length || first.refreshExpiresIn == null) {
    indefinite = 'UNKNOWN';
    reason =
      'Keycloak omitted refresh_expires_in on measured refresh responses; cannot classify rolling lifetime';
  } else if (refreshWallExtended && first.refreshExpiresIn > 0) {
    // Sliding window: each refresh returns a full refresh_expires_in from "now".
    // Indefinite *while* refreshes keep succeeding inside that window (e.g. 90d offline).
    indefinite = 'YES';
    reason = `Sliding offline refresh window observed: each refresh returns refresh_expires_in=${first.refreshExpiresIn}s (~${(
      first.refreshExpiresIn / 86400
    ).toFixed(1)}d) and refreshExpiresAt advances; refresh_token rotated=${allRotated}. Rolling refresh stays alive if performed before that window elapses — miss the window (or lose DPoP keys) → device re-login. Not immortal without activity.`;
  } else if (refreshWallShrunkOrSame && first.refreshExpiresIn > 0) {
    indefinite = 'NO';
    reason = `refresh_expires_in is finite (${first.refreshExpiresIn}s) and absolute refreshExpiresAt did not extend across ${measured.length} refresh(es) — rolling refresh hits that wall; then device re-login`;
  } else {
    indefinite = 'UNKNOWN';
    reason = `refresh_expires_in=${first.refreshExpiresIn}; wall-clock comparison inconclusive`;
  }

  const out = {
    ok: true,
    exitCode: EXIT.SUCCESS,
    roundsRequested: rounds,
    roundsCompleted: rounds,
    samples,
    rotation: {
      anyRotated,
      allRotated,
      observed: rotations,
    },
    wallClock: {
      firstRefreshExpiresAt: first.refreshExpiresAt,
      lastRefreshExpiresAt: last.refreshExpiresAt,
      extended: Boolean(refreshWallExtended),
      shrunkOrSame: Boolean(refreshWallShrunkOrSame),
    },
    dpop: { required: true, clientId: OIDC.clientId },
    conclusion: {
      indefiniteRollingRefresh: indefinite,
      reason,
    },
    notes: [
      'Tokens redacted — only lifetimes/booleans recorded.',
      'Public realm JSON does not expose ssoSessionMaxLifespan; lifetimes come from token responses.',
    ],
  };

  if (args.out) {
    const dest = path.resolve(args.out);
    await mkdir(path.dirname(dest), { recursive: true });
    await writeFile(dest, `${JSON.stringify(out, null, 2)}\n`, 'utf8');
    console.error(`wrote ${dest}`);
  }
  console.log(JSON.stringify(out, null, 2));
  process.exit(EXIT.SUCCESS);
}

/** @param {ReturnType<typeof parseArgs>} args */
async function cmdCapture(args) {
  const artifactsRoot = path.resolve(REPO_ROOT, args.artifacts || DEFAULT_ARTIFACTS_ROOT);
  const tokenFile = args.tokenFile
    ? path.resolve(REPO_ROOT, args.tokenFile)
    : path.resolve(REPO_ROOT, DEFAULT_TOKEN_FILE);
  const authFile = args.authFile
    ? path.resolve(REPO_ROOT, args.authFile)
    : path.resolve(REPO_ROOT, DEFAULT_AUTH_FILE);
  const ensured = await ensureAuthSession({
    token: args.token || null,
    tokenFile,
    authFile,
    forceRefresh: Boolean(args.forceRefresh),
  });
  if (!ensured.ok && !args.dryRun) {
    if (args.json) {
      console.log(
        JSON.stringify(
          {
            exitCode: ensured.exitCode,
            error: ensured.error,
            notes: ensured.notes,
            lifetime: ensured.lifetime,
          },
          null,
          2,
        ),
      );
    } else {
      for (const n of ensured.notes || []) console.log(`note: ${n}`);
      if (ensured.error) console.error(`error: ${ensured.error}`);
    }
    process.exit(ensured.exitCode);
  }
  const session = ensured.session;

  const result = await runCapture({
    artifactsRoot,
    accessToken: session?.accessToken || null,
    dpopKeyPair: session?.dpopKeyPair || null,
    creatorId: args.creatorId || null,
    postId: args.postId || null,
    includeOptionalVideo: Boolean(args.includeVideo),
    unauthList: Boolean(args.withUnauthList),
    unauthCreatorId: args.unauthCreatorId || null,
    promoteBaselines: Boolean(args.promoteBaselines),
    dryRun: Boolean(args.dryRun),
  });

  if (args.json) {
    console.log(
      JSON.stringify(
        {
          exitCode: result.exitCode,
          captureId: result.captureId,
          dir: result.dir,
          endpointIds: Object.keys(result.trees),
          notes: result.notes,
          errors: result.errors,
          hasDrift: result.diff?.hasDrift ?? false,
          firstCapture: result.diff?.firstCapture ?? false,
          calls: result.calls,
        },
        null,
        2,
      ),
    );
  } else {
    console.log(`${TOOL_ID} ${TOOL_VERSION} capture ${result.captureId}`);
    if (result.dir) console.log(`wrote ${result.dir}`);
    for (const n of result.notes) console.log(`note: ${n}`);
    for (const e of result.errors) console.error(`error: ${e}`);
    if (result.diff?.hasDrift) console.log('DRIFT detected — see report.md / diff.json');
    else if (result.diff?.firstCapture) console.log('First capture (baselines seeded if promote enabled)');
  }

  process.exit(result.exitCode);
}

/** @param {ReturnType<typeof parseArgs>} args */
async function cmdUnauthList(args) {
  const artifactsRoot = path.resolve(REPO_ROOT, args.artifacts || DEFAULT_ARTIFACTS_ROOT);
  const result = await runCapture({
    artifactsRoot,
    accessToken: null,
    unauthList: true,
    unauthCreatorId: args.unauthCreatorId || args.creatorId || null,
    promoteBaselines: Boolean(args.promoteBaselines),
    dryRun: Boolean(args.dryRun),
  });

  if (args.json) {
    console.log(
      JSON.stringify(
        {
          exitCode: result.exitCode,
          captureId: result.captureId,
          dir: result.dir,
          endpointIds: Object.keys(result.trees),
          notes: result.notes,
          errors: result.errors,
          hasDrift: result.diff?.hasDrift ?? false,
        },
        null,
        2,
      ),
    );
  } else {
    console.log(`${TOOL_ID} unauth-list ${result.captureId}`);
    if (result.dir) console.log(`wrote ${result.dir}`);
    for (const n of result.notes) console.log(`note: ${n}`);
    for (const e of result.errors) console.error(`error: ${e}`);
  }
  process.exit(result.exitCode);
}

/** @param {ReturnType<typeof parseArgs>} args */
async function cmdDiffTrees(args) {
  if (!args.from || !args.to) {
    console.error('--from and --to .schema.json paths required');
    process.exit(EXIT.FAILURE);
  }
  const fromDoc = JSON.parse(await readFile(path.resolve(args.from), 'utf8'));
  const toDoc = JSON.parse(await readFile(path.resolve(args.to), 'utf8'));
  const fromTree = fromDoc.tree || fromDoc;
  const toTree = toDoc.tree || toDoc;
  const d = diffFieldTrees(fromTree, toTree);
  const report = formatDiffReportMarkdown({
    captureId: 'offline-diff',
    comparedAt: new Date().toISOString(),
    byEndpoint: { compare: d },
    hasDrift: d.hasDrift,
  });
  if (args.json) {
    console.log(JSON.stringify({ ...d, report }, null, 2));
  } else {
    console.log(report);
  }
  process.exit(d.hasDrift ? EXIT.DRIFT : EXIT.SUCCESS);
}

function printHelp() {
  console.log(`Usage: node tools/fp-api-shape-canary/cli.mjs <command> [options]

Commands:
  device-login     Start Keycloak device flow; write auth session (gitignored)
  refresh          Force refresh_token grant + update auth file
  ensure-auth      Refresh if access near expiry (exit 3 if re-login needed)
  probe-refresh    Rolling-refresh lifetime evidence (redacted JSON)
  capture          Authenticated allowlist capture → field trees + baseline diff
  unauth-list      Unauthenticated companion capture for /api/v3/content/creator
  diff-trees       Offline structural diff of two field-tree schema files

Options:
  --token-file <path>     Default: ${DEFAULT_TOKEN_FILE} (gitignored)
  --auth-file <path>      Default: ${DEFAULT_AUTH_FILE} (gitignored; token+DPoP JWKs)
  --token <accessToken>   Prefer env FP_ACCESS_TOKEN instead (never commit)
  --artifacts <dir>       Default: ${DEFAULT_ARTIFACTS_ROOT}
  --creator-id <id>       Override subscribed creator for list probe
  --post-id <id>          Override post id for primary canary
  --include-video         Also GET /api/v3/content/video when attachment present
  --with-unauth-list      During capture, also snapshot unauth creator list
  --promote-baselines     Force-write baselines/ from this capture
  --force-refresh         capture/ensure-auth: always refresh first
  --scope <scopes>        Device-login scope (default: ${OIDC.defaultScope}; schedule: ${OIDC.scheduleScope})
  --client-id <id>        Default: ${OIDC.clientId} (do not invent clients)
  --rounds <n>            probe-refresh iterations (default 3)
  --delay-ms <n>          probe-refresh delay between refreshes (default 1500)
  --out <path>            probe-refresh: write redacted evidence JSON
  --no-poll               device-login: print user code and exit (needs auth)
  --dry-run               Do not write artifacts
  --from / --to           diff-trees schema paths
  --json                  Machine-readable summary
  --help

Env:
  FP_AUTH_FILE            Auth session JSON (access + refresh + DPoP keys)
  FP_ACCESS_TOKEN         Access token only (needs matching DPoP keys for live APIs)
  FP_TOKEN_FILE           Override bare token file path
  FP_API_SHAPE_AUTH_STORE Durable seed path (Project store). Restored when local
                          auth file is missing; updated after device-login/refresh.

Evidence-backed OIDC defaults: issuer ${OIDC.issuer}, clientId ${OIDC.clientId}.
fp-tv-app requires PKCE + DPoP (usesExtendedSecurity). Refresh also requires DPoP.
Non-goals: no OpenAPI edits, no Phase 1/2 schedule changes, no Hydravion, no writes.
`);
}

/** @param {string[]} argv */
function parseArgs(argv) {
  const args = {
    command: null,
    help: false,
    json: false,
    dryRun: false,
    noPoll: false,
    includeVideo: false,
    withUnauthList: false,
    promoteBaselines: false,
    forceRefresh: false,
    token: null,
    tokenFile: null,
    authFile: null,
    artifacts: null,
    creatorId: null,
    postId: null,
    unauthCreatorId: null,
    scope: null,
    clientId: null,
    from: null,
    to: null,
    rounds: null,
    delayMs: null,
    out: null,
  };
  const rest = [...argv];
  if (rest[0] && !rest[0].startsWith('-')) {
    args.command = rest.shift();
  }
  while (rest.length) {
    const a = rest.shift();
    if (a === '--help' || a === '-h') args.help = true;
    else if (a === '--json') args.json = true;
    else if (a === '--dry-run') args.dryRun = true;
    else if (a === '--no-poll') args.noPoll = true;
    else if (a === '--include-video') args.includeVideo = true;
    else if (a === '--with-unauth-list') args.withUnauthList = true;
    else if (a === '--promote-baselines') args.promoteBaselines = true;
    else if (a === '--force-refresh') args.forceRefresh = true;
    else if (a === '--token') args.token = rest.shift();
    else if (a === '--token-file') args.tokenFile = rest.shift();
    else if (a === '--auth-file') args.authFile = rest.shift();
    else if (a === '--artifacts') args.artifacts = rest.shift();
    else if (a === '--creator-id') args.creatorId = rest.shift();
    else if (a === '--post-id') args.postId = rest.shift();
    else if (a === '--unauth-creator-id') args.unauthCreatorId = rest.shift();
    else if (a === '--scope') args.scope = rest.shift();
    else if (a === '--client-id') args.clientId = rest.shift();
    else if (a === '--from') args.from = rest.shift();
    else if (a === '--to') args.to = rest.shift();
    else if (a === '--rounds') args.rounds = rest.shift();
    else if (a === '--delay-ms') args.delayMs = rest.shift();
    else if (a === '--out') args.out = rest.shift();
    else if (a.startsWith('-')) {
      console.error(`Unknown option: ${a}`);
      args.help = true;
    } else if (!args.command) {
      args.command = a;
    }
  }
  return args;
}

main(process.argv.slice(2));
