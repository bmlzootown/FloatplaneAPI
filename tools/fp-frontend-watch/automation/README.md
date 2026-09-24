# Cursor Automation — Floatplane frontend watch (Phase 1.2 / Phase 2.3)

Unattended Cursor Automation every **6 hours** against `bmlzootown/FloatplaneAPI`.

**Pending ledger model:** `main` is authoritative; `cursor/frontend-observation` accumulates A→B→C while one monitoring PR is open. No force-reset/supersede from main.

## Files

| File | Purpose |
|------|---------|
| `PROMPT.md` | **Live** Automation prompt (Phase 1.2 only) — do not change until Phase 2.3 is reviewed |
| `PROMPT.phase-2-3.proposed.md` | **Proposed** Phase 1.2+2.3 prompt — activate only after merge + explicit approval |
| `README.md` | This file — enable/test steps |

## Enable in Cursor UI (do not activate Phase 2.3 until ready)

1. Merge Phase 1.1 and Phase 1.2 to `main` (done). Phase 2.3 lands via its own draft PR.
2. Open [cursor.com/automations](https://cursor.com/automations) → existing frontend watch automation.
3. **Trigger:** Scheduled → cron `0 */6 * * *` (UTC).
4. **Repository:** Single repo `bmlzootown/FloatplaneAPI`, branch **`main`**.
5. **Tools:** Keep **Pull request creation** enabled. Do **not** enable auto-merge.
6. **Prompt:** keep live `PROMPT.md` until Phase 2.3 is approved; then replace with `PROMPT.phase-2-3.proposed.md`.
7. Save. **Do not activate Phase 2.3 prompt** until Brandon explicitly enables it.

## Scheduled command

| Mode | Command |
|------|---------|
| Live (Phase 1.2 only) | `node tools/fp-frontend-watch/monitor-orchestrate.mjs --json` |
| After Phase 2.3 activation | `node tools/fp-frontend-watch/monitor-phase2-orchestrate.mjs --json` |

Do **not** pass `--run-tests` on routine cycles.

```sh
# Offline tests (local/CI only)
make frontend-watch-test
make frontend-phase2-orch-test

# Phase 1.2 only
make frontend-monitor-json

# Phase 2.3 unified (local trial; subscription still Phase 1.2 until prompt swap)
make frontend-monitor-phase2-json
```
