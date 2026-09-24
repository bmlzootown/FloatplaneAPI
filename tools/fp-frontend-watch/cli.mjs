#!/usr/bin/env node
/**
 * Floatplane frontend watch — Phase 1 CLI
 *
 * Exit codes:
 *   0  unchanged (matches last-known-good)
 *   1  operational failure (network/parse/invalid artifact/malformed state)
 *   2  change detected (new build id, content hash change, or archive conflict)
 *
 * Usage:
 *   node tools/fp-frontend-watch/cli.mjs check [--json] [--dry-run]
 *   node tools/fp-frontend-watch/cli.mjs discover [--json]
 *   node tools/fp-frontend-watch/cli.mjs live-check [--json]
 */

import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { EXIT, DEFAULT_HOMEPAGE_URL } from './lib/constants.mjs';
import { runCheck, runDiscover } from './lib/check.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..', '..');

async function main(argv) {
  const args = parseArgs(argv);
  if (args.help || !args.command) {
    printHelp();
    process.exit(args.help ? 0 : EXIT.FAILURE);
  }

  const statePath = path.resolve(REPO_ROOT, args.state || 'state/last-known-frontend.json');
  const artifactsRoot = path.resolve(REPO_ROOT, args.artifacts || 'artifacts/frontend');
  const homepageUrl = args.homepage || DEFAULT_HOMEPAGE_URL;

  if (args.command === 'discover') {
    try {
      const result = await runDiscover({ homepageUrl });
      if (args.json) {
        console.log(JSON.stringify(result, null, 2));
      } else {
        const d = result.discovery;
        console.log(`Discovery method: homepage-html-asset-urls`);
        console.log(`Homepage:         ${homepageUrl}`);
        console.log(`Build id:         ${d.buildId}`);
        console.log(`Layout:           ${d.layout}`);
        console.log(`Base URL:         ${d.baseUrl}`);
        console.log(`Entry:            ${d.entryPath}`);
        if (d.manifestPath) console.log(`Manifest:         ${d.manifestPath}`);
        console.log(`Artifacts:        ${d.artifactPaths.join(', ')}`);
      }
      process.exit(EXIT.UNCHANGED);
    } catch (err) {
      emitError(err, args.json);
      process.exit(EXIT.FAILURE);
    }
  }

  if (args.command === 'check' || args.command === 'live-check') {
    const result = await runCheck({
      repoRoot: REPO_ROOT,
      statePath,
      artifactsRoot,
      homepageUrl,
      dryRun: Boolean(args.dryRun),
    });

    if (!result.ok) {
      emitError(result.error, args.json);
      if (!args.json) {
        console.error('Last-known-good state was NOT modified.');
      }
      process.exit(EXIT.FAILURE);
    }

    if (args.json) {
      console.log(
        JSON.stringify(
          {
            ok: true,
            changed: result.changed,
            comparison: result.comparison,
            buildId: result.current.buildId,
            layout: result.current.layout,
            observedAt: result.current.observedAt,
            artifacts: result.current.artifacts,
            noteworthy: result.noteworthy,
            statePath: path.relative(REPO_ROOT, statePath),
            artifactDir: result.current.artifactDir,
          },
          null,
          2,
        ),
      );
    } else {
      printHumanCheck(result, statePath, REPO_ROOT);
    }

    process.exit(result.changed ? EXIT.CHANGED : EXIT.UNCHANGED);
  }

  console.error(`Unknown command: ${args.command}`);
  printHelp();
  process.exit(EXIT.FAILURE);
}

/** @param {import('./lib/check.mjs').runCheck extends Function ? any : never} result */
function printHumanCheck(result, statePath, repoRoot) {
  const c = result.comparison;
  const cur = result.current;
  console.log(`Floatplane frontend watch`);
  console.log(`-------------------------`);
  console.log(`Status:      ${c.status}`);
  console.log(`Summary:     ${c.summary}`);
  console.log(`Build id:    ${cur.buildId}`);
  console.log(`Layout:      ${cur.layout}`);
  console.log(`Observed at: ${cur.observedAt}`);
  console.log(`Base URL:    ${cur.baseUrl}`);
  console.log(`State file:  ${path.relative(repoRoot, statePath)}`);
  console.log(`Artifacts:   ${cur.artifactDir}`);
  console.log(``);
  console.log(`Artifact hashes:`);
  for (const a of cur.artifacts) {
    console.log(`  ${a.sha256}  ${a.bytes.toString().padStart(8)}  ${a.path}`);
  }
  if (c.changedArtifacts?.length) {
    console.log(``);
    console.log(`Changed artifacts:`);
    for (const ch of c.changedArtifacts) {
      console.log(`  ${ch.path}`);
      console.log(`    was: ${ch.previousSha256 ?? '(none)'}`);
      console.log(`    now: ${ch.currentSha256}`);
    }
  }
  if (result.noteworthy?.length) {
    console.log(``);
    console.log(`Noteworthy:`);
    for (const n of result.noteworthy) {
      console.log(`  - ${n}`);
    }
  }
  console.log(``);
  if (result.changed) {
    console.log(`Result: CHANGE DETECTED (exit ${EXIT.CHANGED})`);
  } else {
    console.log(`Result: unchanged (exit ${EXIT.UNCHANGED})`);
  }
}

function emitError(err, json) {
  const message = err instanceof Error ? err.message : String(err);
  if (json) {
    console.log(JSON.stringify({ ok: false, error: message }, null, 2));
  } else {
    console.error(`Error: ${message}`);
  }
}

function printHelp() {
  console.log(`Floatplane frontend watch (Phase 1)

Commands:
  discover     Resolve currently deployed frontend build id from homepage HTML
  check        Discover, fetch artifacts, hash, compare to local state, archive
  live-check   Alias for check (explicit live network use)

Options:
  --json              Machine-readable JSON on stdout
  --dry-run           Compare only; do not write state or artifacts
  --state <path>      State file (default: state/last-known-frontend.json)
  --artifacts <path>  Artifacts root (default: artifacts/frontend)
  --homepage <url>    Homepage URL (default: ${DEFAULT_HOMEPAGE_URL})
  -h, --help          Show help

Exit codes:
  0  unchanged
  1  operational failure
  2  change detected
`);
}

/** @param {string[]} argv */
function parseArgs(argv) {
  const out = {
    command: null,
    json: false,
    dryRun: false,
    help: false,
    state: null,
    artifacts: null,
    homepage: null,
  };
  const positional = [];
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--json') out.json = true;
    else if (a === '--dry-run') out.dryRun = true;
    else if (a === '-h' || a === '--help') out.help = true;
    else if (a === '--state') out.state = argv[++i];
    else if (a === '--artifacts') out.artifacts = argv[++i];
    else if (a === '--homepage') out.homepage = argv[++i];
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
