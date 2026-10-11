# Cursor Automation — authenticated API shape canary (Phase 3.1)

Separate scheduled lane from the **6h frontend** Automation.

## Files

| File | Purpose |
|------|---------|
| `PROMPT.md` | Automation prompt for Phase 3.1 schedule orchestrator |
| `README.md` | Enable / subscribe steps (coordinator attaches timer) |

## Enable (coordinator)

This tooling prepares the prompt + make target. **Do not** create the Project timer
subscription from an agent unless the coordinator explicitly asks.

1. Open Cursor Automations / Project timer UI.
2. **Trigger:** Scheduled — suggested cron `0 3 * * 1` (weekly Monday 03:00 UTC).
3. **Repository:** `bmlzootown/FloatplaneAPI`, branch **`main`**.
4. **Tools:** Pull request creation enabled; auto-merge **off**.
5. **Prompt:** paste/live-sync `PROMPT.md`.
6. **Secrets / local state:** ensure the runner can read gitignored
   `state/api-shape-auth.local.json` (refresh + DPoP). Seed once with
   `make api-shape-device-login SCOPE="openid offline_access"`.
7. Save / attach subscription.

## Scheduled command

```sh
node tools/fp-api-shape-canary/schedule-orchestrate.mjs --json
# or
make api-shape-schedule-json
```

## Local operator commands

```sh
make api-shape-test
make api-shape-device-login SCOPE="openid offline_access"
make api-shape-probe-refresh          # redacted rolling-refresh evidence
make api-shape-schedule-json          # decision JSON
```
