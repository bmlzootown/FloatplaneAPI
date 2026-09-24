#!/usr/bin/env node
/**
 * Floatplane frontend evidence — Phase 2.1 extract + Phase 2.2 diff CLI
 *
 * Exit codes:
 *   0  success
 *   1  operational failure
 *   3  incomplete (extract incomplete, or diff with removal suppression)
 *
 * Usage:
 *   node tools/fp-frontend-evidence/cli.mjs extract [--observation <id>] [--json]
 *   node tools/fp-frontend-evidence/cli.mjs diff --from <id> --to <id> [--json]
 *   node tools/fp-frontend-evidence/cli.mjs diff-latest [--json]
 *   make frontend-evidence-diff FROM=<id> TO=<id>
 *   make frontend-evidence-diff-latest
 */

import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { EXIT, EXTRACTOR_ID, EXTRACTOR_VERSION } from './lib/constants.mjs';
import { runFrontendEvidence } from './lib/run.mjs';
import {
  COMPARATOR_ID,
  COMPARATOR_VERSION,
  EXIT as DIFF_EXIT,
} from './lib/diff/constants.mjs';
import { runEvidenceDiff, runEvidenceDiffLatest } from './lib/diff/run-diff.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..', '..');

async function main(argv) {
  const args = parseArgs(argv);
  if (args.help || !args.command) {
    printHelp();
    process.exit(args.help ? 0 : EXIT.FAILURE);
  }

  if (args.command === 'extract') {
    await runExtract(args);
    return;
  }
  if (args.command === 'diff') {
    await runDiff(args);
    return;
  }
  if (args.command === 'diff-latest') {
    await runDiffLatest(args);
    return;
  }

  console.error(`Unknown command: ${args.command}`);
  printHelp();
  process.exit(EXIT.FAILURE);
}

