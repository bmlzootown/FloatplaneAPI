# API shape canary report — 2026-10-02T15-45-52-581Z

- Compared at: 2026-10-02T15:45:52.581Z
- Drift: **no**

Structural only (added / removed / type-changed paths). Bodies are not stored.

## Notes

- Token present (eyJh…qrhw (len=1493)); auth=DPoP
- content-creator for a subscribed creator returned no posts; trying next
- OIDC clientId=fp-tv-app (evidence: frontend TV config)
- artifacts/frontend/4.5.22-316-d74397b/.../js/index-BZVDPgzb.js — o_={baseUrl:"https://auth.floatplane.com",realm:"floatplane",clientId:"fp-tv-app",...}

## `content-creator`

_no prior baseline for endpoint_

- Unchanged paths: 0
- Added (1): `$`
- Removed (0): (none)
- Type-changed: (none)

## `content-post`

_no prior baseline for endpoint_

- Unchanged paths: 0
- Added (1): `$`
- Removed (0): (none)
- Type-changed: (none)

## `user-self`

_no prior baseline for endpoint_

- Unchanged paths: 0
- Added (1): `$`
- Removed (0): (none)
- Type-changed: (none)

## `user-subscriptions`

_no prior baseline for endpoint_

- Unchanged paths: 0
- Added (1): `$`
- Removed (0): (none)
- Type-changed: (none)

## Labels

- Paths are **observed** live shapes, not OpenAPI authority.
- Do not invent OpenAPI properties from a single sample; treat drift as review evidence.
