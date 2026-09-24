# fp-frontend-evidence (Phase 2.1 / 2.1.1)

Deterministic reachable Vite chunk discovery + API/network evidence extraction
for **one** Phase 1 observation. Does not classify inter-observation changes,
edit OpenAPI/AsyncAPI, or write Phase 1 last-known-good state.

```sh
make frontend-evidence
make frontend-evidence OBSERVATION=<observationId>
make frontend-evidence-test
```

## Phase 2.1.1

- Stable structured ids: `structured_operation:METHOD:path` (+ `provenance[]`)
- Graph `closure` with `complete` / `complete_with_external_rejects` / `incomplete` + `refuseRemoval`
- Explicit KeyOS/external rejects (`whyNotFollowed`, never fetched)
- TV + web route roots on the same observation
- Pre-promote inventory invariants

## Outputs

Under `artifacts/frontend/{buildId}/{observationId}/phase2/`:

| File | Role |
|------|------|
| `status.json` | closure status + extractor version + entry sha256 |
| `chunk-graph.json` | Reachable graph, closure, frontendRoots, hashes |
| `chunks/js/*.js` | Archived lazy JS bytes (Phase 2.1: all reachable) |
| `api-evidence.json` | Versioned machine-readable evidence inventory (schema v2) |
| `api-evidence.inventory.md` | Human review table (METHOD PATH SOURCE) |

Entry JS remains the Phase 1 artifact at `js/index-….js`.

See project store `docs/phase-2-1-evidence-extraction.md`.
