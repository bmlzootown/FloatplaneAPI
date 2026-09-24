# Cursor Automation — Floatplane frontend watch (Phase 1.2)

Unattended Cursor Automation every **6 hours** against `bmlzootown/FloatplaneAPI`.

**Pending ledger model:** `main` is authoritative; `cursor/frontend-observation` accumulates A→B→C while one monitoring PR is open. No force-reset/supersede from main.

## Files

| File | Purpose |
|------|---------|
| `PROMPT.md` | Paste into the Automation prompt field |
| `README.md` | This file — enable/test steps |

## Enable in Cursor UI (do not activate until ready)

1. Merge Phase 1.1 and Phase 1.2 to `main`.
2. Open [cursor.com/automations](https://cursor.com/automations) → **New automation**.
3. **Trigger:** Scheduled → cron `0 */6 * * *` (UTC). Runs may delay but will not start early.
4. **Repository:** Single repo `bmlzootown/FloatplaneAPI`, branch **`main`**. Cron defaults to *no* repository — attach explicitly.
5. **Tools:** Keep **Pull request creation** enabled. Do **not** enable auto-merge. Do not rely on Memories for ledger state.
6. **Extra safeguard:** If the UI offers “always update stale build” / environment staleness refresh, enable it — orchestration still performs explicit `git fetch` every run.
7. **Prompt:** paste the full contents of `PROMPT.md`.
8. Save. **Do not activate** until Brandon explicitly enables it. Manual test run first when activating later.

## gh / auth

Monitoring correctness uses **fetched git refs** (pending commits on `cursor/frontend-observation`). `gh` / `--with-gh` is optional. Prefer Cursor native GitHub/PR tooling for opening/updating the PR. No PAT required for the decision path.

## Terraform sketch (optional)

```hcl
resource "cursor_platform_workflow" "floatplane_frontend_watch" {
  name        = "Floatplane frontend observation"
  description = "Phase 1.2: every 6h cumulative pending ledger"
  enabled     = false # leave disabled until explicitly activated
  prompt      = file("${path.module}/PROMPT.md")
  git_repo    = "github.com/bmlzootown/FloatplaneAPI"
  git_branch  = "main"

  trigger = [{ cron = { schedule = "0 */6 * * *" } }]
  action  = [{ git_pr = {} }]
}
```

## Local commands

```sh
make frontend-watch-test
make frontend-monitor-json
# or:
node tools/fp-frontend-watch/monitor-orchestrate.mjs --json --run-tests
```
