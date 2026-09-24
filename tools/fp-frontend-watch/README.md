# fp-frontend-watch (Phase 1 / 1.1 / 1.2)

Detect and archive Floatplane frontend deployments from observable `floatplane.com` behavior.

```sh
node tools/fp-frontend-watch/cli.mjs discover
node tools/fp-frontend-watch/cli.mjs check
node --test tests/frontend-watch/frontend-watch.test.mjs tests/frontend-watch/monitor-orchestrate.test.mjs

# Phase 1.2 — Automation decision JSON (watcher remains source of truth)
node tools/fp-frontend-watch/monitor-orchestrate.mjs --json --with-gh
```

Layout: `artifacts/frontend/{buildId}/{observationId}/` with content-derived observation IDs, transactional staging→promote, durable in-repo entry/manifest bytes, HTTP timeouts, and lineage via `previousObservationId`.

**Phase 1.2:** `monitor-orchestrate.mjs` + `automation/PROMPT.md` configure unattended Cursor Automation (6-hour cron) with duplicate-PR suppression on `cursor/frontend-observation`. See `automation/README.md`.

See the repository README section **Frontend deployment watch (Phase 1)**.
