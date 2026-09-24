# fp-frontend-watch (Phase 1 / 1.1 / 1.2 / 2.3 entry)

Detect and archive Floatplane frontend deployments from observable `floatplane.com` behavior.

```sh
node tools/fp-frontend-watch/cli.mjs discover
node tools/fp-frontend-watch/cli.mjs check
node --test tests/frontend-watch/frontend-watch.test.mjs tests/frontend-watch/monitor-orchestrate.test.mjs

# Phase 1.2 — cumulative pending ledger decision JSON (refreshes origin/main first)
node tools/fp-frontend-watch/monitor-orchestrate.mjs --json
# Optional local/CI: add --run-tests (not used on scheduled Automation cycles)

# Phase 2.3 — unified scheduled command (Phase 1 + backlog extract/compare + PR hints)
node tools/fp-frontend-watch/monitor-phase2-orchestrate.mjs --json
# make frontend-monitor-phase2-json
```

Layout: `artifacts/frontend/{buildId}/{observationId}/` with content-derived observation IDs, transactional staging→promote, durable in-repo entry/manifest bytes, HTTP timeouts, and lineage via `previousObservationId`.

**Phase 1.2:** `monitor-orchestrate.mjs` + `automation/PROMPT.md` configure unattended Cursor Automation (6-hour cron). Monitoring branch `cursor/frontend-observation` is a **cumulative pending ledger** (A→B→C on one PR). See `automation/README.md`.

**Phase 2.3:** `monitor-phase2-orchestrate.mjs` wraps Phase 1 sync/watch with Phase 2.1 extract + Phase 2.2 compare backlog. Observe commits stay durable if Phase 2 fails. Live subscription still uses Phase 1.2 `PROMPT.md` until review activates the proposed Phase 2.3 prompt.

See the repository README section **Frontend deployment watch (Phase 1)**.
