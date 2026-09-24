# fp-frontend-evidence (Phase 2.1 + 2.2)

**Phase 2.1 / 2.1.1** — Deterministic reachable Vite chunk discovery + API/network
evidence extraction for **one** Phase 1 observation.

**Phase 2.2** — Deterministic semantic diff between two archived evidence inventories.
Does not edit OpenAPI/AsyncAPI, write Phase 1 LKG, probe live APIs, or auto-wire the 6h watcher.

```sh
make frontend-evidence
make frontend-evidence OBSERVATION=<observationId>
make frontend-evidence-test

make frontend-evidence-diff FROM=<observationId> TO=<observationId>
make frontend-evidence-diff-latest
make frontend-evidence-diff-test
```

## Phase 2.1.1

- Stable structured ids: `structured_operation:METHOD:path` (+ `provenance[]`)
- Graph `closure` with `complete` / `complete_with_external_rejects` / `incomplete` + `refuseRemoval`
- Explicit KeyOS/external rejects (`whyNotFollowed`, never fetched)
- TV + web route roots on the same observation
- Pre-promote inventory invariants

## Phase 2.2 / 2.2.1

- **Directional** completeness gating: additions need FROM complete; disappearances need TO complete; method-set needs both
- `additionConclusionsAllowed` / `disappearanceConclusionsAllowed` / `methodSetConclusionsAllowed` + `suppressedChanges[]`
- Structured op add/disappear / method-set (derived) / provenance_moved
- Request / auth / response-mapper / realtime / weak categories (weak never promoted)
- Frontend-churn suppression (hash rename path moves as provenance only; offsets/minify/dup provenance suppressed)
- Atomic vs derived counts (`totalAtomic` / `totalDerived`) — do not triple-count method-set with add/disappear
- Outputs under `phase2/diffs/{fromObservationId}/` on the **TO** observation only
- Idempotent transactional promote; source inventories never mutated
- Comparator `2.2.1`, diff schema v2

## Outputs

Under `artifacts/frontend/{buildId}/{observationId}/phase2/`:

| File | Role |
|------|------|
| `status.json` | closure status + extractor version + entry sha256 |
| `chunk-graph.json` | Reachable graph, closure, frontendRoots, hashes |
| `chunks/js/*.js` | Archived lazy JS bytes (Phase 2.1: all reachable) |
| `api-evidence.json` | Versioned machine-readable evidence inventory (schema v2) |
| `api-evidence.inventory.md` | Human review table (METHOD PATH SOURCE) |
| `diffs/{fromObs}/evidence-diff.json` | Phase 2.2 machine diff (schema v2) |
| `diffs/{fromObs}/evidence-diff.md` | Phase 2.2 human report |
| `diffs/{fromObs}/status.json` | Diff promote fingerprint |

Entry JS remains the Phase 1 artifact at `js/index-….js`.

See project store `docs/phase-2-1-evidence-extraction.md` and `docs/phase-2-2-evidence-diff.md`.
