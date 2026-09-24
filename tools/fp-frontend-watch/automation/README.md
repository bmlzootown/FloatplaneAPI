# Cursor Automation — Floatplane frontend watch (Phase 1.2)

This directory holds the **exact prompt** and enablement notes for an unattended
Cursor Automation that runs every 6 hours against `bmlzootown/FloatplaneAPI`.

Canonical design doc (project store): ask for `docs/phase-1-2-automation.md` in the
Floatplane API Watch project context, or see the repository summary below.

## Files

| File | Purpose |
|------|---------|
| `PROMPT.md` | Paste into the Automation prompt field (source of truth for agent behavior) |
| `README.md` | This file — enable/test steps |

## Enable in Cursor UI

1. Merge Phase 1 / 1.1 (frontend watcher) and Phase 1.2 (this scaffolding) to `main`.
2. Open [cursor.com/automations](https://cursor.com/automations) → **New automation**.
3. **Trigger:** Scheduled → cron `0 */6 * * *` (every 6 hours, UTC). Scheduled runs may delay but will not start early.
4. **Repository:** Single repository `bmlzootown/FloatplaneAPI`, branch **`main`** (default). Cron defaults to *no* repository — you must attach the repo explicitly so the agent can commit/open PRs.
5. **Tools:** Keep **Pull request creation** enabled. Do **not** enable auto-merge. Memories optional (prefer repo state + GitHub PR markers over memories for duplicate suppression).
6. **Prompt:** paste the full contents of `PROMPT.md`.
7. Save and activate. Run **once manually** from the Automations UI to verify.

## Terraform equivalent (optional)

```hcl
resource "cursor_platform_workflow" "floatplane_frontend_watch" {
  name        = "Floatplane frontend observation"
  description = "Phase 1.2: every 6h frontend watch → observation PR"
  enabled     = true
  prompt      = file("${path.module}/PROMPT.md")
  git_repo    = "github.com/bmlzootown/FloatplaneAPI"
  git_branch  = "main"

  trigger = [{ cron = { schedule = "0 */6 * * *" } }]
  action  = [{ git_pr = {} }]
}
```

## Local dry decision (no Automation)

```sh
# Offline decision tests
make frontend-watch-test

# Live check + decision JSON (needs network + optional gh auth)
make frontend-monitor-json
# or:
node tools/fp-frontend-watch/monitor-orchestrate.mjs --json --with-gh
```
