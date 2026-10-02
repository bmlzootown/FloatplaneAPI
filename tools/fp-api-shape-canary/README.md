# fp-api-shape-canary (Phase 3.0)

Manual / human-approved **authenticated** REST response-shape canary for Floatplane.

Detects structural drift (added / removed / type-changed JSON paths) on a fixed
read-only allowlist centered on `GET /api/v3/content/post`. Separate lane from
Phase 1/2 frontend watch — does **not** change the 6h Automation schedule or
`PROMPT.md`.

## Auth (Keycloak device flow)

Evidence-backed public OIDC defaults (do not invent clients):

| Field | Value | Evidence |
|-------|--------|----------|
| Issuer | `https://auth.floatplane.com/realms/floatplane` | OIDC discovery |
| Realm | `floatplane` | Frontend TV config + discovery |
| clientId | `fp-tv-app` | Frontend entry JS `clientId:"fp-tv-app"` |
| Device grant | `urn:ietf:params:oauth:grant-type:device_code` | Discovery `grant_types_supported` |
| PKCE | S256 (`code_challenge` + `code_verifier`) | Frontend `USE_CODE_CHALLENGE`; Keycloak requires it |
| DPoP | ES256 proof on token + REST | Frontend `USE_DPOP` / `usesExtendedSecurity:!0` |

REST probes use DPoP-bound access tokens (`Authorization: DPoP …` + `DPoP` proof).
Never commit secrets. Default auth file `state/api-shape-auth.local.json` is gitignored
(includes access token + DPoP private JWK). Bare `state/api-shape-token.local` alone is
not enough for live `fp-tv-app` APIs.

```sh
# Human approves the device code in a browser
make api-shape-device-login
# → writes state/api-shape-auth.local.json (0600)

make api-shape-capture
```

## Allowlist (read-only)

1. `GET /api/v3/user/self` — token sanity  
2. `GET /api/v3/user/subscriptions` — pick subscribed creator  
3. `GET /api/v3/content/creator?id=&limit=1` — list shape + post id  
4. `GET /api/v3/content/post?id=` — **primary canary**  
5. Optional: `GET /api/v3/content/video?id=` (`--include-video`)

Companion (no auth): `make api-shape-unauth-list` → `GET /api/v3/content/creator`.

No writes, no `/delivery/info`, no Hydravion, no OpenAPI/AsyncAPI auto-edits.

## Artifacts

```
artifacts/api-shape/
  README.md
  baselines/{endpointId}.schema.json   # durable field-tree baselines (commit when reviewable)
  captures/{captureId}/
    meta.json                          # calls, notes, oidc evidence refs (no tokens)
    trees/{endpointId}.schema.json     # observed field trees (no response bodies)
    diff.json
    report.md
```

Field trees store **keys + JSON types + nullability only** — not titles, text, or PII.

## Commands

```sh
make api-shape-test                 # offline unit tests
make api-shape-device-login         # interactive Keycloak device flow
make api-shape-capture              # gated on FP_ACCESS_TOKEN or token file
make api-shape-unauth-list           # no secrets
make api-shape-diff-trees FROM=… TO=…
```

Exit codes: `0` ok · `1` failure · `2` structural drift · `3` needs human auth.

## First baseline (operator)

1. `make api-shape-device-login` and approve the user code.  
2. `make api-shape-capture` (first successful `content-post` tree auto-promotes `baselines/`).  
3. Commit **field-tree** baselines + capture meta/report via human PR when ready.  
4. Later captures exit `2` on structural drift for review.
