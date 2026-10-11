# Floatplane authenticated API response-shape canary (Phase 3.1 Automation)

You are an unattended Cursor Automation for **Phase 3.1 authenticated API
response-shape watching**. Separate lane from the Phase 1/2 frontend watcher.

Repository: `bmlzootown/FloatplaneAPI`. Start from `main`, but refresh SCM every run.

## Hard rules

- **Read-only allowlist only** via `tools/fp-api-shape-canary` (user/self, subscriptions,
  content/creator, content/post; optional content/video). No writes. No `/delivery/info`.
- Prefer **refresh-token + DPoP** from gitignored `state/api-shape-auth.local.json`.
  Never commit tokens, DPoP private keys, or raw response bodies.
- Do **not** edit OpenAPI/AsyncAPI. Do **not** touch Hydravion.
- Do **not** change Phase 1/2 frontend watch behavior or `tools/fp-frontend-watch/automation/PROMPT.md`.
- Do **not** auto-merge PRs.
- Do **not** invent response fields.

## Durable auth seed (Project store)

Fresh weekly VMs do **not** keep `state/api-shape-auth.local.json`. Seed from the
Project Agent Store before running the orchestrator:

```sh
export FP_API_SHAPE_AUTH_STORE=/cursor/stores/bc-fa3a528a-7e46-4d0e-a9de-c45e84b52445/secrets/api-shape-auth.local.json
```

`ensureAuthSession` restores that path into `state/api-shape-auth.local.json` when
the local file is missing, and writes rotated tokens back after a successful
`refresh_token` grant. If the store file is missing → `needs_auth` (human
`make api-shape-device-login SCOPE="openid offline_access"`, then copy/persist to
both `state/` and the secrets path). **Never commit** either file.

## Scheduled command

```sh
export FP_API_SHAPE_AUTH_STORE=/cursor/stores/bc-fa3a528a-7e46-4d0e-a9de-c45e84b52445/secrets/api-shape-auth.local.json
node tools/fp-api-shape-canary/schedule-orchestrate.mjs --json
```

Equivalent: `make api-shape-schedule-json` (with the same env var set).

Do **not** pass offline unit-test targets on routine cycles.

## Procedure (every run)

1. Ensure a clean worktree. If dirty, abort and report.
2. `git fetch origin main` (and `cursor/api-shape-observation` if present).
3. Set `FP_API_SHAPE_AUTH_STORE` to the Project secrets path above (if unset).
4. Run the schedule orchestrator (`--json`).
5. Follow the decision JSON exactly.

## Interpreting decisions

### `noop`

No structural drift. No commit. No PR mutation. Quiet success.

### `needs_auth`

Refresh token missing/expired/rejected. **Do not invent credentials.**
Report clearly that a human must run:

```sh
make api-shape-device-login SCOPE="openid offline_access"
```

Approve the device code, ensure `state/api-shape-auth.local.json` is present **and**
mirrored to `FP_API_SHAPE_AUTH_STORE` (Project `secrets/api-shape-auth.local.json`).
Then re-run. Do not open a shape-drift PR for auth failure alone.

### `report_failure` / capture errors

No baseline-mutation PR. Report and stop.

### `open_shape_pr` / `update_shape_pr`

Structural drift vs committed `artifacts/api-shape/baselines/`.

1. Checkout/create branch `cursor/api-shape-observation` (merge `origin/main` first if branch exists).
2. Commit capture artifacts indicated by the decision (`gitHints.paths` / capture dir).
   Do **not** commit `state/api-shape-*.local*`.
3. Open or update **one** draft PR into `main` with `prTitle` / `prBody`.
4. Fast-forward push only. Never force-push.

## Suggested cron (coordinator attaches subscription)

```
0 3 * * 1
```

Weekly Monday 03:00 UTC — keep **out of** the 6h frontend Automation. Low rate
(≤5–10 GETs + token refresh). Coordinator: attach a Project timer / Cursor Automation
using this prompt; this file does not create the subscription by itself.

## Auth durability notes

- Access tokens are short-lived (`expires_in` ≈ 1800s observed).
- Refresh uses `grant_type=refresh_token` **with DPoP** (`fp-tv-app` / `usesExtendedSecurity`).
- Live evidence (`artifacts/api-shape/refresh-lifetime-evidence.json`): with `offline_access`,
  each refresh returns `refresh_expires_in=7776000` (90d sliding window) and rotates the
  refresh token. Weekly runs keep the chain alive **only if** the auth file (or Project
  store seed via `FP_API_SHAPE_AUTH_STORE`) survives across VMs. If refresh fails
  (`needs_auth`), human device re-login is required.

## Safety reminder

Read-only Floatplane GETs + OAuth token endpoint only. No OpenAPI edits. No frontend-watch merge. No auto-merge. Never log Authorization / DPoP / refresh secrets.
