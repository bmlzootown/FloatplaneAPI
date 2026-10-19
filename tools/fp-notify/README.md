# fp-notify — Fluxer / Discord webhook alerts

Small shared notifier for FloatplaneAPI monitors. Posts **only on change**
(`open_shape_pr` / `update_shape_pr` / `open_monitor_pr` / `update_monitor_pr`).
`noop` and most failures skip quietly (exit 0).

Fluxer webhooks accept Discord-compatible JSON (`content`, `embeds`, …).

## Configure webhook URL (never commit)

```sh
# Env (preferred)
export FLUXER_WEBHOOK_URL='https://fluxer.example/api/v1/webhooks/<id>/<token>'

# Or Project Agent Store secret file (single HTTPS URL line)
printf '%s\n' 'https://…' > /cursor/stores/bc-fa3a528a-7e46-4d0e-a9de-c45e84b52445/secrets/fluxer-webhook.url
chmod 600 /cursor/stores/bc-fa3a528a-7e46-4d0e-a9de-c45e84b52445/secrets/fluxer-webhook.url
```

Also accepts `FP_FLUXER_WEBHOOK_URL`, `FLUXER_WEBHOOK_URL_FILE`, `FP_FLUXER_WEBHOOK_FILE`.
**Never log** the raw URL. Resolution reports only a redacted origin.

If unset → `skipped: true`, exit 0 (Automation must not fail).

## Usage

```sh
# After a monitor decision + PR open/update:
node tools/fp-notify/cli.mjs notify --decision-file /tmp/decision.json --pr-url "$PR_URL"

# Preview payload without POST
node tools/fp-notify/cli.mjs preview --decision-json '{"action":"open_shape_pr",...}'

# Dry-run POST path
node tools/fp-notify/cli.mjs notify --decision-file d.json --dry-run

make notify-test
```

Orchestrators also accept `--notify` / `--notify-dry-run` / `--pr-url` (optional;
Automation prompts call this CLI after PR URL is known).

## Payload shape (sample)

```json
{
  "username": "FloatplaneAPI Watch",
  "embeds": [
    {
      "title": "API response-shape drift",
      "description": "Structural field-tree change vs committed baselines.\n**Read-only canary · no OpenAPI auto-edit · no Hydravion.**",
      "color": 15105570,
      "fields": [
        { "name": "Action", "value": "`open_shape_pr`", "inline": true },
        { "name": "Capture", "value": "`2026-10-19T03-00-00Z`", "inline": true },
        {
          "name": "content-post",
          "value": "**removed**\n− `creator.discoverable`\n**added**\n+ `creator.someNewField`"
        },
        { "name": "PR", "value": "https://github.com/…/pull/13" }
      ],
      "footer": { "text": "Phase 3.1 api-shape-canary" },
      "timestamp": "2026-10-19T03:01:00.000Z"
    }
  ]
}
```

Frontend alerts summarize build id + evidence/commit delta and explicitly
state they are **not** server API claims.

## Limits

Payloads are truncated to Discord/Fluxer limits (~2000 content, ~1024 field
values, soft ~5500 total JSON).
