# Frontend watch state

Machine-readable last-known-good observation for Phase 1 frontend watching.

## File

- `last-known-frontend.json` — written only after a fully promoted observation.
  Failed checks never overwrite this file.

## Schema (`schemaVersion: 2`)

| Field | Meaning |
|-------|---------|
| `observationId` | Content fingerprint (SHA-256 over sorted compared artifact path+hash lines) |
| `previousObservationId` | Immediately preceding successful observation id, or `null` |
| `buildId` | Deployed frontend id from homepage asset URLs |
| `layout` | `vite-user` (current) or `angular-version` (legacy) |
| `baseUrl` | CDN base for that build |
| `homepageUrl` | Page used for discovery |
| `discoveryMethod` | `homepage-html-asset-urls` |
| `observedAt` | ISO-8601 metadata for when this fingerprint was first recorded as LKG |
| `artifactDir` | Repo-relative path `artifacts/frontend/{buildId}/{observationId}` |
| `artifacts[]` | Compared CDN artifacts: `{ path, url, sha256, bytes, contentType }` |

Build id and artifact hashes are independent signals. `observationId` changes iff
the compared artifact set/hashes change. Homepage HTML is not part of the fingerprint.
