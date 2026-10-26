# fp-notify — Fluxer + Discord webhook alerts

Small shared notifier for FloatplaneAPI monitors. Posts **only on change**
(`open_shape_pr` / `update_shape_pr` / `open_monitor_pr` / `update_monitor_pr`).
`noop` and most failures skip quietly (exit 0).

Both Fluxer and Discord accept Discord-compatible JSON (`content`, `embeds`, …).

Alerts are written for a human skim: plain-language title, short summary,
`Observed on: /api/v3/…` (shape) or build id change (frontend), and (for shape)
before → after JSON. **No PR review section.** Footer is a plain absolute UTC
timestamp only (e.g. `2026-10-26 03:01:16 UTC`) — Fluxer does not render Discord `<t:>` tags.

## Target policy

| Mode | CLI | Destinations |
|------|-----|----------------|
| **Production / live** (default) | `notify` / `--targets all` | **Fluxer + Discord** (Discord gets an extra public sanitize pass) |
| **Test / draft / preview / smoke** | `notify --test` / `--targets test` | **Fluxer only** — never Discord |
| Single override | `--targets fluxer` or `--targets discord` | That webhook only |

`preview` prints the payload and never POSTs.

### Discord-only public sanitize

Fluxer is private. Before POSTing to Discord, `fp-notify` rewrites embed JSON samples to censor:

- **user-self** identity (username, displayName, account id, profileImage, …)
- **subscription** start/end dates, plan prices, bare creator ids

Public **content-\*** (LTT) nested creator objects are kept. See `lib/discord-public-sanitize.mjs`.

## Configure webhook URLs (never commit)

```sh
# Fluxer
export FLUXER_WEBHOOK_URL='https://fluxer.example/api/v1/webhooks/<id>/<token>'
# Discord (production fan-out)
export DISCORD_WEBHOOK_URL='https://discord.com/api/webhooks/<id>/<token>'

# Or Project Agent Store secret files (single HTTPS URL line each)
printf '%s\n' 'https://…' > /cursor/stores/bc-fa3a528a-7e46-4d0e-a9de-c45e84b52445/secrets/fluxer-webhook.url
printf '%s\n' 'https://…' > /cursor/stores/bc-fa3a528a-7e46-4d0e-a9de-c45e84b52445/secrets/discord-webhook.url
chmod 600 /cursor/stores/bc-fa3a528a-7e46-4d0e-a9de-c45e84b52445/secrets/*-webhook.url
```

Also accepts `FP_FLUXER_WEBHOOK_URL`, `FLUXER_WEBHOOK_URL_FILE`, `FP_FLUXER_WEBHOOK_FILE`,
`FP_DISCORD_WEBHOOK_URL`, `DISCORD_WEBHOOK_URL_FILE`, `FP_DISCORD_WEBHOOK_FILE`.
**Never log** raw URLs. Resolution reports only a redacted origin.

If no requested target is configured → `skipped: true`, exit 0 (Automation must not fail).
Missing Discord with Fluxer present still notifies Fluxer (and vice versa for explicit single targets).

## Usage

```sh
# After a monitor decision (production → both webhooks):
node tools/fp-notify/cli.mjs notify --decision-file /tmp/decision.json

# Format / smoke re-post (Fluxer only — never Discord):
node tools/fp-notify/cli.mjs notify --decision-file /tmp/decision.json --test

# Discord-only (rare catch-up):
node tools/fp-notify/cli.mjs notify --decision-file /tmp/decision.json --targets discord

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
      "footer": { "text": "2026-10-26 03:01:16 UTC" },
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
