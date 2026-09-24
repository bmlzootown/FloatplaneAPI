#!/usr/bin/env node
/**
 * Floatplane frontend evidence — Phase 2.1 CLI
 *
 * Exit codes:
 *   0  success (complete inventory published, or idempotent re-run)
 *   1  operational failure
 *   3  incomplete chunk collection (no complete inventory published)
 *
 * Usage:
 *   node tools/fp-frontend-evidence/cli.mjs extract [--observation <id>] [--json]
 *   node tools/fp-frontend-evidence/cli.mjs extract --dry-run
 *   make frontend-evidence OBSERVATION=<id>
 */

import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { EXIT, EXTRACTOR_ID, EXTRACTOR_VERSION } from './lib/constants.mjs';
import { runFrontendEvidence } from './lib/run.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..', '..');

async function main(argv) {
  const args = parseArgs(argv);
  if (args.help || !args.command) {
    printHelp();
    process.exit(args.help ? 0 : EXIT.FAILURE);
  }

  if (args.command !== 'extract') {
    console.error(`Unknown command: ${args.command}`);
    printHelp();
    process.exit(EXIT.FAILURE);
  }

  const statePath = path.resolve(REPO_ROOT, args.state || 'state/last-known-frontend.json');
  const artifactsRoot = path.resolve(REPO_ROOT, args.artifacts || 'artifacts/frontend');

  try {
    const result = await runFrontendEvidence({
      repoRoot: REPO_ROOT,
      statePath,
      artifactsRoot,
      observationId: args.observation || null,
      buildId: args.build || null,
      dryRun: Boolean(args.dryRun),
      force: Boolean(args.force),
    });

    if (args.json) {
      console.log(
        JSON.stringify(
          {
            ok: result.ok,
            idempotent: result.idempotent || false,
            dryRun: result.dryRun || false,
            observationId: result.observationId,
            buildId: result.buildId,
            phase2Dir: result.phase2Dir
              ? path.relative(REPO_ROOT, result.phase2Dir)
              : null,
            metrics: result.metrics,
            extractor: `${EXTRACTOR_ID}@${EXTRACTOR_VERSION}`,
            error: result.error || null,
          },
          null,
          2,
        ),
      );
    } else {
      printHuman(result, REPO_ROOT);
    }

    process.exit(result.exitCode ?? (result.ok ? EXIT.SUCCESS : EXIT.FAILURE));
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (args.json) {
      console.log(JSON.stringify({ ok: false, error: message }, null, 2));
    } else {
      console.error(`Error: ${message}`);
      console.error('Phase 1 last-known-good state was NOT modified.');
    }
    process.exit(EXIT.FAILURE);
  }
}

function printHuman(result, repoRoot) {
  console.log(`Floatplane frontend evidence (Phase 2.1)`);
  console.log(`---------------------------------------`);
  console.log(`Extractor:     ${EXTRACTOR_ID}@${EXTRACTOR_VERSION}`);
  console.log(`Observation:   ${result.observationId}`);
  console.log(`Build:         ${result.buildId}`);
  console.log(
    `Phase2 dir:    ${result.phase2Dir ? path.relative(repoRoot, result.phase2Dir) : '(dry-run)'}`,
  );
  console.log(`Idempotent:    ${result.idempotent ? 'yes' : 'no'}`);
  if (result.dryRun) console.log(`Dry run:       yes (nothing written)`);
  console.log(``);
  const m = result.metrics || {};
  console.log(`Metrics:`);
  console.log(`  Reachable JS:           ${m.reachableJsCount}`);
  console.log(`  Lazy JS (excl. entry):  ${m.lazyJsCount}`);
  console.log(`  mapDeps first-wave JS:  ${m.mapDepsFirstWaveJs}`);
  console.log(`  Entry bytes:            ${m.entryBytes}`);
  console.log(`  Archived chunk bytes:   ${m.archivedChunkBytes}`);
  console.log(`  Structured operations:  ${m.structuredOperationCount}`);
  if (m.structuredByMethod) {
    for (const [method, n] of Object.entries(m.structuredByMethod).sort()) {
      console.log(`    ${method}: ${n}`);
    }
  }
  console.log(`  Rejected signals:       ${m.rejectedSignalCount}`);
  console.log(`  Collection:             ${m.collectionStatus}`);
  console.log(``);
  if (result.ok) {
    console.log(`Result: OK (exit ${result.exitCode ?? EXIT.SUCCESS})`);
  } else {
    console.log(`Result: INCOMPLETE — ${result.error || 'see phase2/status.json'}`);
    console.log(`Complete inventory was NOT published.`);
  }
}

function printHelp() {
  console.log(`Floatplane frontend evidence (Phase 2.1)

Commands:
  extract     BFS reachable Vite chunks for one observation, archive JS bytes,
              extract API/network evidence, write phase2/ inventory

Options:
  --observation <id>  Observation id (default: last-known-frontend.json)
  --build <id>        Build id hint (optional; scanned if omitted)
  --json              Machine-readable JSON on stdout
  --dry-run           Compute graph+evidence; do not write phase2/
  --force             Re-run even if a complete inventory already exists
  --state <path>      State file (default: state/last-known-frontend.json)
  --artifacts <path>  Artifacts root (default: artifacts/frontend)
  -h, --help          Show help

Exit codes:
  0  success
  1  operational failure
  3  incomplete collection (no complete inventory)

Phase 1 LKG state is never modified by this tool.
`);
}

/** @param {string[]} argv */
function parseArgs(argv) {
  const out = {
    command: null,
    json: false,
    dryRun: false,
    force: false,
    help: false,
    state: null,
    artifacts: null,
    observation: null,
    build: null,
  };
  const positional = [];
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--json') out.json = true;
    else if (a === '--dry-run') out.dryRun = true;
    else if (a === '--force') out.force = true;
    else if (a === '-h' || a === '--help') out.help = true;
    else if (a === '--state') out.state = argv[++i];
    else if (a === '--artifacts') out.artifacts = argv[++i];
    else if (a === '--observation') out.observation = argv[++i];
    else if (a === '--build') out.build = argv[++i];
    else if (a.startsWith('-')) {
      console.error(`Unknown option: ${a}`);
      out.help = true;
    } else positional.push(a);
  }
  out.command = positional[0] || null;
  return out;
}

main(process.argv.slice(2)).catch((err) => {
  console.error(err);
  process.exit(EXIT.FAILURE);
});
