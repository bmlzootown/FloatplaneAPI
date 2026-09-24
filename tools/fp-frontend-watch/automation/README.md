# Cursor Automation — Floatplane frontend watch (Phase 1.2 / Phase 2.3)

Unattended Cursor Automation every **6 hours** against `bmlzootown/FloatplaneAPI`.

**Pending ledger model:** `main` is authoritative; `cursor/frontend-observation` accumulates A→B→C while one monitoring PR is open. No force-reset/supersede from main.

## Files

| File | Purpose |
|------|---------|
| `PROMPT.md` | **Live** Automation prompt (Phase 1.2 + Phase 2.3 unified orchestrator) |
| `PROMPT.phase-2-3.proposed.md` | Activation pointer — content now lives in `PROMPT.md` |
| `README.md` | This file — enable/test steps |

## Enable in Cursor UI

1. Open [cursor.com/automations](https://cursor.com/automations) → existing frontend watch automation.
2. **Trigger:** Scheduled → cron `0 */6 * * *` (UTC).
3. **Repository:** Single repo `bmlzootown/FloatplaneAPI`, branch **`main`**.
4. **Tools:** Keep **Pull request creation** enabled. Do **not** enable auto-merge.
5. **Prompt:** use live `PROMPT.md` (Phase 1.2 + Phase 2.3).
6. Save.

## Scheduled command

| Mode | Command |
|------|---------|
| Live (Phase 1.2 + 2.3) | `node tools/fp-frontend-watch/monitor-phase2-orchestrate.mjs --json` |
| Phase 1.2 only (legacy) | `node tools/fp-frontend-watch/monitor-orchestrate.mjs --json` |

Do **not** pass `--run-tests` on routine cycles.

```sh
# Offline tests (local/CI only)
make frontend-watch-test
make frontend-phase2-orch-test

# Phase 1.2 only
make frontend-monitor-json

# Phase 2.3 unified (live scheduled path)
make frontend-monitor-phase2-json
```
