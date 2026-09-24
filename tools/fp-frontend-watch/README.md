# fp-frontend-watch (Phase 1 / 1.1)

Detect and archive Floatplane frontend deployments from observable `floatplane.com` behavior.

```sh
node tools/fp-frontend-watch/cli.mjs discover
node tools/fp-frontend-watch/cli.mjs check
node --test tests/frontend-watch/frontend-watch.test.mjs
```

Layout: `artifacts/frontend/{buildId}/{observationId}/` with content-derived observation IDs, transactional staging→promote, durable in-repo entry/manifest bytes, HTTP timeouts, and lineage via `previousObservationId`.

See the repository README section **Frontend deployment watch (Phase 1)**.
