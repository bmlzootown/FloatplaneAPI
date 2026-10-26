# fp-notify — Fluxer / Discord webhook alerts

Small shared notifier for FloatplaneAPI monitors. Posts **only on change**
(`open_shape_pr` / `update_shape_pr` / `open_monitor_pr` / `update_monitor_pr`).
`noop` and most failures skip quietly (exit 0).

Fluxer webhooks accept Discord-compatible JSON (`content`, `embeds`, …).

Alerts are written for a human skim in Discord/Fluxer: plain-language title,
short summary, and (for shape drift) a **before → after** JSON fragment.
Orchestrator action names / capture IDs stay in the footer, not the headline.

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

## Payload shape (sample — shape drift)

```json
{
  "username": "FloatplaneAPI Watch",
  "embeds": [
    {
      "title": "Floatplane removed a field from content posts",
      "description": "content posts: removed `creator.discoverable`.\nCompared against the last committed baseline. Read-only check — no OpenAPI edits.",
      "color": 15105570,
      "fields": [
        {
          "name": "content posts",
          "value": "**Removed**\n− `creator.discoverable`"
        },
        {
          "name": "Example response fragment",
          "value": "**Before → after (illustrative; field-trees only — not a live body)**\n**Before**\n```json\n{\n  \"creator\": {\n    \"discoverable\": true\n  }\n}\n```\n**After**\n```json\n{\n  \"creator\": {}\n}\n```"
        },
        {
          "name": "Review",
          "value": "[Open pull request](https://github.com/…/pull/13)"
        }
      ],
      "footer": {
        "text": "API shape canary · read-only · capture 2026-10-19T03-01-32-094Z · open_shape_pr"
      },
      "timestamp": "2026-10-19T03:01:00.000Z"
    }
  ]
}
```

Before/after prefers **live sanitized bodies** when the decision includes
`sampleBefore` / `sampleAfter` (from canary `captures/*/samples/*.sanitized.json`,
focused around drifted paths). Live samples render as separate Before/After embed
fields under Discord's 1024-char cap. Otherwise it synthesizes a minimal
**illustrative** fragment from field paths (labeled as such).

Frontend alerts summarize the new build id + evidence headline and explicitly
state they are **not** server API claims. Action names stay in the footer.

## Limits

Payloads are truncated to Discord/Fluxer limits (~2000 content, ~1024 field
values, soft ~5500 total JSON).