/** @param {ReturnType<typeof parseArgs>} args */
async function runExtract(args) {
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
      printExtractHuman(result, REPO_ROOT);
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

/** @param {ReturnType<typeof parseArgs>} args */
async function runDiff(args) {
  if (!args.from || !args.to) {
    console.error('diff requires --from <observationId> and --to <observationId>');
    printHelp();
    process.exit(DIFF_EXIT.FAILURE);
  }

  const artifactsRoot = path.resolve(REPO_ROOT, args.artifacts || 'artifacts/frontend');

  try {
    const result = await runEvidenceDiff({
      repoRoot: REPO_ROOT,
      artifactsRoot,
      fromObservationId: args.from,
      toObservationId: args.to,
      fromBuildId: args.fromBuild || null,
      toBuildId: args.toBuild || null,
      dryRun: Boolean(args.dryRun),
      force: Boolean(args.force),
      labelAsReal: args.labelAsReal,
    });

    emitDiffResult(result, args, REPO_ROOT);
    process.exit(result.exitCode ?? DIFF_EXIT.SUCCESS);
  } catch (err) {
    failDiff(err, args);
  }
}

/** @param {ReturnType<typeof parseArgs>} args */
async function runDiffLatest(args) {
  const artifactsRoot = path.resolve(REPO_ROOT, args.artifacts || 'artifacts/frontend');

  try {
    const result = await runEvidenceDiffLatest({
      repoRoot: REPO_ROOT,
      artifactsRoot,
      dryRun: Boolean(args.dryRun),
      force: Boolean(args.force),
    });

    emitDiffResult(result, args, REPO_ROOT);
    process.exit(result.exitCode ?? DIFF_EXIT.SUCCESS);
  } catch (err) {
    failDiff(err, args);
  }
}

/**
 * @param {Awaited<ReturnType<typeof runEvidenceDiff>>} result
 * @param {ReturnType<typeof parseArgs>} args
 * @param {string} repoRoot
 */
function emitDiffResult(result, args, repoRoot) {
  if (args.json) {
    console.log(
      JSON.stringify(
        {
          ok: result.ok,
          idempotent: result.idempotent || false,
          dryRun: result.dryRun || false,
          fromObservationId: result.from.observationId,
          toObservationId: result.to.observationId,
          fromBuildId: result.from.buildId,
          toBuildId: result.to.buildId,
          comparisonStatus: result.diff.comparisonStatus,
          additionConclusionsAllowed: result.diff.additionConclusionsAllowed,
          disappearanceConclusionsAllowed: result.diff.disappearanceConclusionsAllowed,
          methodSetConclusionsAllowed: result.diff.methodSetConclusionsAllowed,
          removalSuppressed: result.diff.removalSuppressed,
          counts: result.diff.counts,
          suppressedTotal: result.diff.counts?.suppressedTotal ?? 0,
          outDir: result.outDir ? path.relative(repoRoot, result.outDir) : null,
          labelAsReal: result.diff.labelAsReal,
          comparator: `${COMPARATOR_ID}@${COMPARATOR_VERSION}`,
          warnings: result.diff.warnings,
        },
        null,
        2,
      ),
    );
    return;
  }

  console.log(`Floatplane frontend evidence diff (Phase 2.2)`);
  console.log(`--------------------------------------------`);
  console.log(`Comparator:    ${COMPARATOR_ID}@${COMPARATOR_VERSION}`);
  console.log(`From:          ${result.from.buildId} / ${result.from.observationId}`);
  console.log(`To:            ${result.to.buildId} / ${result.to.observationId}`);
  console.log(
    `Output:        ${result.outDir ? path.relative(repoRoot, result.outDir) : '(dry-run)'}`,
  );
  console.log(`Idempotent:    ${result.idempotent ? 'yes' : 'no'}`);
  console.log(`Status:        ${result.diff.comparisonStatus}`);
  console.log(
    `Additions allowed:      ${result.diff.additionConclusionsAllowed ? 'yes' : 'no'} (needs FROM complete)`,
  );
  console.log(
    `Disappearances allowed: ${result.diff.disappearanceConclusionsAllowed ? 'yes' : 'no'} (needs TO complete)`,
  );
  console.log(
    `Method-set allowed:     ${result.diff.methodSetConclusionsAllowed ? 'yes' : 'no'} (needs both complete)`,
  );
  console.log(`Label as real: ${result.diff.labelAsReal ? 'yes' : 'no (fixture/controlled)'}`);
  if (result.dryRun) console.log(`Dry run:       yes (nothing written)`);
  console.log(``);
  const c = result.diff.counts || {};
  console.log(`Counts (atomic):`);
  console.log(`  structured_operation_added:        ${c.structured_operation_added || 0}`);
  console.log(`  structured_operation_disappeared:  ${c.structured_operation_disappeared || 0}`);
  console.log(`  request_construction_changed:      ${c.request_construction_changed || 0}`);
  console.log(`  auth_evidence_changed:             ${c.auth_evidence_changed || 0}`);
  console.log(`  response_mapper_changed:           ${c.response_mapper_changed || 0}`);
  console.log(`  realtime_evidence_changed:         ${c.realtime_evidence_changed || 0}`);
  console.log(`  weak_reference_added:              ${c.weak_reference_added || 0}`);
  console.log(`  weak_reference_disappeared:        ${c.weak_reference_disappeared || 0}`);
  console.log(`  provenance_moved:                  ${c.provenance_moved || 0}`);
  console.log(`  atomic total:                      ${c.totalAtomic || 0}`);
  console.log(`Counts (derived):`);
  console.log(`  method_set_changed:                ${c.method_set_changed || 0}`);
  console.log(`  derived total:                     ${c.totalDerived || 0}`);
  console.log(`  authoritative total:               ${c.total || 0}`);
  console.log(`  suppressed (indeterminate):        ${c.suppressedTotal || 0}`);
  console.log(``);
  if (result.diff.warnings?.length) {
    console.log(`Warnings:`);
    for (const w of result.diff.warnings) console.log(`  - ${w}`);
    console.log(``);
  }
  console.log(
    `Result: ${result.ok ? 'OK' : 'INCOMPLETE'} (exit ${result.exitCode ?? DIFF_EXIT.SUCCESS})`,
  );
  console.log(`Phase 1 LKG and source inventories were NOT modified.`);
}

/** @param {unknown} err @param {ReturnType<typeof parseArgs>} args */
function failDiff(err, args) {
  const message = err instanceof Error ? err.message : String(err);
  if (args.json) {
    console.log(JSON.stringify({ ok: false, error: message }, null, 2));
  } else {
    console.error(`Error: ${message}`);
    console.error('Phase 1 LKG and source inventories were NOT modified.');
  }
  process.exit(DIFF_EXIT.FAILURE);
}

function printExtractHuman(result, repoRoot) {
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
  console.log(`  Deterministic closure:  ${m.reachedDeterministicClosure}`);
  console.log(`  Refuse removal:         ${m.refuseRemoval}`);
  console.log(`  Deps discovered:        ${m.depsDiscovered}`);
  console.log(`  Successfully fetched:   ${m.successfullyFetched}`);
  console.log(`  Duplicate refs:         ${m.duplicateRefs}`);
  console.log(`  External rejects:       ${m.rejectedExternalCount}`);
  if (m.routeRoots?.length) {
    console.log(`  Route roots:`);
    for (const r of m.routeRoots) {
      console.log(`    ${r.label}: ${r.path} (${r.ok ? 'ok' : 'FAILED'})`);
    }
  }
  console.log(``);
  if (result.ok) {
    console.log(`Result: OK (exit ${result.exitCode ?? EXIT.SUCCESS})`);
  } else {
    console.log(`Result: INCOMPLETE — ${result.error || 'see phase2/status.json'}`);
    console.log(`Complete inventory was NOT published.`);
  }
}

function printHelp() {
  console.log(`Floatplane frontend evidence (Phase 2.1 + 2.2)

Commands:
  extract       BFS reachable Vite chunks + API/network evidence (Phase 2.1)
  diff          Semantic compare of two archived evidence inventories (Phase 2.2)
  diff-latest   Compare the two most recent complete inventories (if ≥2 exist)

Extract options:
  --observation <id>  Observation id (default: last-known-frontend.json)
  --build <id>        Build id hint

Diff options:
  --from <id>         From observation id (required for diff)
  --to <id>           To observation id (required for diff)
  --from-build <id>   Optional build hint for FROM
  --to-build <id>     Optional build hint for TO
  --label-as-real     Mark report as real Floatplane observations
  --label-as-fixture  Mark report as controlled/fixture (never as real FP change)

Shared options:
  --json              Machine-readable JSON on stdout
  --dry-run           Compute without writing artifacts
  --force             Re-run even if idempotent output exists
  --state <path>      State file (extract only; default: state/last-known-frontend.json)
  --artifacts <path>  Artifacts root (default: artifacts/frontend)
  -h, --help          Show help

Makefile:
  make frontend-evidence-diff FROM=<obs> TO=<obs>
  make frontend-evidence-diff-latest

Exit codes:
  0  success
  1  operational failure
  3  incomplete extract, or diff with incomplete/removal-suppressed sides

Phase 1 LKG state and source evidence inventories are never modified.
Diff operates offline from archived Phase 1/2 artifacts only.
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
    from: null,
    to: null,
    fromBuild: null,
    toBuild: null,
    /** @type {boolean | undefined} */
    labelAsReal: undefined,
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
    else if (a === '--from') out.from = argv[++i];
    else if (a === '--to') out.to = argv[++i];
    else if (a === '--from-build') out.fromBuild = argv[++i];
    else if (a === '--to-build') out.toBuild = argv[++i];
    else if (a === '--label-as-real') out.labelAsReal = true;
    else if (a === '--label-as-fixture') out.labelAsReal = false;
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
