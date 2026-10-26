# fp-notify — Fluxer / Discord webhook alerts

Small shared notifier for FloatplaneAPI monitors. Posts **only on change**
(`open_shape_pr` / `update_shape_pr` / `open_monitor_pr` / `update_monitor_pr`).
`noop` and most failures skip quietly (exit 0).

Fluxer webhooks accept Discord-compatible JSON (`content`, `embeds`, …).

Alerts are written for a human skim: plain-language title, short summary,
`Observed on: /api/v3/…` (shape) or build id change (frontend), and (for shape)
before → after JSON. **No PR review section.** Footer is a Discord relative/local
timestamp only (`<t:unix:R> · <t:unix:f>`).

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
# After a monitor decision:
node tools/fp-notify/cli.mjs notify --decision-file /tmp/decision.json

# Preview payload without POST
node tools/fp-notify/cli.mjs preview --decision-json '{"action":"open_shape_pr",...}'

# Dry-run POST path
node tools/fp-notify/cli.mjs notify --decision-file d.json --dry-run

make notify-test
```

## Payload shape (sample — shape drift)

```json
{
  "username": "FloatplaneAPI Watch",
  "embeds": [
    {
      "title": "Floatplane removed a field from content posts",
      "description": "Observed on: `/api/v3/content/post`\nRemoved `creator.discoverable` from content posts.",
      "color": 15105570,
      "fields": [
        {
          "name": "content posts",
          "value": "**Removed**\n− `creator.discoverable`"
        },
        {
          "name": "Before (live sanitized)",
          "value": "```json\n{ \"creator\": { \"discoverable\": true } }\n```",
          "inline": true
        },
        {
          "name": "After (live sanitized)",
          "value": "```json\n{ \"creator\": { \"title\": \"LinusTechTips\" } }\n```",
          "inline": true
        }
      ],
      "footer": { "text": "<t:1729911676:R> · <t:1729911676:f>" },
      "timestamp": "2026-10-26T03:01:16.000Z"
    }
  ]
}
```

Before/after prefers **live sanitized bodies** when present. **No silent mid-JSON
truncation** — oversized samples split into continued fields/messages. Side-by-side
`inline: true` when both fit one field each.

Frontend alerts: build id changed + brief human summary when available. No
“What we saw” status jargon, pending-observations noise, or PR review links.

## Limits

Field values ≤1024; embed packing splits rather than ellipsizing sample JSON.
