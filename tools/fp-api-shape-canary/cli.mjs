#!/usr/bin/env node
/**
 * Phase 3.0 — authenticated API response-shape canary CLI
 *
 * Commands:
 *   device-login   Keycloak OIDC device flow (human approves); writes token file
 *   capture        Allowlisted GETs → field-tree capture + structural diff
 *   diff-trees     Offline structural diff of two .schema.json trees
 *   unauth-list    Companion: unauthenticated GET /api/v3/content/creator field tree
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
import { readFile } from 'node:fs/promises';
import {
  DEFAULT_ARTIFACTS_ROOT,
  DEFAULT_AUTH_FILE,
  DEFAULT_TOKEN_FILE,
  EXIT,
  OIDC,
  TOOL_ID,
  TOOL_VERSION,
} from './lib/constants.mjs';
import { discoverOidc, requestDeviceAuthorization, pollDeviceToken } from './lib/device-flow.mjs';
import { generateDpopKeyPair } from './lib/dpop.mjs';
import { diffFieldTrees, formatDiffReportMarkdown } from './lib/diff.mjs';
import {
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
    scope: token.scope,
    dpopKeyPair: token.dpopKeyPair,
  });
  const tokenFile = path.resolve(REPO_ROOT, args.tokenFile || DEFAULT_TOKEN_FILE);
  await writeTokenFile(tokenFile, token.accessToken);
  console.error(`Auth session written to ${authFile} (gitignored; mode 0600; includes DPoP keys).`);
  console.error(`Access token also at ${tokenFile} (gitignored; alone is insufficient for live DPoP APIs).`);
  console.error('Do NOT commit these files.');
  console.error('');
  console.error('Next: make api-shape-capture');

  if (args.json) {
    console.log(
      JSON.stringify(
        {
          ok: true,
          authFile,
          tokenFile,
          expiresIn: token.expiresIn,
          scope: token.scope,
          hasRefreshToken: Boolean(token.refreshToken),
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
async function cmdCapture(args) {
  const artifactsRoot = path.resolve(REPO_ROOT, args.artifacts || DEFAULT_ARTIFACTS_ROOT);
  const tokenFile = args.tokenFile
    ? path.resolve(REPO_ROOT, args.tokenFile)
    : path.resolve(REPO_ROOT, DEFAULT_TOKEN_FILE);
  const authFile = args.authFile
    ? path.resolve(REPO_ROOT, args.authFile)
    : path.resolve(REPO_ROOT, DEFAULT_AUTH_FILE);
  const session = await resolveAuthSession({
    token: args.token || null,
    tokenFile,
    authFile,
  });

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
  device-login     Start Keycloak device flow; write access token to local file
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
  --scope <scopes>        Device-login scope (default: ${OIDC.defaultScope})
  --client-id <id>        Default: ${OIDC.clientId} (do not invent clients)
  --no-poll               device-login: print user code and exit (needs auth)
  --dry-run               Do not write artifacts
  --from / --to           diff-trees schema paths
  --json                  Machine-readable summary
  --help

Env:
  FP_AUTH_FILE            Auth session JSON (access token + DPoP keys)
  FP_ACCESS_TOKEN         Access token only (needs matching DPoP keys for live APIs)
  FP_TOKEN_FILE           Override bare token file path

Evidence-backed OIDC defaults: issuer ${OIDC.issuer}, clientId ${OIDC.clientId}.
fp-tv-app requires PKCE + DPoP (usesExtendedSecurity).
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
