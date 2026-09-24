# Frontend watch state

Machine-readable last-known-good observation for Phase 1 frontend watching.

## File

- `last-known-frontend.json` — written by `tools/fp-frontend-watch/cli.mjs check` on successful observations that change (or on first run). Failed checks never overwrite this file.

## Schema (`schemaVersion: 1`)

| Field | Meaning |
|-------|---------|
| `buildId` | Deployed frontend id from homepage asset URLs (e.g. `4.5.22-316-d74397b`) |
| `layout` | `vite-user` (current) or `angular-version` (legacy) |
| `baseUrl` | CDN base for that build |
| `homepageUrl` | Page used for discovery |
| `discoveryMethod` | Always `homepage-html-asset-urls` in Phase 1 |
| `observedAt` | ISO-8601 time of successful observation |
| `artifactDir` | Repo-relative archive path |
| `artifacts[]` | Compared CDN artifacts only: `{ path, url, sha256, bytes, contentType }` (homepage HTML is archived under `_discovery/` but not compared — it often includes volatile challenge markup) |
| `noteworthy` | Optional notes (e.g. same-path content conflicts) |

Build id and artifact hashes are separate identity axes: either changing means a deployment change.
