# fp-frontend-evidence (Phase 2.1)

Deterministic reachable Vite chunk discovery + API/network evidence extraction
for **one** Phase 1 observation. Does not classify inter-observation changes,
edit OpenAPI/AsyncAPI, or write Phase 1 last-known-good state.

```sh
# Last-known observation from state/last-known-frontend.json
make frontend-evidence
# or:
node tools/fp-frontend-evidence/cli.mjs extract

# Explicit observation
make frontend-evidence OBSERVATION=f71e83fd15643cf82c9cb6a0cf17089067a7d8a689022ae3b4a261a649f5bf8b

# Offline unit tests
make frontend-evidence-test
```

## Outputs

Under `artifacts/frontend/{buildId}/{observationId}/phase2/`:

| File | Role |
|------|------|
| `status.json` | complete/incomplete + extractor version + entry sha256 |
| `chunk-graph.json` | Reachable module graph, hashes, discovery edges, retention flags |
| `chunks/js/*.js` | Archived lazy JS bytes (Phase 2.1: all reachable) |
| `api-evidence.json` | Versioned machine-readable evidence inventory |
| `api-evidence.inventory.md` | Human review table (METHOD PATH SOURCE) |

Entry JS remains the Phase 1 artifact at `js/index-….js` (not duplicated into `phase2/chunks/`).

## Principles

- Prefer structured `{path,method}` client ops (`structured_operation`).
- Weaker signals (`url_template`, `network_reference`, …) are never auto-promoted.
- Evidence IDs are semantic (category + method + normalized path + structural context).
- Partial chunk-fetch failure ⇒ incomplete status; no published complete inventory.
- Phase 1 watch/automation remains independent if Phase 2 fails.
