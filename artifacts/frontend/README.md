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
storage. Expect ~1–2MB growth per distinct observation. Phase 2 may switch strategy
for lazy chunks. Staging lives under `artifacts/frontend/.staging/` (gitignored).

**Fresh clone:** open `state/last-known-frontend.json` → `artifactDir` → files on disk.
