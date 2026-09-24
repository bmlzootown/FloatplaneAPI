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
  diffs/{fromObservationId}/  # Phase 2.2 semantic compare artifacts (optional)
    evidence-diff.json
    evidence-diff.md
    status.json
  processing.json             # Phase 2.3 extract/comparison status (optional)
```

Also: `artifacts/frontend/phase2-processing-index.json` (Phase 2.3 global index; not LKG).

Phase 2 never changes `observationId` or Phase 1 compared artifacts. Run with
`make frontend-evidence` / `make frontend-evidence-diff FROM=… TO=…` /
`make frontend-monitor-phase2-json` (see `tools/fp-frontend-evidence/README.md`).

**Growth:** Phase 1 entry+manifest ~1.8 MB; Phase 2 reachable chunks ~3.5–4.1 MB;
~5–6 MB total per observation. Reachable JS is not pruned.
**Fresh clone:** open `state/last-known-frontend.json` → `artifactDir` → files on disk.
