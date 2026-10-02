# Sanitized API response examples (Phase A)

Generated from a live authenticated capture via `fp-api-shape-canary` with
`--write-examples`. Values are redacted (titles, text/markdown, email,
usernames, payment IDs, CDN paths, opaque ids). **Do not** commit
`captures/*/raw/` — that directory is gitignored.

Apply into OpenAPI with:

```sh
node tools/fp-api-shape-canary/cli.mjs apply-examples
make trim && make docs-explorer
```

Source capture: `2026-10-02T16-23-27-366Z`
