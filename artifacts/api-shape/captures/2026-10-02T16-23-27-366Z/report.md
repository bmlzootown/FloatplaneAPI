# API shape canary report — 2026-10-02T16-23-27-366Z

- Compared at: 2026-10-02T16:23:27.366Z
- Drift: **no**

Structural only (added / removed / type-changed paths). Bodies are not stored.

## Notes

- Token present (eyJh…LvaQ (len=1493)); auth=DPoP
- content-creator for a subscribed creator returned no posts; trying next
- OIDC clientId=fp-tv-app (evidence: frontend TV config)
- artifacts/frontend/4.5.22-316-d74397b/.../js/index-BZVDPgzb.js — o_={baseUrl:"https://auth.floatplane.com",realm:"floatplane",clientId:"fp-tv-app",...}

## `content-creator`

- Unchanged paths: 73
- Added (0): (none)
- Removed (0): (none)
- Type-changed: (none)

## `content-post`

- Unchanged paths: 142
- Added (0): (none)
- Removed (0): (none)
- Type-changed: (none)

## `content-video`

_no prior baseline for endpoint_

- Unchanged paths: 0
- Added (1): `$`
- Removed (0): (none)
- Type-changed: (none)

## `user-self`

- Unchanged paths: 22
- Added (0): (none)
- Removed (0): (none)
- Type-changed: (none)

## `user-subscriptions`

- Unchanged paths: 26
- Added (0): (none)
- Removed (0): (none)
- Type-changed: (none)

## Labels

- Paths are **observed** live shapes, not OpenAPI authority.
- Do not invent OpenAPI properties from a single sample; treat drift as review evidence.
