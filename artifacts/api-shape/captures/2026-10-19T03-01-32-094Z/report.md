# API shape canary report — 2026-10-19T03-01-32-094Z

- Compared at: 2026-10-19T03:01:32.094Z
- Drift: **YES**

Structural only (added / removed / type-changed paths). Bodies are not stored.

## Notes

- Token present (eyJh…rKgg (len=1513)); auth=DPoP
- content-creator for a subscribed creator returned no posts; trying next
- OIDC clientId=fp-tv-app (evidence: frontend TV config)
- artifacts/frontend/4.5.22-316-d74397b/.../js/index-BZVDPgzb.js — o_={baseUrl:"https://auth.floatplane.com",realm:"floatplane",clientId:"fp-tv-app",usesExtendedSecurity:!0,...}

## `content-creator`

- Unchanged paths: 73
- Added (0): (none)
- Removed (0): (none)
- Type-changed: (none)

## `content-post`

- Unchanged paths: 141
- Added (0): (none)
- Removed (1): `creator.discoverable`
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
