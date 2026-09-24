# fp-frontend-watch (Phase 1 / 1.1 / 1.2)

Detect and archive Floatplane frontend deployments from observable `floatplane.com` behavior.

```sh
node tools/fp-frontend-watch/cli.mjs discover
node tools/fp-frontend-watch/cli.mjs check
node --test tests/frontend-watch/frontend-watch.test.mjs tests/frontend-watch/monitor-orchestrate.test.mjs

# Phase 1.2 — cumulative pending ledger decision JSON (refreshes origin/main first)
node tools/fp-frontend-watch/monitor-orchestrate.mjs --json --run-tests
```

Layout: `artifacts/frontend/{buildId}/{observationId}/` with content-derived observation IDs, transactional staging→promote, durable in-repo entry/manifest bytes, HTTP timeouts, and lineage via `previousObservationId`.

**Phase 1.2:** `monitor-orchestrate.mjs` + `automation/PROMPT.md` configure unattended Cursor Automation (6-hour cron). Monitoring branch `cursor/frontend-observation` is a **cumulative pending ledger** (A→B→C on one PR). See `automation/README.md`.

See the repository README section **Frontend deployment watch (Phase 1)**.
