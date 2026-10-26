#!/usr/bin/env node
/**
 * Fluxer + Discord webhook notifier for FloatplaneAPI monitors.
 *
 * Posts only on change actions (open/update shape or frontend PR).
 * Never logs webhook URLs.
 *
 * Target modes:
 *   default / --targets all  → Fluxer + Discord (production)
 *   --test / --targets test  → Fluxer only (format/smoke/draft — never Discord)
 *   --targets fluxer|discord → single webhook
 *
 * Usage:
 *   node tools/fp-notify/cli.mjs notify --decision-json '{"action":"open_shape_pr",...}'
 *   node tools/fp-notify/cli.mjs notify --decision-file /tmp/decision.json --pr-url URL
 *   cat decision.json | node tools/fp-notify/cli.mjs notify --stdin
 *   node tools/fp-notify/cli.mjs notify --decision-file d.json --dry-run
 *   node tools/fp-notify/cli.mjs notify --decision-file d.json --test
 *   node tools/fp-notify/cli.mjs notify --decision-file d.json --targets discord
 *
 * Webhook URLs (never commit):
 *   FLUXER_WEBHOOK_URL  or Project secrets/fluxer-webhook.url
 *   DISCORD_WEBHOOK_URL or Project secrets/discord-webhook.url
 */

import { readFile } from 'node:fs/promises';
import { notifyFromDecision } from './lib/notify.mjs';
import { buildNotifyPayload } from './lib/payloads.mjs';
import {
  resolveWebhookTargets,
  redactWebhookUrl,
} from './lib/resolve-webhook.mjs';
import {
  TOOL_ID,
  TOOL_VERSION,
  DEFAULT_WEBHOOK_STORE_PATH,
  DEFAULT_DISCORD_WEBHOOK_STORE_PATH,
} from './lib/constants.mjs';

async function main(argv) {
  const args = parseArgs(argv);
  if (args.help || !args.cmd) {
    printHelp();
    process.exit(args.help ? 0 : 1);
  }

  if (args.cmd === 'resolve') {
    const r = await resolveWebhookTargets({
      storePath: args.storePath,
      discordStorePath: args.discordStorePath,
      url: args.url,
      discordUrl: args.discordUrl,
      targets: args.targets,
      test: args.test,
    });
    console.log(
      JSON.stringify(
        {
          ok: r.ok,
          mode: r.mode,
          requested: r.requested,
          reason: r.reason || null,
          targets: r.targets.map((t) => ({
            id: t.id,
            source: t.source,
            webhook: redactWebhookUrl(t.url),
          })),
          missing: r.missing,
          defaultStorePath: DEFAULT_WEBHOOK_STORE_PATH,
          defaultDiscordStorePath: DEFAULT_DISCORD_WEBHOOK_STORE_PATH,
        },
        null,
        2,
      ),
    );
    process.exit(r.ok ? 0 : 1);
  }

  if (args.cmd === 'preview') {
    const decision = await loadDecision(args);
    const built = buildNotifyPayload(decision, {
      prUrl: args.prUrl,
      notifyOnAuth: args.alsoAuth,
    });
    console.log(JSON.stringify(built, null, 2));
    process.exit(built.skipped ? 0 : 0);
  }

  if (args.cmd === 'notify') {
    const decision = await loadDecision(args);
    const result = await notifyFromDecision({
      decision,
      prUrl: args.prUrl,
      notifyOnAuth: args.alsoAuth,
      dryRun: args.dryRun,
      url: args.url,
      storePath: args.storePath,
      discordUrl: args.discordUrl,
      discordStorePath: args.discordStorePath,
      targets: args.targets,
      test: args.test,
    });
    console.log(JSON.stringify(result, null, 2));
    // Unset webhook / noop skip → exit 0 so Automation is not failed.
    // Hard post failure → exit 1 (non-fatal for prompts that ignore it).
    if (result.skipped) process.exit(0);
    process.exit(result.notified ? 0 : 1);
  }

  console.error(`Unknown command: ${args.cmd}`);
  printHelp();
  process.exit(1);
}

async function loadDecision(args) {
  if (args.decisionJson) {
    return JSON.parse(args.decisionJson);
  }
  if (args.decisionFile) {
    const raw = await readFile(args.decisionFile, 'utf8');
    return JSON.parse(raw);
  }
  if (args.stdin) {
    const chunks = [];
    for await (const c of process.stdin) chunks.push(c);
    const raw = Buffer.concat(chunks).toString('utf8');
    return JSON.parse(raw);
  }
  throw new Error('Provide --decision-json, --decision-file, or --stdin');
}

function parseArgs(argv) {
  const out = {
    cmd: null,
    help: false,
    dryRun: false,
    alsoAuth: false,
    stdin: false,
    test: false,
    decisionJson: null,
    decisionFile: null,
    prUrl: null,
    url: null,
    storePath: null,
    discordUrl: null,
    discordStorePath: null,
    targets: null,
  };
  const rest = [...argv];
  if (rest[0] && !rest[0].startsWith('-')) {
    out.cmd = rest.shift();
  }
  while (rest.length) {
    const a = rest.shift();
    if (a === '-h' || a === '--help') out.help = true;
    else if (a === '--dry-run') out.dryRun = true;
    else if (a === '--also-auth') out.alsoAuth = true;
    else if (a === '--stdin') out.stdin = true;
    else if (a === '--test') out.test = true;
    else if (a === '--decision-json') out.decisionJson = rest.shift();
    else if (a === '--decision-file') out.decisionFile = rest.shift();
    else if (a === '--pr-url') out.prUrl = rest.shift();
    else if (a === '--url') out.url = rest.shift();
    else if (a === '--store-path') out.storePath = rest.shift();
    else if (a === '--discord-url') out.discordUrl = rest.shift();
    else if (a === '--discord-store-path') out.discordStorePath = rest.shift();
    else if (a === '--targets') out.targets = rest.shift();
    else {
      console.error(`Unknown option: ${a}`);
      out.help = true;
    }
  }
  return out;
}

function printHelp() {
  console.log(`${TOOL_ID} v${TOOL_VERSION} — Fluxer + Discord webhook notifier

Commands:
  notify     POST embed on change actions only (noop → skip exit 0)
  preview    Print payload JSON without posting
  resolve    Check webhook target resolution (redacted)

Options:
  --decision-json <json>
  --decision-file <path>
  --stdin
  --pr-url <url>          Attach PR link to embed
  --also-auth             Also notify on needs_auth
  --dry-run               Resolve + build; do not POST
  --test                  Fluxer only (format/smoke/draft — never Discord)
  --targets <list>        all | test | fluxer | discord | comma-list
  --url <https://...>     Override Fluxer URL (prefer env/store; never commit)
  --store-path <file>     Override Fluxer secrets file path
  --discord-url <https://...>
  --discord-store-path <file>
  -h, --help

Target policy:
  default / --targets all   Production: Fluxer + Discord (same payload)
  --test / --targets test   Format experiments: Fluxer only — never Discord

Webhook secrets (never commit, never log raw URL):
  export FLUXER_WEBHOOK_URL='https://…'
  export DISCORD_WEBHOOK_URL='https://…'
  # or
  printf '%s\\n' 'https://…' > ${DEFAULT_WEBHOOK_STORE_PATH}
  printf '%s\\n' 'https://…' > ${DEFAULT_DISCORD_WEBHOOK_STORE_PATH}
`);
}

main(process.argv.slice(2)).catch((err) => {
  console.error(`${TOOL_ID} error: ${err?.message || err}`);
  process.exit(1);
});
