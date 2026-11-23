# API shape canary report — 2026-11-21T20-23-37-899Z

- Compared at: 2026-11-21T20:23:37.899Z
- Drift: **YES**

Structural only (added / removed / type-changed paths). Bodies are not stored.

## Notes

- Token present (eyJh…4SGg (len=1513)); auth=DPoP
- Preferring LinusTechTips (59f94c0bdd241b70349eb72b) for content samples
- content-post sample is LinusTechTips
- OIDC clientId=fp-tv-app (evidence: frontend TV config)
- artifacts/frontend/4.5.22-316-d74397b/.../js/index-BZVDPgzb.js — o_={baseUrl:"https://auth.floatplane.com",realm:"floatplane",clientId:"fp-tv-app",usesExtendedSecurity:!0,...}

## `content-creator`

- Unchanged paths: 67
- Added (0): (none)
- Removed (5): `$[].channel.icon.childImages[].height`, `$[].channel.icon.childImages[].path`, `$[].channel.icon.childImages[].width`, `$[].metadata.galleryCount`, `$[].metadata.hasGallery`
- Type-changed:
  - `$[].channel.icon.childImages[]`: `object` → `unknown`

## `content-post`

- Unchanged paths: 123
- Added (0): (none)
- Removed (18): `channel.icon.childImages[].height`, `channel.icon.childImages[].path`, `channel.icon.childImages[].width`, `creator.card`, `creator.category`, `creator.cover`, `creator.defaultChannel`, `creator.discoverable`, `creator.incomeDisplay`, `creator.liveStream`, `creator.owner`, `creator.subscriberCountDisplay` … (+6 more)
- Type-changed:
  - `channel.icon.childImages[]`: `object` → `unknown`

## `user-self`

- Unchanged paths: 22
- Added (0): (none)
- Removed (0): (none)
- Type-changed: (none)

## `user-subscriptions`

- Unchanged paths: 26
- Added (3): `$[].plan.allowPromotionCodes`, `$[].plan.priceMinor`, `$[].plan.priceYearlyMinor`
- Removed (0): (none)
- Type-changed: (none)

## Labels

- Paths are **observed** live shapes, not OpenAPI authority.
- Do not invent OpenAPI properties from a single sample; treat drift as review evidence.
