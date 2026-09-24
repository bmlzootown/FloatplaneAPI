# Frontend artifacts (Phase 1.1)

Observations are stored under content-derived IDs so same-build content changes
do not overwrite prior bytes:

```
artifacts/frontend/{buildId}/{observationId}/
  observation.json
  js/… or assets/…          # raw downloaded entry (SHA-256 of these bytes)
  manifest.floatplane.webmanifest
  _discovery/homepage.html  # evidence only; gitignored (volatile)
```

`observationId` = SHA-256 over sorted `path\\nsha256\\n` lines of the **compared**
CDN artifacts (entry + manifest). Timestamps are metadata only.

**Persistence:** Phase 1 monitored artifacts (entry JS + manifest + observation.json)
are committed to git so a fresh clone can read prior archived bytes without external
storage. Expect ~1–2MB growth per distinct observation. Staging lives under
`artifacts/frontend/.staging/` (gitignored).

**Phase 2.1** (optional elaboration, same `observationId`):

```
phase2/
  status.json
  chunk-graph.json
  chunks/js/…                 # reachable lazy JS bytes (~2.5MB for current build)
  api-evidence.json
  api-evidence.inventory.md
```

Phase 2 never changes `observationId` or Phase 1 compared artifacts. Run with
`make frontend-evidence` (see `tools/fp-frontend-evidence/README.md`).

**Fresh clone:** open `state/last-known-frontend.json` → `artifactDir` → files on disk.
