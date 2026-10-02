# API shape artifacts (Phase 3.0)

Authenticated (and optional unauth list) **response field-tree** baselines for the
Floatplane API Watch canary. Separate from `artifacts/frontend/`.

```
artifacts/api-shape/
  baselines/{endpointId}.schema.json
  captures/{captureId}/
    meta.json
    trees/{endpointId}.schema.json
    diff.json
    report.md
```

- Commit baselines and reviewable capture reports (structure only).
- Never commit access/refresh tokens or raw response bodies with PII/content.
- Token file lives at `state/api-shape-token.local` (gitignored).

See `tools/fp-api-shape-canary/README.md`.
