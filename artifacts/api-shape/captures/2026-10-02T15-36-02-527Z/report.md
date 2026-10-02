# API shape canary report — 2026-10-02T15-36-02-527Z

- Compared at: 2026-10-02T15:36:02.527Z
- Drift: **no**

Structural only (added / removed / type-changed paths). Bodies are not stored.

## Notes

- No baselines yet — first capture; use --promote-baselines to seed baselines/
- OIDC clientId=fp-tv-app (evidence: frontend TV config)
- artifacts/frontend/4.5.22-316-d74397b/.../js/index-BZVDPgzb.js — o_={baseUrl:"https://auth.floatplane.com",realm:"floatplane",clientId:"fp-tv-app",...}

## `content-creator-unauth`

_no prior baseline for endpoint_

- Unchanged paths: 0
- Added (1): `$`
- Removed (0): (none)
- Type-changed: (none)

## Labels

- Paths are **observed** live shapes, not OpenAPI authority.
- Do not invent OpenAPI properties from a single sample; treat drift as review evidence.
