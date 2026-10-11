# API shape artifacts (Phase 3.1)

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
  refresh-evidence.local.json   # gitignored — redacted rolling-refresh probe output
```

- Commit baselines and reviewable capture reports (structure only).
- Never commit access/refresh tokens, DPoP private keys, or raw response bodies with PII/content.
- Auth session: `state/api-shape-auth.local.json` (gitignored; refresh + DPoP).
- Schedule: `make api-shape-schedule-json` (separate from Phase 1/2 frontend watch).

See `tools/fp-api-shape-canary/README.md` and `automation/PROMPT.md`.
