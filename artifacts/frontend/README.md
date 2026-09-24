# Frontend artifacts (gitignored)

Downloaded Floatplane frontend bundles and discovery snapshots land here:

```
artifacts/frontend/{buildId}/
  _discovery/homepage.html
  _meta/observation.json
  js/index-*.js                  # vite-user layout
  manifest.floatplane.webmanifest
  _conflicts/{iso}/...           # same path, different bytes (never overwrite)
```

This directory is intentionally gitignored (minified JS is large). Manifests and
hashes that matter for comparison live in `state/last-known-frontend.json`.
