# Floatplane Frontend API Evidence Changes

From:
`4.5.22-316-d74397b / f71e83fd15643cf82c9cb6a0cf17089067a7d8a689022ae3b4a261a649f5bf8b`

To:
`4.5.25-340-92712da / 8cb81ec3d78e7025ca3787339bbc744b0d42e4daf8a94cbba40e934cf3cb8963`

> **Label:** real archived Floatplane observations.

_Frontend-evidence change report only. **Not** an authoritative server API changelog._

## Extraction status

| Side | Observation | Build | Closure status | refuseRemoval | completeEnough |
| ---- | ----------- | ----- | -------------- | ------------- | -------------- |
| From | `f71e83fd1564…` | `4.5.22-316-d74397b` | `complete_with_external_rejects` | false | true |
| To | `8cb81ec3d78e…` | `4.5.25-340-92712da` | `complete_with_external_rejects` | false | true |

Comparison status: **complete**

### Directional gating (2.2.1)

* Addition conclusions allowed (requires FROM complete): **yes**
* Disappearance conclusions allowed (requires TO complete): **yes**
* Method-set conclusions allowed (requires both complete): **yes**

## Summary

### Atomic (primary facts)

* Structured operations added: **0**
* Structured operations disappeared from frontend evidence: **350**
* Request-construction changes: **0**
* Auth/header evidence changes: **14**
* Response mapper changes: **0**
* Realtime evidence changes: **0**
* Weaker references added: **0**; disappeared: **0**
* Frontend-only / provenance movement: **27**
* Atomic total: **391**

### Derived (grouped — do not triple-count with atomic)

* Method-set changes: **0** (derived from atomic method+path add/disappear on the same path)
* Derived total: **0**

* Authoritative emitted changes (atomic + derived): **391**
* Suppressed (indeterminate) conclusions: **0** — not in authoritative totals

## Structured operation changes (atomic + derived)

| Change | Kind | Method | Path | Evidence |
| ------ | ---- | ------ | ---- | -------- |
| `structured_operation_disappeared` | atomic | GET | `/api/acp/v3/achievement` | from `structured_operation:GET:/api/acp/v3/achievement` · @ js/index-BZVDPgzb.js |
| `structured_operation_disappeared` | atomic | GET | `/api/acp/v3/achievement/list` | from `structured_operation:GET:/api/acp/v3/achievement/list` · @ js/index-BZVDPgzb.js |
| `structured_operation_disappeared` | atomic | GET | `/api/acp/v3/achievement/perk` | from `structured_operation:GET:/api/acp/v3/achievement/perk` · @ js/index-BZVDPgzb.js |
| `structured_operation_disappeared` | atomic | GET | `/api/acp/v3/achievement/perk/list` | from `structured_operation:GET:/api/acp/v3/achievement/perk/list` · @ js/index-BZVDPgzb.js |
| `structured_operation_disappeared` | atomic | GET | `/api/acp/v3/agreement` | from `structured_operation:GET:/api/acp/v3/agreement` · @ js/index-BZVDPgzb.js |
| `structured_operation_disappeared` | atomic | GET | `/api/acp/v3/agreement/list` | from `structured_operation:GET:/api/acp/v3/agreement/list` · @ js/index-BZVDPgzb.js |
| `structured_operation_disappeared` | atomic | GET | `/api/acp/v3/blogPost` | from `structured_operation:GET:/api/acp/v3/blogPost` · @ js/index-BZVDPgzb.js |
| `structured_operation_disappeared` | atomic | GET | `/api/acp/v3/blogPost/list` | from `structured_operation:GET:/api/acp/v3/blogPost/list` · @ js/index-BZVDPgzb.js |
| `structured_operation_disappeared` | atomic | GET | `/api/acp/v3/blogPost/multi` | from `structured_operation:GET:/api/acp/v3/blogPost/multi` · @ js/index-BZVDPgzb.js |
| `structured_operation_disappeared` | atomic | GET | `/api/acp/v3/channel` | from `structured_operation:GET:/api/acp/v3/channel` · @ js/index-BZVDPgzb.js |
| `structured_operation_disappeared` | atomic | GET | `/api/acp/v3/channel/list` | from `structured_operation:GET:/api/acp/v3/channel/list` · @ js/index-BZVDPgzb.js |
| `structured_operation_disappeared` | atomic | GET | `/api/acp/v3/channel/multi` | from `structured_operation:GET:/api/acp/v3/channel/multi` · @ js/index-BZVDPgzb.js |
| `structured_operation_disappeared` | atomic | GET | `/api/acp/v3/chat/channel/list` | from `structured_operation:GET:/api/acp/v3/chat/channel/list` · @ js/index-BZVDPgzb.js |
| `structured_operation_disappeared` | atomic | GET | `/api/acp/v3/chat/list` | from `structured_operation:GET:/api/acp/v3/chat/list` · @ js/index-BZVDPgzb.js |
| `structured_operation_disappeared` | atomic | GET | `/api/acp/v3/content` | from `structured_operation:GET:/api/acp/v3/content` · @ js/index-BZVDPgzb.js |
| `structured_operation_disappeared` | atomic | GET | `/api/acp/v3/content/list` | from `structured_operation:GET:/api/acp/v3/content/list` · @ js/index-BZVDPgzb.js |
| `structured_operation_disappeared` | atomic | GET | `/api/acp/v3/content/multi` | from `structured_operation:GET:/api/acp/v3/content/multi` · @ js/index-BZVDPgzb.js |
| `structured_operation_disappeared` | atomic | GET | `/api/acp/v3/creator` | from `structured_operation:GET:/api/acp/v3/creator` · @ js/index-BZVDPgzb.js |
| `structured_operation_disappeared` | atomic | GET | `/api/acp/v3/creator/category` | from `structured_operation:GET:/api/acp/v3/creator/category` · @ js/index-BZVDPgzb.js |
| `structured_operation_disappeared` | atomic | GET | `/api/acp/v3/creator/category/list` | from `structured_operation:GET:/api/acp/v3/creator/category/list` · @ js/index-BZVDPgzb.js |
| `structured_operation_disappeared` | atomic | GET | `/api/acp/v3/creator/invite/list` | from `structured_operation:GET:/api/acp/v3/creator/invite/list` · @ js/index-BZVDPgzb.js |
| `structured_operation_disappeared` | atomic | GET | `/api/acp/v3/creator/list` | from `structured_operation:GET:/api/acp/v3/creator/list` · @ js/index-BZVDPgzb.js |
| `structured_operation_disappeared` | atomic | GET | `/api/acp/v3/creator/multi` | from `structured_operation:GET:/api/acp/v3/creator/multi` · @ js/index-BZVDPgzb.js |
| `structured_operation_disappeared` | atomic | GET | `/api/acp/v3/creator/urlname/availability` | from `structured_operation:GET:/api/acp/v3/creator/urlname/availability` · @ js/index-BZVDPgzb.js |
| `structured_operation_disappeared` | atomic | GET | `/api/acp/v3/faq` | from `structured_operation:GET:/api/acp/v3/faq` · @ js/index-BZVDPgzb.js |
| `structured_operation_disappeared` | atomic | GET | `/api/acp/v3/faq/list` | from `structured_operation:GET:/api/acp/v3/faq/list` · @ js/index-BZVDPgzb.js |
| `structured_operation_disappeared` | atomic | GET | `/api/acp/v3/ingest` | from `structured_operation:GET:/api/acp/v3/ingest` · @ js/index-BZVDPgzb.js |
| `structured_operation_disappeared` | atomic | GET | `/api/acp/v3/ingest/list` | from `structured_operation:GET:/api/acp/v3/ingest/list` · @ js/index-BZVDPgzb.js |
| `structured_operation_disappeared` | atomic | GET | `/api/acp/v3/invoice/user/list` | from `structured_operation:GET:/api/acp/v3/invoice/user/list` · @ js/index-BZVDPgzb.js |
| `structured_operation_disappeared` | atomic | GET | `/api/acp/v3/invoice/user/processor` | from `structured_operation:GET:/api/acp/v3/invoice/user/processor` · @ js/index-BZVDPgzb.js |
| `structured_operation_disappeared` | atomic | GET | `/api/acp/v3/job/status` | from `structured_operation:GET:/api/acp/v3/job/status` · @ js/index-BZVDPgzb.js |
| `structured_operation_disappeared` | atomic | GET | `/api/acp/v3/moderator/list` | from `structured_operation:GET:/api/acp/v3/moderator/list` · @ js/index-BZVDPgzb.js |
| `structured_operation_disappeared` | atomic | GET | `/api/acp/v3/plan` | from `structured_operation:GET:/api/acp/v3/plan` · @ js/index-BZVDPgzb.js |
| `structured_operation_disappeared` | atomic | GET | `/api/acp/v3/plan/list` | from `structured_operation:GET:/api/acp/v3/plan/list` · @ js/index-BZVDPgzb.js |
| `structured_operation_disappeared` | atomic | GET | `/api/acp/v3/plan/multi` | from `structured_operation:GET:/api/acp/v3/plan/multi` · @ js/index-BZVDPgzb.js |
| `structured_operation_disappeared` | atomic | GET | `/api/acp/v3/promotion` | from `structured_operation:GET:/api/acp/v3/promotion` · @ js/index-BZVDPgzb.js |
| `structured_operation_disappeared` | atomic | GET | `/api/acp/v3/promotion/list` | from `structured_operation:GET:/api/acp/v3/promotion/list` · @ js/index-BZVDPgzb.js |
| `structured_operation_disappeared` | atomic | GET | `/api/acp/v3/promotion/types` | from `structured_operation:GET:/api/acp/v3/promotion/types` · @ js/index-BZVDPgzb.js |
| `structured_operation_disappeared` | atomic | GET | `/api/acp/v3/service-message` | from `structured_operation:GET:/api/acp/v3/service-message` · @ js/index-BZVDPgzb.js |
| `structured_operation_disappeared` | atomic | GET | `/api/acp/v3/service-message/list` | from `structured_operation:GET:/api/acp/v3/service-message/list` · @ js/index-BZVDPgzb.js |
| `structured_operation_disappeared` | atomic | GET | `/api/acp/v3/survey/report` | from `structured_operation:GET:/api/acp/v3/survey/report` · @ js/index-BZVDPgzb.js |
| `structured_operation_disappeared` | atomic | GET | `/api/acp/v3/user` | from `structured_operation:GET:/api/acp/v3/user` · @ js/index-BZVDPgzb.js |
| `structured_operation_disappeared` | atomic | GET | `/api/acp/v3/user/achievement` | from `structured_operation:GET:/api/acp/v3/user/achievement` · @ js/index-BZVDPgzb.js |
| `structured_operation_disappeared` | atomic | GET | `/api/acp/v3/user/export` | from `structured_operation:GET:/api/acp/v3/user/export` · @ js/index-BZVDPgzb.js |
| `structured_operation_disappeared` | atomic | GET | `/api/acp/v3/user/list` | from `structured_operation:GET:/api/acp/v3/user/list` · @ js/index-BZVDPgzb.js |
| `structured_operation_disappeared` | atomic | GET | `/api/cms/v3/achievement` | from `structured_operation:GET:/api/cms/v3/achievement` · @ js/index-BZVDPgzb.js |
| `structured_operation_disappeared` | atomic | GET | `/api/cms/v3/achievement/list` | from `structured_operation:GET:/api/cms/v3/achievement/list` · @ js/index-BZVDPgzb.js |
| `structured_operation_disappeared` | atomic | GET | `/api/cms/v3/achievement/perk` | from `structured_operation:GET:/api/cms/v3/achievement/perk` · @ js/index-BZVDPgzb.js |
| `structured_operation_disappeared` | atomic | GET | `/api/cms/v3/achievement/perk/list` | from `structured_operation:GET:/api/cms/v3/achievement/perk/list` · @ js/index-BZVDPgzb.js |
| `structured_operation_disappeared` | atomic | GET | `/api/cms/v3/blogPost` | from `structured_operation:GET:/api/cms/v3/blogPost` · @ js/index-BZVDPgzb.js |
| `structured_operation_disappeared` | atomic | GET | `/api/cms/v3/blogPost/get` | from `structured_operation:GET:/api/cms/v3/blogPost/get` · @ js/index-BZVDPgzb.js |
| `structured_operation_disappeared` | atomic | GET | `/api/cms/v3/blogPost/list` | from `structured_operation:GET:/api/cms/v3/blogPost/list` · @ js/index-BZVDPgzb.js |
| `structured_operation_disappeared` | atomic | GET | `/api/cms/v3/chat/list` | from `structured_operation:GET:/api/cms/v3/chat/list` · @ js/index-BZVDPgzb.js |
| `structured_operation_disappeared` | atomic | GET | `/api/cms/v3/comment/list` | from `structured_operation:GET:/api/cms/v3/comment/list` · @ js/index-BZVDPgzb.js |
| `structured_operation_disappeared` | atomic | GET | `/api/cms/v3/content` | from `structured_operation:GET:/api/cms/v3/content` · @ js/index-BZVDPgzb.js |
| `structured_operation_disappeared` | atomic | GET | `/api/cms/v3/content/audio` | from `structured_operation:GET:/api/cms/v3/content/audio` · @ js/index-BZVDPgzb.js |
| `structured_operation_disappeared` | atomic | GET | `/api/cms/v3/content/audio/list` | from `structured_operation:GET:/api/cms/v3/content/audio/list` · @ js/index-BZVDPgzb.js |
| `structured_operation_disappeared` | atomic | GET | `/api/cms/v3/content/bulk` | from `structured_operation:GET:/api/cms/v3/content/bulk` · @ js/index-BZVDPgzb.js |
| `structured_operation_disappeared` | atomic | GET | `/api/cms/v3/content/picture` | from `structured_operation:GET:/api/cms/v3/content/picture` · @ js/index-BZVDPgzb.js |
| `structured_operation_disappeared` | atomic | GET | `/api/cms/v3/content/picture/list` | from `structured_operation:GET:/api/cms/v3/content/picture/list` · @ js/index-BZVDPgzb.js |
| `structured_operation_disappeared` | atomic | GET | `/api/cms/v3/content/video` | from `structured_operation:GET:/api/cms/v3/content/video` · @ js/index-BZVDPgzb.js |
| `structured_operation_disappeared` | atomic | GET | `/api/cms/v3/content/video/list` | from `structured_operation:GET:/api/cms/v3/content/video/list` · @ js/index-BZVDPgzb.js |
| `structured_operation_disappeared` | atomic | GET | `/api/cms/v3/creator` | from `structured_operation:GET:/api/cms/v3/creator` · @ js/index-BZVDPgzb.js |
| `structured_operation_disappeared` | atomic | GET | `/api/cms/v3/creator/agreement` | from `structured_operation:GET:/api/cms/v3/creator/agreement` · @ js/index-BZVDPgzb.js |
| `structured_operation_disappeared` | atomic | GET | `/api/cms/v3/creator/channel` | from `structured_operation:GET:/api/cms/v3/creator/channel` · @ js/index-BZVDPgzb.js |
| `structured_operation_disappeared` | atomic | GET | `/api/cms/v3/creator/channels/list` | from `structured_operation:GET:/api/cms/v3/creator/channels/list` · @ js/index-BZVDPgzb.js |
| `structured_operation_disappeared` | atomic | GET | `/api/cms/v3/creator/channels/social` | from `structured_operation:GET:/api/cms/v3/creator/channels/social` · @ js/index-BZVDPgzb.js |
| `structured_operation_disappeared` | atomic | GET | `/api/cms/v3/creator/social` | from `structured_operation:GET:/api/cms/v3/creator/social` · @ js/index-BZVDPgzb.js |
| `structured_operation_disappeared` | atomic | GET | `/api/cms/v3/live/info` | from `structured_operation:GET:/api/cms/v3/live/info` · @ js/index-BZVDPgzb.js |
| `structured_operation_disappeared` | atomic | GET | `/api/cms/v3/plan` | from `structured_operation:GET:/api/cms/v3/plan` · @ js/index-BZVDPgzb.js |
| `structured_operation_disappeared` | atomic | GET | `/api/cms/v3/plan/list` | from `structured_operation:GET:/api/cms/v3/plan/list` · @ js/index-BZVDPgzb.js |
| `structured_operation_disappeared` | atomic | GET | `/api/cms/v3/plan/multi` | from `structured_operation:GET:/api/cms/v3/plan/multi` · @ js/index-BZVDPgzb.js |
| `structured_operation_disappeared` | atomic | GET | `/api/cms/v3/poll/list` | from `structured_operation:GET:/api/cms/v3/poll/list` · @ js/index-BZVDPgzb.js |
| `structured_operation_disappeared` | atomic | GET | `/api/cms/v3/processing/active` | from `structured_operation:GET:/api/cms/v3/processing/active` · @ js/index-BZVDPgzb.js |
| `structured_operation_disappeared` | atomic | GET | `/api/cms/v3/subscribers/download` | from `structured_operation:GET:/api/cms/v3/subscribers/download` · @ js/index-BZVDPgzb.js |
| `structured_operation_disappeared` | atomic | GET | `/api/cms/v3/subscribers/list` | from `structured_operation:GET:/api/cms/v3/subscribers/list` · @ js/index-BZVDPgzb.js |
| `structured_operation_disappeared` | atomic | GET | `/api/cms/v3/survey/report` | from `structured_operation:GET:/api/cms/v3/survey/report` · @ js/index-BZVDPgzb.js |
| `structured_operation_disappeared` | atomic | GET | `/api/cms/v3/survey/report/enabled` | from `structured_operation:GET:/api/cms/v3/survey/report/enabled` · @ js/index-BZVDPgzb.js |
| `structured_operation_disappeared` | atomic | GET | `/api/v3/auth/captcha/info` | from `structured_operation:GET:/api/v3/auth/captcha/info` · @ js/index-BZVDPgzb.js |
| `structured_operation_disappeared` | atomic | GET | `/api/v3/comment` | from `structured_operation:GET:/api/v3/comment` · @ js/index-BZVDPgzb.js |
| `structured_operation_disappeared` | atomic | GET | `/api/v3/comment/history` | from `structured_operation:GET:/api/v3/comment/history` · @ js/index-BZVDPgzb.js |
| `structured_operation_disappeared` | atomic | GET | `/api/v3/comment/replies` | from `structured_operation:GET:/api/v3/comment/replies` · @ js/index-BZVDPgzb.js |
| `structured_operation_disappeared` | atomic | GET | `/api/v3/connect/list` | from `structured_operation:GET:/api/v3/connect/list` · @ js/index-BZVDPgzb.js |
| `structured_operation_disappeared` | atomic | GET | `/api/v3/content/audio` | from `structured_operation:GET:/api/v3/content/audio` · @ js/index-BZVDPgzb.js |
| `structured_operation_disappeared` | atomic | GET | `/api/v3/content/creator` | from `structured_operation:GET:/api/v3/content/creator` · @ js/index-BZVDPgzb.js |
| `structured_operation_disappeared` | atomic | GET | `/api/v3/content/history` | from `structured_operation:GET:/api/v3/content/history` · @ js/index-BZVDPgzb.js |
| `structured_operation_disappeared` | atomic | GET | `/api/v3/content/info` | from `structured_operation:GET:/api/v3/content/info` · @ js/index-BZVDPgzb.js |
| `structured_operation_disappeared` | atomic | GET | `/api/v3/content/landing-page` | from `structured_operation:GET:/api/v3/content/landing-page` · @ js/index-BZVDPgzb.js |
| `structured_operation_disappeared` | atomic | GET | `/api/v3/content/picture` | from `structured_operation:GET:/api/v3/content/picture` · @ js/index-BZVDPgzb.js |
| `structured_operation_disappeared` | atomic | GET | `/api/v3/content/picture/url` | from `structured_operation:GET:/api/v3/content/picture/url` · @ js/index-BZVDPgzb.js |
| `structured_operation_disappeared` | atomic | GET | `/api/v3/content/post` | from `structured_operation:GET:/api/v3/content/post` · @ js/index-BZVDPgzb.js |
| `structured_operation_disappeared` | atomic | GET | `/api/v3/content/post/random` | from `structured_operation:GET:/api/v3/content/post/random` · @ js/index-BZVDPgzb.js |
| `structured_operation_disappeared` | atomic | GET | `/api/v3/content/progress` | from `structured_operation:GET:/api/v3/content/progress` · @ js/index-BZVDPgzb.js |
| `structured_operation_disappeared` | atomic | GET | `/api/v3/content/related` | from `structured_operation:GET:/api/v3/content/related` · @ js/index-BZVDPgzb.js |
| `structured_operation_disappeared` | atomic | GET | `/api/v3/content/search` | from `structured_operation:GET:/api/v3/content/search` · @ js/index-BZVDPgzb.js |
| `structured_operation_disappeared` | atomic | GET | `/api/v3/content/tags` | from `structured_operation:GET:/api/v3/content/tags` · @ js/index-BZVDPgzb.js |
| `structured_operation_disappeared` | atomic | GET | `/api/v3/content/upload/s3/multipart` | from `structured_operation:GET:/api/v3/content/upload/s3/multipart` · @ js/index-BZVDPgzb.js |
| `structured_operation_disappeared` | atomic | GET | `/api/v3/content/upload/s3/multipart/sign` | from `structured_operation:GET:/api/v3/content/upload/s3/multipart/sign` · @ js/index-BZVDPgzb.js |
| `structured_operation_disappeared` | atomic | GET | `/api/v3/content/video` | from `structured_operation:GET:/api/v3/content/video` · @ js/index-BZVDPgzb.js |
| `structured_operation_disappeared` | atomic | GET | `/api/v3/creator/category/list` | from `structured_operation:GET:/api/v3/creator/category/list` · @ js/index-BZVDPgzb.js |
| `structured_operation_disappeared` | atomic | GET | `/api/v3/creator/channels/list` | from `structured_operation:GET:/api/v3/creator/channels/list` · @ js/index-BZVDPgzb.js |
| `structured_operation_disappeared` | atomic | GET | `/api/v3/creator/discover` | from `structured_operation:GET:/api/v3/creator/discover` · @ js/index-BZVDPgzb.js |
| `structured_operation_disappeared` | atomic | GET | `/api/v3/creator/info` | from `structured_operation:GET:/api/v3/creator/info` · @ js/index-BZVDPgzb.js |
| `structured_operation_disappeared` | atomic | GET | `/api/v3/creator/invite/info` | from `structured_operation:GET:/api/v3/creator/invite/info` · @ js/index-BZVDPgzb.js |
| `structured_operation_disappeared` | atomic | GET | `/api/v3/creator/list` | from `structured_operation:GET:/api/v3/creator/list` · @ js/index-BZVDPgzb.js |
| `structured_operation_disappeared` | atomic | GET | `/api/v3/creator/named` | from `structured_operation:GET:/api/v3/creator/named` · @ js/index-BZVDPgzb.js |
| `structured_operation_disappeared` | atomic | GET | `/api/v3/creator/stats` | from `structured_operation:GET:/api/v3/creator/stats` · @ js/index-BZVDPgzb.js |
| `structured_operation_disappeared` | atomic | GET | `/api/v3/delivery/info` | from `structured_operation:GET:/api/v3/delivery/info` · @ js/index-BZVDPgzb.js |
| `structured_operation_disappeared` | atomic | GET | `/api/v3/discord/bot/info` | from `structured_operation:GET:/api/v3/discord/bot/info` · @ js/index-BZVDPgzb.js |
| `structured_operation_disappeared` | atomic | GET | `/api/v3/discord/bot/invite/generate` | from `structured_operation:GET:/api/v3/discord/bot/invite/generate` · @ js/index-BZVDPgzb.js |
| `structured_operation_disappeared` | atomic | GET | `/api/v3/discord/bot/link` | from `structured_operation:GET:/api/v3/discord/bot/link` · @ js/index-BZVDPgzb.js |
| `structured_operation_disappeared` | atomic | GET | `/api/v3/discord/bot/link/callback` | from `structured_operation:GET:/api/v3/discord/bot/link/callback` · @ js/index-BZVDPgzb.js |
| `structured_operation_disappeared` | atomic | GET | `/api/v3/discord/bot/list` | from `structured_operation:GET:/api/v3/discord/bot/list` · @ js/index-BZVDPgzb.js |
| `structured_operation_disappeared` | atomic | GET | `/api/v3/faq/list` | from `structured_operation:GET:/api/v3/faq/list` · @ js/index-BZVDPgzb.js |
| `structured_operation_disappeared` | atomic | GET | `/api/v3/image/optimizations` | from `structured_operation:GET:/api/v3/image/optimizations` · @ js/index-BZVDPgzb.js |
| `structured_operation_disappeared` | atomic | GET | `/api/v3/image/type` | from `structured_operation:GET:/api/v3/image/type` · @ js/index-BZVDPgzb.js |
| `structured_operation_disappeared` | atomic | GET | `/api/v3/image/type/list` | from `structured_operation:GET:/api/v3/image/type/list` · @ js/index-BZVDPgzb.js |
| `structured_operation_disappeared` | atomic | GET | `/api/v3/live/info` | from `structured_operation:GET:/api/v3/live/info` · @ js/index-BZVDPgzb.js |
| `structured_operation_disappeared` | atomic | GET | `/api/v3/moderation/user/ban/list` | from `structured_operation:GET:/api/v3/moderation/user/ban/list` · @ js/index-BZVDPgzb.js |
| `structured_operation_disappeared` | atomic | GET | `/api/v3/moderation/user/info` | from `structured_operation:GET:/api/v3/moderation/user/info` · @ js/index-BZVDPgzb.js |
| `structured_operation_disappeared` | atomic | GET | `/api/v3/payment/address/list` | from `structured_operation:GET:/api/v3/payment/address/list` · @ js/index-BZVDPgzb.js |
| `structured_operation_disappeared` | atomic | GET | `/api/v3/payment/braintree/token` | from `structured_operation:GET:/api/v3/payment/braintree/token` · @ js/index-BZVDPgzb.js |
| `structured_operation_disappeared` | atomic | GET | `/api/v3/payment/invoice/list` | from `structured_operation:GET:/api/v3/payment/invoice/list` · @ js/index-BZVDPgzb.js |
| `structured_operation_disappeared` | atomic | GET | `/api/v3/payment/method/list` | from `structured_operation:GET:/api/v3/payment/method/list` · @ js/index-BZVDPgzb.js |
| `structured_operation_disappeared` | atomic | GET | `/api/v3/payment/stripe/checkout` | from `structured_operation:GET:/api/v3/payment/stripe/checkout` · @ js/index-BZVDPgzb.js |
| `structured_operation_disappeared` | atomic | GET | `/api/v3/payment/stripe/manage` | from `structured_operation:GET:/api/v3/payment/stripe/manage` · @ js/index-BZVDPgzb.js |
| `structured_operation_disappeared` | atomic | GET | `/api/v3/payment/stripe/pk` | from `structured_operation:GET:/api/v3/payment/stripe/pk` · @ js/index-BZVDPgzb.js |
| `structured_operation_disappeared` | atomic | GET | `/api/v3/payment/stripe/products` | from `structured_operation:GET:/api/v3/payment/stripe/products` · @ js/index-BZVDPgzb.js |
| `structured_operation_disappeared` | atomic | GET | `/api/v3/payment/stripe/subscription` | from `structured_operation:GET:/api/v3/payment/stripe/subscription` · @ js/index-BZVDPgzb.js |
| `structured_operation_disappeared` | atomic | GET | `/api/v3/payment/tax/estimate` | from `structured_operation:GET:/api/v3/payment/tax/estimate` · @ js/index-BZVDPgzb.js |
| `structured_operation_disappeared` | atomic | GET | `/api/v3/plan/content` | from `structured_operation:GET:/api/v3/plan/content` · @ js/index-BZVDPgzb.js |
| `structured_operation_disappeared` | atomic | GET | `/api/v3/plan/info` | from `structured_operation:GET:/api/v3/plan/info` · @ js/index-BZVDPgzb.js |
| `structured_operation_disappeared` | atomic | GET | `/api/v3/poll/cms/list` | from `structured_operation:GET:/api/v3/poll/cms/list` · @ js/index-BZVDPgzb.js |
| `structured_operation_disappeared` | atomic | GET | `/api/v3/promotion/list` | from `structured_operation:GET:/api/v3/promotion/list` · @ js/index-BZVDPgzb.js |
| `structured_operation_disappeared` | atomic | GET | `/api/v3/push/web/info` | from `structured_operation:GET:/api/v3/push/web/info` · @ js/index-BZVDPgzb.js |
| `structured_operation_disappeared` | atomic | GET | `/api/v3/redirect/app` | from `structured_operation:GET:/api/v3/redirect/app` · @ js/index-BZVDPgzb.js |
| `structured_operation_disappeared` | atomic | GET | `/api/v3/spec` | from `structured_operation:GET:/api/v3/spec` · @ js/index-BZVDPgzb.js |
| `structured_operation_disappeared` | atomic | GET | `/api/v3/status` | from `structured_operation:GET:/api/v3/status` · @ js/index-BZVDPgzb.js |
| `structured_operation_disappeared` | atomic | GET | `/api/v3/support/ticket/types` | from `structured_operation:GET:/api/v3/support/ticket/types` · @ js/index-BZVDPgzb.js |
| `structured_operation_disappeared` | atomic | GET | `/api/v3/survey/questions` | from `structured_operation:GET:/api/v3/survey/questions` · @ js/index-BZVDPgzb.js |
| `structured_operation_disappeared` | atomic | GET | `/api/v3/user` | from `structured_operation:GET:/api/v3/user` · @ js/index-BZVDPgzb.js |
| `structured_operation_disappeared` | atomic | GET | `/api/v3/user/achievement` | from `structured_operation:GET:/api/v3/user/achievement` · @ js/index-BZVDPgzb.js |
| `structured_operation_disappeared` | atomic | GET | `/api/v3/user/achievement/perks` | from `structured_operation:GET:/api/v3/user/achievement/perks` · @ js/index-BZVDPgzb.js |
| `structured_operation_disappeared` | atomic | GET | `/api/v3/user/achievement/perks/list` | from `structured_operation:GET:/api/v3/user/achievement/perks/list` · @ js/index-BZVDPgzb.js |
| `structured_operation_disappeared` | atomic | GET | `/api/v3/user/activity` | from `structured_operation:GET:/api/v3/user/activity` · @ js/index-BZVDPgzb.js |
| `structured_operation_disappeared` | atomic | GET | `/api/v3/user/ban/status` | from `structured_operation:GET:/api/v3/user/ban/status` · @ js/index-BZVDPgzb.js |
| `structured_operation_disappeared` | atomic | GET | `/api/v3/user/creator` | from `structured_operation:GET:/api/v3/user/creator` · @ js/index-BZVDPgzb.js |
| `structured_operation_disappeared` | atomic | GET | `/api/v3/user/info` | from `structured_operation:GET:/api/v3/user/info` · @ js/index-BZVDPgzb.js |
| `structured_operation_disappeared` | atomic | GET | `/api/v3/user/multi` | from `structured_operation:GET:/api/v3/user/multi` · @ js/index-BZVDPgzb.js |
| `structured_operation_disappeared` | atomic | GET | `/api/v3/user/named` | from `structured_operation:GET:/api/v3/user/named` · @ js/index-BZVDPgzb.js |
| `structured_operation_disappeared` | atomic | GET | `/api/v3/user/notification/channels/list` | from `structured_operation:GET:/api/v3/user/notification/channels/list` · @ js/index-BZVDPgzb.js |
| `structured_operation_disappeared` | atomic | GET | `/api/v3/user/notification/list` | from `structured_operation:GET:/api/v3/user/notification/list` · @ js/index-BZVDPgzb.js |
| `structured_operation_disappeared` | atomic | GET | `/api/v3/user/security` | from `structured_operation:GET:/api/v3/user/security` · @ js/index-BZVDPgzb.js |
| `structured_operation_disappeared` | atomic | GET | `/api/v3/user/self` | from `structured_operation:GET:/api/v3/user/self` · @ js/index-BZVDPgzb.js |
| `structured_operation_disappeared` | atomic | GET | `/api/v3/user/subscriptions` | from `structured_operation:GET:/api/v3/user/subscriptions` · @ js/index-BZVDPgzb.js |
| `structured_operation_disappeared` | atomic | GET | `/api/v3/user/username/available` | from `structured_operation:GET:/api/v3/user/username/available` · @ js/index-BZVDPgzb.js |
| `structured_operation_disappeared` | atomic | POST | `/api/acp/v3/achievement/award` | from `structured_operation:POST:/api/acp/v3/achievement/award` · @ js/index-BZVDPgzb.js |
| `structured_operation_disappeared` | atomic | POST | `/api/acp/v3/achievement/create` | from `structured_operation:POST:/api/acp/v3/achievement/create` · @ js/index-BZVDPgzb.js |
| `structured_operation_disappeared` | atomic | POST | `/api/acp/v3/achievement/create/multi-stage` | from `structured_operation:POST:/api/acp/v3/achievement/create/multi-stage` · @ js/index-BZVDPgzb.js |
| `structured_operation_disappeared` | atomic | POST | `/api/acp/v3/achievement/delete` | from `structured_operation:POST:/api/acp/v3/achievement/delete` · @ js/index-BZVDPgzb.js |
| `structured_operation_disappeared` | atomic | POST | `/api/acp/v3/achievement/perk/create` | from `structured_operation:POST:/api/acp/v3/achievement/perk/create` · @ js/index-BZVDPgzb.js |
| `structured_operation_disappeared` | atomic | POST | `/api/acp/v3/achievement/perk/delete` | from `structured_operation:POST:/api/acp/v3/achievement/perk/delete` · @ js/index-BZVDPgzb.js |
| `structured_operation_disappeared` | atomic | POST | `/api/acp/v3/achievement/perk/image/upload` | from `structured_operation:POST:/api/acp/v3/achievement/perk/image/upload` · @ js/index-BZVDPgzb.js |
| `structured_operation_disappeared` | atomic | POST | `/api/acp/v3/achievement/perk/update` | from `structured_operation:POST:/api/acp/v3/achievement/perk/update` · @ js/index-BZVDPgzb.js |
| `structured_operation_disappeared` | atomic | POST | `/api/acp/v3/achievement/strip` | from `structured_operation:POST:/api/acp/v3/achievement/strip` · @ js/index-BZVDPgzb.js |
| `structured_operation_disappeared` | atomic | POST | `/api/acp/v3/achievement/update` | from `structured_operation:POST:/api/acp/v3/achievement/update` · @ js/index-BZVDPgzb.js |
| `structured_operation_disappeared` | atomic | POST | `/api/acp/v3/agreement/create` | from `structured_operation:POST:/api/acp/v3/agreement/create` · @ js/index-BZVDPgzb.js |
| `structured_operation_disappeared` | atomic | POST | `/api/acp/v3/agreement/update` | from `structured_operation:POST:/api/acp/v3/agreement/update` · @ js/index-BZVDPgzb.js |
| `structured_operation_disappeared` | atomic | POST | `/api/acp/v3/blogPost/moveContent` | from `structured_operation:POST:/api/acp/v3/blogPost/moveContent` · @ js/index-BZVDPgzb.js |
| `structured_operation_disappeared` | atomic | POST | `/api/acp/v3/creator/category/create` | from `structured_operation:POST:/api/acp/v3/creator/category/create` · @ js/index-BZVDPgzb.js |
| `structured_operation_disappeared` | atomic | POST | `/api/acp/v3/creator/category/delete` | from `structured_operation:POST:/api/acp/v3/creator/category/delete` · @ js/index-BZVDPgzb.js |
| `structured_operation_disappeared` | atomic | POST | `/api/acp/v3/creator/category/update` | from `structured_operation:POST:/api/acp/v3/creator/category/update` · @ js/index-BZVDPgzb.js |
| `structured_operation_disappeared` | atomic | POST | `/api/acp/v3/creator/create` | from `structured_operation:POST:/api/acp/v3/creator/create` · @ js/index-BZVDPgzb.js |
| `structured_operation_disappeared` | atomic | POST | `/api/acp/v3/creator/invite/create` | from `structured_operation:POST:/api/acp/v3/creator/invite/create` · @ js/index-BZVDPgzb.js |
| `structured_operation_disappeared` | atomic | POST | `/api/acp/v3/creator/invite/update` | from `structured_operation:POST:/api/acp/v3/creator/invite/update` · @ js/index-BZVDPgzb.js |
| `structured_operation_disappeared` | atomic | POST | `/api/acp/v3/creator/update` | from `structured_operation:POST:/api/acp/v3/creator/update` · @ js/index-BZVDPgzb.js |
| `structured_operation_disappeared` | atomic | POST | `/api/acp/v3/ingest` | from `structured_operation:POST:/api/acp/v3/ingest` · @ js/index-BZVDPgzb.js |
| `structured_operation_disappeared` | atomic | POST | `/api/acp/v3/ingest/delete` | from `structured_operation:POST:/api/acp/v3/ingest/delete` · @ js/index-BZVDPgzb.js |
| `structured_operation_disappeared` | atomic | POST | `/api/acp/v3/ingest/multi` | from `structured_operation:POST:/api/acp/v3/ingest/multi` · @ js/index-BZVDPgzb.js |
| `structured_operation_disappeared` | atomic | POST | `/api/acp/v3/ingest/start` | from `structured_operation:POST:/api/acp/v3/ingest/start` · @ js/index-BZVDPgzb.js |
| `structured_operation_disappeared` | atomic | POST | `/api/acp/v3/ingest/stop` | from `structured_operation:POST:/api/acp/v3/ingest/stop` · @ js/index-BZVDPgzb.js |
| `structured_operation_disappeared` | atomic | POST | `/api/acp/v3/ingest/update` | from `structured_operation:POST:/api/acp/v3/ingest/update` · @ js/index-BZVDPgzb.js |
| `structured_operation_disappeared` | atomic | POST | `/api/acp/v3/invoice/mark-refunded` | from `structured_operation:POST:/api/acp/v3/invoice/mark-refunded` · @ js/index-BZVDPgzb.js |
| `structured_operation_disappeared` | atomic | POST | `/api/acp/v3/job/start` | from `structured_operation:POST:/api/acp/v3/job/start` · @ js/index-BZVDPgzb.js |
| `structured_operation_disappeared` | atomic | POST | `/api/acp/v3/job/stop` | from `structured_operation:POST:/api/acp/v3/job/stop` · @ js/index-BZVDPgzb.js |
| `structured_operation_disappeared` | atomic | POST | `/api/acp/v3/plan/cost` | from `structured_operation:POST:/api/acp/v3/plan/cost` · @ js/index-BZVDPgzb.js |
| `structured_operation_disappeared` | atomic | POST | `/api/acp/v3/plan/create` | from `structured_operation:POST:/api/acp/v3/plan/create` · @ js/index-BZVDPgzb.js |
| `structured_operation_disappeared` | atomic | POST | `/api/acp/v3/plan/delete` | from `structured_operation:POST:/api/acp/v3/plan/delete` · @ js/index-BZVDPgzb.js |
| `structured_operation_disappeared` | atomic | POST | `/api/acp/v3/plan/update` | from `structured_operation:POST:/api/acp/v3/plan/update` · @ js/index-BZVDPgzb.js |
| `structured_operation_disappeared` | atomic | POST | `/api/acp/v3/promotion` | from `structured_operation:POST:/api/acp/v3/promotion` · @ js/index-BZVDPgzb.js |
| `structured_operation_disappeared` | atomic | POST | `/api/acp/v3/promotion/delete` | from `structured_operation:POST:/api/acp/v3/promotion/delete` · @ js/index-BZVDPgzb.js |
| `structured_operation_disappeared` | atomic | POST | `/api/acp/v3/promotion/multi` | from `structured_operation:POST:/api/acp/v3/promotion/multi` · @ js/index-BZVDPgzb.js |
| `structured_operation_disappeared` | atomic | POST | `/api/acp/v3/promotion/unclaim` | from `structured_operation:POST:/api/acp/v3/promotion/unclaim` · @ js/index-BZVDPgzb.js |
| `structured_operation_disappeared` | atomic | POST | `/api/acp/v3/promotion/update` | from `structured_operation:POST:/api/acp/v3/promotion/update` · @ js/index-BZVDPgzb.js |
| `structured_operation_disappeared` | atomic | POST | `/api/acp/v3/service-message/create` | from `structured_operation:POST:/api/acp/v3/service-message/create` · @ js/index-BZVDPgzb.js |
| `structured_operation_disappeared` | atomic | POST | `/api/acp/v3/service-message/delete` | from `structured_operation:POST:/api/acp/v3/service-message/delete` · @ js/index-BZVDPgzb.js |
| `structured_operation_disappeared` | atomic | POST | `/api/acp/v3/service-message/update` | from `structured_operation:POST:/api/acp/v3/service-message/update` · @ js/index-BZVDPgzb.js |
| `structured_operation_disappeared` | atomic | POST | `/api/acp/v3/user/avatar/upload` | from `structured_operation:POST:/api/acp/v3/user/avatar/upload` · @ js/index-BZVDPgzb.js |
| `structured_operation_disappeared` | atomic | POST | `/api/acp/v3/user/delete` | from `structured_operation:POST:/api/acp/v3/user/delete` · @ js/index-BZVDPgzb.js |
| `structured_operation_disappeared` | atomic | POST | `/api/acp/v3/user/password/reset/request` | from `structured_operation:POST:/api/acp/v3/user/password/reset/request` · @ js/index-BZVDPgzb.js |
| `structured_operation_disappeared` | atomic | POST | `/api/acp/v3/user/subscription/create` | from `structured_operation:POST:/api/acp/v3/user/subscription/create` · @ js/index-BZVDPgzb.js |
| `structured_operation_disappeared` | atomic | POST | `/api/acp/v3/user/subscription/delete` | from `structured_operation:POST:/api/acp/v3/user/subscription/delete` · @ js/index-BZVDPgzb.js |
| `structured_operation_disappeared` | atomic | POST | `/api/acp/v3/user/undelete` | from `structured_operation:POST:/api/acp/v3/user/undelete` · @ js/index-BZVDPgzb.js |
| `structured_operation_disappeared` | atomic | POST | `/api/acp/v3/user/update` | from `structured_operation:POST:/api/acp/v3/user/update` · @ js/index-BZVDPgzb.js |
| `structured_operation_disappeared` | atomic | POST | `/api/cms/v3/achievement/award` | from `structured_operation:POST:/api/cms/v3/achievement/award` · @ js/index-BZVDPgzb.js |
| `structured_operation_disappeared` | atomic | POST | `/api/cms/v3/achievement/create` | from `structured_operation:POST:/api/cms/v3/achievement/create` · @ js/index-BZVDPgzb.js |
| `structured_operation_disappeared` | atomic | POST | `/api/cms/v3/achievement/create/progressive` | from `structured_operation:POST:/api/cms/v3/achievement/create/progressive` · @ js/index-BZVDPgzb.js |
| `structured_operation_disappeared` | atomic | POST | `/api/cms/v3/achievement/delete` | from `structured_operation:POST:/api/cms/v3/achievement/delete` · @ js/index-BZVDPgzb.js |
| `structured_operation_disappeared` | atomic | POST | `/api/cms/v3/achievement/perk/create` | from `structured_operation:POST:/api/cms/v3/achievement/perk/create` · @ js/index-BZVDPgzb.js |
| `structured_operation_disappeared` | atomic | POST | `/api/cms/v3/achievement/perk/delete` | from `structured_operation:POST:/api/cms/v3/achievement/perk/delete` · @ js/index-BZVDPgzb.js |
| `structured_operation_disappeared` | atomic | POST | `/api/cms/v3/achievement/perk/image/upload` | from `structured_operation:POST:/api/cms/v3/achievement/perk/image/upload` · @ js/index-BZVDPgzb.js |
| `structured_operation_disappeared` | atomic | POST | `/api/cms/v3/achievement/perk/update` | from `structured_operation:POST:/api/cms/v3/achievement/perk/update` · @ js/index-BZVDPgzb.js |
| `structured_operation_disappeared` | atomic | POST | `/api/cms/v3/achievement/strip` | from `structured_operation:POST:/api/cms/v3/achievement/strip` · @ js/index-BZVDPgzb.js |
| `structured_operation_disappeared` | atomic | POST | `/api/cms/v3/achievement/update` | from `structured_operation:POST:/api/cms/v3/achievement/update` · @ js/index-BZVDPgzb.js |
| `structured_operation_disappeared` | atomic | POST | `/api/cms/v3/blogPost/attachments/update` | from `structured_operation:POST:/api/cms/v3/blogPost/attachments/update` · @ js/index-BZVDPgzb.js |
| `structured_operation_disappeared` | atomic | POST | `/api/cms/v3/blogPost/create` | from `structured_operation:POST:/api/cms/v3/blogPost/create` · @ js/index-BZVDPgzb.js |
| `structured_operation_disappeared` | atomic | POST | `/api/cms/v3/blogPost/delete` | from `structured_operation:POST:/api/cms/v3/blogPost/delete` · @ js/index-BZVDPgzb.js |
| `structured_operation_disappeared` | atomic | POST | `/api/cms/v3/blogPost/edit` | from `structured_operation:POST:/api/cms/v3/blogPost/edit` · @ js/index-BZVDPgzb.js |
| `structured_operation_disappeared` | atomic | POST | `/api/cms/v3/blogPost/edit/bulk` | from `structured_operation:POST:/api/cms/v3/blogPost/edit/bulk` · @ js/index-BZVDPgzb.js |
| `structured_operation_disappeared` | atomic | POST | `/api/cms/v3/blogPost/multi` | from `structured_operation:POST:/api/cms/v3/blogPost/multi` · @ js/index-BZVDPgzb.js |
| `structured_operation_disappeared` | atomic | POST | `/api/cms/v3/content/delete` | from `structured_operation:POST:/api/cms/v3/content/delete` · @ js/index-BZVDPgzb.js |
| `structured_operation_disappeared` | atomic | POST | `/api/cms/v3/content/delete/texttrack` | from `structured_operation:POST:/api/cms/v3/content/delete/texttrack` · @ js/index-BZVDPgzb.js |
| `structured_operation_disappeared` | atomic | POST | `/api/cms/v3/content/edit` | from `structured_operation:POST:/api/cms/v3/content/edit` · @ js/index-BZVDPgzb.js |
| `structured_operation_disappeared` | atomic | POST | `/api/cms/v3/content/move` | from `structured_operation:POST:/api/cms/v3/content/move` · @ js/index-BZVDPgzb.js |
| `structured_operation_disappeared` | atomic | POST | `/api/cms/v3/content/upload/texttrack` | from `structured_operation:POST:/api/cms/v3/content/upload/texttrack` · @ js/index-BZVDPgzb.js |
| `structured_operation_disappeared` | atomic | POST | `/api/cms/v3/creator/agreement/confirm` | from `structured_operation:POST:/api/cms/v3/creator/agreement/confirm` · @ js/index-BZVDPgzb.js |
| `structured_operation_disappeared` | atomic | POST | `/api/cms/v3/creator/channels` | from `structured_operation:POST:/api/cms/v3/creator/channels` · @ js/index-BZVDPgzb.js |
| `structured_operation_disappeared` | atomic | POST | `/api/cms/v3/creator/channels/default` | from `structured_operation:POST:/api/cms/v3/creator/channels/default` · @ js/index-BZVDPgzb.js |
| `structured_operation_disappeared` | atomic | POST | `/api/cms/v3/creator/channels/delete` | from `structured_operation:POST:/api/cms/v3/creator/channels/delete` · @ js/index-BZVDPgzb.js |
| `structured_operation_disappeared` | atomic | POST | `/api/cms/v3/creator/channels/image` | from `structured_operation:POST:/api/cms/v3/creator/channels/image` · @ js/index-BZVDPgzb.js |
| `structured_operation_disappeared` | atomic | POST | `/api/cms/v3/creator/channels/reorder` | from `structured_operation:POST:/api/cms/v3/creator/channels/reorder` · @ js/index-BZVDPgzb.js |
| `structured_operation_disappeared` | atomic | POST | `/api/cms/v3/creator/channels/social` | from `structured_operation:POST:/api/cms/v3/creator/channels/social` · @ js/index-BZVDPgzb.js |
| `structured_operation_disappeared` | atomic | POST | `/api/cms/v3/creator/channels/update` | from `structured_operation:POST:/api/cms/v3/creator/channels/update` · @ js/index-BZVDPgzb.js |
| `structured_operation_disappeared` | atomic | POST | `/api/cms/v3/creator/social/update` | from `structured_operation:POST:/api/cms/v3/creator/social/update` · @ js/index-BZVDPgzb.js |
| `structured_operation_disappeared` | atomic | POST | `/api/cms/v3/creator/update` | from `structured_operation:POST:/api/cms/v3/creator/update` · @ js/index-BZVDPgzb.js |
| `structured_operation_disappeared` | atomic | POST | `/api/cms/v3/creator/update/image` | from `structured_operation:POST:/api/cms/v3/creator/update/image` · @ js/index-BZVDPgzb.js |
| `structured_operation_disappeared` | atomic | POST | `/api/cms/v3/creator/visibility/update` | from `structured_operation:POST:/api/cms/v3/creator/visibility/update` · @ js/index-BZVDPgzb.js |
| `structured_operation_disappeared` | atomic | POST | `/api/cms/v3/live/thumbnail` | from `structured_operation:POST:/api/cms/v3/live/thumbnail` · @ js/index-BZVDPgzb.js |
| `structured_operation_disappeared` | atomic | POST | `/api/cms/v3/live/update` | from `structured_operation:POST:/api/cms/v3/live/update` · @ js/index-BZVDPgzb.js |
| `structured_operation_disappeared` | atomic | POST | `/api/cms/v3/plan/cost` | from `structured_operation:POST:/api/cms/v3/plan/cost` · @ js/index-BZVDPgzb.js |
| `structured_operation_disappeared` | atomic | POST | `/api/cms/v3/plan/create` | from `structured_operation:POST:/api/cms/v3/plan/create` · @ js/index-BZVDPgzb.js |
| `structured_operation_disappeared` | atomic | POST | `/api/cms/v3/plan/delete` | from `structured_operation:POST:/api/cms/v3/plan/delete` · @ js/index-BZVDPgzb.js |
| `structured_operation_disappeared` | atomic | POST | `/api/cms/v3/plan/preview` | from `structured_operation:POST:/api/cms/v3/plan/preview` · @ js/index-BZVDPgzb.js |
| `structured_operation_disappeared` | atomic | POST | `/api/cms/v3/plan/preview/stop` | from `structured_operation:POST:/api/cms/v3/plan/preview/stop` · @ js/index-BZVDPgzb.js |
| `structured_operation_disappeared` | atomic | POST | `/api/cms/v3/plan/publish` | from `structured_operation:POST:/api/cms/v3/plan/publish` · @ js/index-BZVDPgzb.js |
| `structured_operation_disappeared` | atomic | POST | `/api/cms/v3/plan/update` | from `structured_operation:POST:/api/cms/v3/plan/update` · @ js/index-BZVDPgzb.js |
| `structured_operation_disappeared` | atomic | POST | `/api/cms/v3/transcode/subscribe` | from `structured_operation:POST:/api/cms/v3/transcode/subscribe` · @ js/index-BZVDPgzb.js |
| `structured_operation_disappeared` | atomic | POST | `/api/cms/v3/transcode/unsubscribe` | from `structured_operation:POST:/api/cms/v3/transcode/unsubscribe` · @ js/index-BZVDPgzb.js |
| `structured_operation_disappeared` | atomic | POST | `/api/v3/achievement/perks` | from `structured_operation:POST:/api/v3/achievement/perks` · @ js/index-BZVDPgzb.js |
| `structured_operation_disappeared` | atomic | POST | `/api/v3/activation/email/confirm` | from `structured_operation:POST:/api/v3/activation/email/confirm` · @ js/index-BZVDPgzb.js |
| `structured_operation_disappeared` | atomic | POST | `/api/v3/activation/email/request` | from `structured_operation:POST:/api/v3/activation/email/request` · @ js/index-BZVDPgzb.js |
| `structured_operation_disappeared` | atomic | POST | `/api/v3/auth/checkFor2faLogin` | from `structured_operation:POST:/api/v3/auth/checkFor2faLogin` · @ js/index-BZVDPgzb.js |
| `structured_operation_disappeared` | atomic | POST | `/api/v3/auth/keycloak/migration/login/{username_or_email_or_userid}` | from `structured_operation:POST:/api/v3/auth/keycloak/migration/login/{username_or_email_or_userid}` · @ js/index-BZVDPgzb.js |
| `structured_operation_disappeared` | atomic | POST | `/api/v3/auth/login` | from `structured_operation:POST:/api/v3/auth/login` · @ js/index-BZVDPgzb.js |
| `structured_operation_disappeared` | atomic | POST | `/api/v3/auth/logout` | from `structured_operation:POST:/api/v3/auth/logout` · @ js/index-BZVDPgzb.js |
| `structured_operation_disappeared` | atomic | POST | `/api/v3/auth/signup` | from `structured_operation:POST:/api/v3/auth/signup` · @ js/index-BZVDPgzb.js |
| `structured_operation_disappeared` | atomic | POST | `/api/v3/auth/spoof/begin` | from `structured_operation:POST:/api/v3/auth/spoof/begin` · @ js/index-BZVDPgzb.js |
| `structured_operation_disappeared` | atomic | POST | `/api/v3/auth/spoof/end` | from `structured_operation:POST:/api/v3/auth/spoof/end` · @ js/index-BZVDPgzb.js |
| `structured_operation_disappeared` | atomic | POST | `/api/v3/comment` | from `structured_operation:POST:/api/v3/comment` · @ js/index-BZVDPgzb.js |
| `structured_operation_disappeared` | atomic | POST | `/api/v3/comment/delete` | from `structured_operation:POST:/api/v3/comment/delete` · @ js/index-BZVDPgzb.js |
| `structured_operation_disappeared` | atomic | POST | `/api/v3/comment/dislike` | from `structured_operation:POST:/api/v3/comment/dislike` · @ js/index-BZVDPgzb.js |
| `structured_operation_disappeared` | atomic | POST | `/api/v3/comment/edit` | from `structured_operation:POST:/api/v3/comment/edit` · @ js/index-BZVDPgzb.js |
| `structured_operation_disappeared` | atomic | POST | `/api/v3/comment/like` | from `structured_operation:POST:/api/v3/comment/like` · @ js/index-BZVDPgzb.js |
| `structured_operation_disappeared` | atomic | POST | `/api/v3/comment/pin` | from `structured_operation:POST:/api/v3/comment/pin` · @ js/index-BZVDPgzb.js |
| `structured_operation_disappeared` | atomic | POST | `/api/v3/comment/reply` | from `structured_operation:POST:/api/v3/comment/reply` · @ js/index-BZVDPgzb.js |
| `structured_operation_disappeared` | atomic | POST | `/api/v3/connect/complete` | from `structured_operation:POST:/api/v3/connect/complete` · @ js/index-BZVDPgzb.js |
| `structured_operation_disappeared` | atomic | POST | `/api/v3/connect/dissociate` | from `structured_operation:POST:/api/v3/connect/dissociate` · @ js/index-BZVDPgzb.js |
| `structured_operation_disappeared` | atomic | POST | `/api/v3/connect/refresh` | from `structured_operation:POST:/api/v3/connect/refresh` · @ js/index-BZVDPgzb.js |
| `structured_operation_disappeared` | atomic | POST | `/api/v3/content/creator/list` | from `structured_operation:POST:/api/v3/content/creator/list` · @ js/index-BZVDPgzb.js |
| `structured_operation_disappeared` | atomic | POST | `/api/v3/content/dislike` | from `structured_operation:POST:/api/v3/content/dislike` · @ js/index-BZVDPgzb.js |
| `structured_operation_disappeared` | atomic | POST | `/api/v3/content/like` | from `structured_operation:POST:/api/v3/content/like` · @ js/index-BZVDPgzb.js |
| `structured_operation_disappeared` | atomic | POST | `/api/v3/content/post/list` | from `structured_operation:POST:/api/v3/content/post/list` · @ js/index-BZVDPgzb.js |
| `structured_operation_disappeared` | atomic | POST | `/api/v3/content/progress` | from `structured_operation:POST:/api/v3/content/progress` · @ js/index-BZVDPgzb.js |
| `structured_operation_disappeared` | atomic | POST | `/api/v3/content/progress/clear` | from `structured_operation:POST:/api/v3/content/progress/clear` · @ js/index-BZVDPgzb.js |
| `structured_operation_disappeared` | atomic | POST | `/api/v3/content/progress/delete` | from `structured_operation:POST:/api/v3/content/progress/delete` · @ js/index-BZVDPgzb.js |
| `structured_operation_disappeared` | atomic | POST | `/api/v3/content/thumbnail/subscribe` | from `structured_operation:POST:/api/v3/content/thumbnail/subscribe` · @ js/index-BZVDPgzb.js |
| `structured_operation_disappeared` | atomic | POST | `/api/v3/content/thumbnail/unsubscribe` | from `structured_operation:POST:/api/v3/content/thumbnail/unsubscribe` · @ js/index-BZVDPgzb.js |
| `structured_operation_disappeared` | atomic | POST | `/api/v3/content/upload/s3/multipart` | from `structured_operation:POST:/api/v3/content/upload/s3/multipart` · @ js/index-BZVDPgzb.js |
| `structured_operation_disappeared` | atomic | POST | `/api/v3/content/upload/s3/multipart/abort` | from `structured_operation:POST:/api/v3/content/upload/s3/multipart/abort` · @ js/index-BZVDPgzb.js |
| `structured_operation_disappeared` | atomic | POST | `/api/v3/content/upload/s3/multipart/complete` | from `structured_operation:POST:/api/v3/content/upload/s3/multipart/complete` · @ js/index-BZVDPgzb.js |
| `structured_operation_disappeared` | atomic | POST | `/api/v3/content/upload/thumbnail` | from `structured_operation:POST:/api/v3/content/upload/thumbnail` · @ js/index-BZVDPgzb.js |
| `structured_operation_disappeared` | atomic | POST | `/api/v3/creator/invite/bind` | from `structured_operation:POST:/api/v3/creator/invite/bind` · @ js/index-BZVDPgzb.js |
| `structured_operation_disappeared` | atomic | POST | `/api/v3/creator/invite/claim` | from `structured_operation:POST:/api/v3/creator/invite/claim` · @ js/index-BZVDPgzb.js |
| `structured_operation_disappeared` | atomic | POST | `/api/v3/creator/subscribe` | from `structured_operation:POST:/api/v3/creator/subscribe` · @ js/index-BZVDPgzb.js |
| `structured_operation_disappeared` | atomic | POST | `/api/v3/creator/unsubscribe` | from `structured_operation:POST:/api/v3/creator/unsubscribe` · @ js/index-BZVDPgzb.js |
| `structured_operation_disappeared` | atomic | POST | `/api/v3/discord/bot/unlink` | from `structured_operation:POST:/api/v3/discord/bot/unlink` · @ js/index-BZVDPgzb.js |
| `structured_operation_disappeared` | atomic | POST | `/api/v3/discord/bot/update` | from `structured_operation:POST:/api/v3/discord/bot/update` · @ js/index-BZVDPgzb.js |
| `structured_operation_disappeared` | atomic | POST | `/api/v3/discord/server/join` | from `structured_operation:POST:/api/v3/discord/server/join` · @ js/index-BZVDPgzb.js |
| `structured_operation_disappeared` | atomic | POST | `/api/v3/moderation/comment/hide` | from `structured_operation:POST:/api/v3/moderation/comment/hide` · @ js/index-BZVDPgzb.js |
| `structured_operation_disappeared` | atomic | POST | `/api/v3/moderation/comment/unhide` | from `structured_operation:POST:/api/v3/moderation/comment/unhide` · @ js/index-BZVDPgzb.js |
| `structured_operation_disappeared` | atomic | POST | `/api/v3/moderation/user/ban` | from `structured_operation:POST:/api/v3/moderation/user/ban` · @ js/index-BZVDPgzb.js |
| `structured_operation_disappeared` | atomic | POST | `/api/v3/moderation/user/unban` | from `structured_operation:POST:/api/v3/moderation/user/unban` · @ js/index-BZVDPgzb.js |
| `structured_operation_disappeared` | atomic | POST | `/api/v3/payment/address/add` | from `structured_operation:POST:/api/v3/payment/address/add` · @ js/index-BZVDPgzb.js |
| `structured_operation_disappeared` | atomic | POST | `/api/v3/payment/address/delete` | from `structured_operation:POST:/api/v3/payment/address/delete` · @ js/index-BZVDPgzb.js |
| `structured_operation_disappeared` | atomic | POST | `/api/v3/payment/address/set` | from `structured_operation:POST:/api/v3/payment/address/set` · @ js/index-BZVDPgzb.js |
| `structured_operation_disappeared` | atomic | POST | `/api/v3/payment/address/update` | from `structured_operation:POST:/api/v3/payment/address/update` · @ js/index-BZVDPgzb.js |
| `structured_operation_disappeared` | atomic | POST | `/api/v3/payment/method/add` | from `structured_operation:POST:/api/v3/payment/method/add` · @ js/index-BZVDPgzb.js |
| `structured_operation_disappeared` | atomic | POST | `/api/v3/payment/method/delete` | from `structured_operation:POST:/api/v3/payment/method/delete` · @ js/index-BZVDPgzb.js |
| `structured_operation_disappeared` | atomic | POST | `/api/v3/payment/method/set` | from `structured_operation:POST:/api/v3/payment/method/set` · @ js/index-BZVDPgzb.js |
| `structured_operation_disappeared` | atomic | POST | `/api/v3/payment/setup-intents` | from `structured_operation:POST:/api/v3/payment/setup-intents` · @ js/index-BZVDPgzb.js |
| `structured_operation_disappeared` | atomic | POST | `/api/v3/payment/stripe/webhook` | from `structured_operation:POST:/api/v3/payment/stripe/webhook` · @ js/index-BZVDPgzb.js |
| `structured_operation_disappeared` | atomic | POST | `/api/v3/payment/subscription/cancel` | from `structured_operation:POST:/api/v3/payment/subscription/cancel` · @ js/index-BZVDPgzb.js |
| `structured_operation_disappeared` | atomic | POST | `/api/v3/payment/subscription/cancel-renew-change` | from `structured_operation:POST:/api/v3/payment/subscription/cancel-renew-change` · @ js/index-BZVDPgzb.js |
| `structured_operation_disappeared` | atomic | POST | `/api/v3/payment/subscription/change` | from `structured_operation:POST:/api/v3/payment/subscription/change` · @ js/index-BZVDPgzb.js |
| `structured_operation_disappeared` | atomic | POST | `/api/v3/payment/subscription/purchase` | from `structured_operation:POST:/api/v3/payment/subscription/purchase` · @ js/index-BZVDPgzb.js |
| `structured_operation_disappeared` | atomic | POST | `/api/v3/payment/subscription/uncancel` | from `structured_operation:POST:/api/v3/payment/subscription/uncancel` · @ js/index-BZVDPgzb.js |
| `structured_operation_disappeared` | atomic | POST | `/api/v3/poll/close` | from `structured_operation:POST:/api/v3/poll/close` · @ js/index-BZVDPgzb.js |
| `structured_operation_disappeared` | atomic | POST | `/api/v3/poll/live/create` | from `structured_operation:POST:/api/v3/poll/live/create` · @ js/index-BZVDPgzb.js |
| `structured_operation_disappeared` | atomic | POST | `/api/v3/poll/live/joinroom` | from `structured_operation:POST:/api/v3/poll/live/joinroom` · @ js/index-BZVDPgzb.js |
| `structured_operation_disappeared` | atomic | POST | `/api/v3/poll/live/joinroommoderator` | from `structured_operation:POST:/api/v3/poll/live/joinroommoderator` · @ js/index-BZVDPgzb.js |
| `structured_operation_disappeared` | atomic | POST | `/api/v3/poll/live/leaveroom` | from `structured_operation:POST:/api/v3/poll/live/leaveroom` · @ js/index-BZVDPgzb.js |
| `structured_operation_disappeared` | atomic | POST | `/api/v3/poll/live/leaveroommoderator` | from `structured_operation:POST:/api/v3/poll/live/leaveroommoderator` · @ js/index-BZVDPgzb.js |
| `structured_operation_disappeared` | atomic | POST | `/api/v3/poll/tk/live/joinroom` | from `structured_operation:POST:/api/v3/poll/tk/live/joinroom` · @ js/index-BZVDPgzb.js |
| `structured_operation_disappeared` | atomic | POST | `/api/v3/poll/tk/live/leaveroom` | from `structured_operation:POST:/api/v3/poll/tk/live/leaveroom` · @ js/index-BZVDPgzb.js |
| `structured_operation_disappeared` | atomic | POST | `/api/v3/poll/vote` | from `structured_operation:POST:/api/v3/poll/vote` · @ js/index-BZVDPgzb.js |
| `structured_operation_disappeared` | atomic | POST | `/api/v3/promotion/claim` | from `structured_operation:POST:/api/v3/promotion/claim` · @ js/index-BZVDPgzb.js |
| `structured_operation_disappeared` | atomic | POST | `/api/v3/push/web/register` | from `structured_operation:POST:/api/v3/push/web/register` · @ js/index-BZVDPgzb.js |
| `structured_operation_disappeared` | atomic | POST | `/api/v3/push/web/revoke` | from `structured_operation:POST:/api/v3/push/web/revoke` · @ js/index-BZVDPgzb.js |
| `structured_operation_disappeared` | atomic | POST | `/api/v3/shopify/multipass` | from `structured_operation:POST:/api/v3/shopify/multipass` · @ js/index-BZVDPgzb.js |
| `structured_operation_disappeared` | atomic | POST | `/api/v3/shopify/verify` | from `structured_operation:POST:/api/v3/shopify/verify` · @ js/index-BZVDPgzb.js |
| `structured_operation_disappeared` | atomic | POST | `/api/v3/socket/connect` | from `structured_operation:POST:/api/v3/socket/connect` · @ js/index-BZVDPgzb.js |
| `structured_operation_disappeared` | atomic | POST | `/api/v3/socket/disconnect` | from `structured_operation:POST:/api/v3/socket/disconnect` · @ js/index-BZVDPgzb.js |
| `structured_operation_disappeared` | atomic | POST | `/api/v3/socket/tk/connect` | from `structured_operation:POST:/api/v3/socket/tk/connect` · @ js/index-BZVDPgzb.js |
| `structured_operation_disappeared` | atomic | POST | `/api/v3/socket/tk/disconnect` | from `structured_operation:POST:/api/v3/socket/tk/disconnect` · @ js/index-BZVDPgzb.js |
| `structured_operation_disappeared` | atomic | POST | `/api/v3/support` | from `structured_operation:POST:/api/v3/support` · @ js/index-BZVDPgzb.js |
| `structured_operation_disappeared` | atomic | POST | `/api/v3/survey` | from `structured_operation:POST:/api/v3/survey` · @ js/index-BZVDPgzb.js |
| `structured_operation_disappeared` | atomic | POST | `/api/v3/user/achievement/badges` | from `structured_operation:POST:/api/v3/user/achievement/badges` · @ js/index-BZVDPgzb.js |
| `structured_operation_disappeared` | atomic | POST | `/api/v3/user/avatar` | from `structured_operation:POST:/api/v3/user/avatar` · @ js/index-BZVDPgzb.js |
| `structured_operation_disappeared` | atomic | POST | `/api/v3/user/delete` | from `structured_operation:POST:/api/v3/user/delete` · @ js/index-BZVDPgzb.js |
| `structured_operation_disappeared` | atomic | POST | `/api/v3/user/email/update` | from `structured_operation:POST:/api/v3/user/email/update` · @ js/index-BZVDPgzb.js |
| `structured_operation_disappeared` | atomic | POST | `/api/v3/user/email/update/complete` | from `structured_operation:POST:/api/v3/user/email/update/complete` · @ js/index-BZVDPgzb.js |
| `structured_operation_disappeared` | atomic | POST | `/api/v3/user/notification/channels` | from `structured_operation:POST:/api/v3/user/notification/channels` · @ js/index-BZVDPgzb.js |
| `structured_operation_disappeared` | atomic | POST | `/api/v3/user/notification/digest` | from `structured_operation:POST:/api/v3/user/notification/digest` · @ js/index-BZVDPgzb.js |
| `structured_operation_disappeared` | atomic | POST | `/api/v3/user/notification/email` | from `structured_operation:POST:/api/v3/user/notification/email` · @ js/index-BZVDPgzb.js |
| `structured_operation_disappeared` | atomic | POST | `/api/v3/user/notification/update` | from `structured_operation:POST:/api/v3/user/notification/update` · @ js/index-BZVDPgzb.js |
| `structured_operation_disappeared` | atomic | POST | `/api/v3/user/password/change` | from `structured_operation:POST:/api/v3/user/password/change` · @ js/index-BZVDPgzb.js |
| `structured_operation_disappeared` | atomic | POST | `/api/v3/user/password/reset` | from `structured_operation:POST:/api/v3/user/password/reset` · @ js/index-BZVDPgzb.js |
| `structured_operation_disappeared` | atomic | POST | `/api/v3/user/password/reset/request` | from `structured_operation:POST:/api/v3/user/password/reset/request` · @ js/index-BZVDPgzb.js |
| `structured_operation_disappeared` | atomic | POST | `/api/v3/user/password/reset/validate` | from `structured_operation:POST:/api/v3/user/password/reset/validate` · @ js/index-BZVDPgzb.js |
| `structured_operation_disappeared` | atomic | POST | `/api/v3/user/security/2fa` | from `structured_operation:POST:/api/v3/user/security/2fa` · @ js/index-BZVDPgzb.js |
| `structured_operation_disappeared` | atomic | POST | `/api/v3/user/security/2fa/activate` | from `structured_operation:POST:/api/v3/user/security/2fa/activate` · @ js/index-BZVDPgzb.js |
| `structured_operation_disappeared` | atomic | POST | `/api/v3/user/security/2fa/deactivate` | from `structured_operation:POST:/api/v3/user/security/2fa/deactivate` · @ js/index-BZVDPgzb.js |
| `structured_operation_disappeared` | atomic | POST | `/api/v3/user/security/backupcode` | from `structured_operation:POST:/api/v3/user/security/backupcode` · @ js/index-BZVDPgzb.js |
| `structured_operation_disappeared` | atomic | POST | `/api/v3/user/security/backupcode/activate` | from `structured_operation:POST:/api/v3/user/security/backupcode/activate` · @ js/index-BZVDPgzb.js |
| `structured_operation_disappeared` | atomic | POST | `/api/v3/user/security/backupcode/deactivate` | from `structured_operation:POST:/api/v3/user/security/backupcode/deactivate` · @ js/index-BZVDPgzb.js |
| `structured_operation_disappeared` | atomic | POST | `/api/v3/user/subscribed` | from `structured_operation:POST:/api/v3/user/subscribed` · @ js/index-BZVDPgzb.js |
| `structured_operation_disappeared` | atomic | POST | `/api/v3/user/undelete` | from `structured_operation:POST:/api/v3/user/undelete` · @ js/index-BZVDPgzb.js |
| `structured_operation_disappeared` | atomic | POST | `/api/v3/user/update` | from `structured_operation:POST:/api/v3/user/update` · @ js/index-BZVDPgzb.js |
| `structured_operation_disappeared` | atomic | POST | `/api/v3/webhooks/ivs/livestream` | from `structured_operation:POST:/api/v3/webhooks/ivs/livestream` · @ js/index-BZVDPgzb.js |
| `structured_operation_disappeared` | atomic | POST | `/api/v3/webhooks/livestream` | from `structured_operation:POST:/api/v3/webhooks/livestream` · @ js/index-BZVDPgzb.js |

## Request behavior changes

_None._

## Authentication/header changes

* **`auth_evidence_changed`** (atomic) — Frontend authentication/header-related evidence disappeared. Not proof the server dropped an auth requirement.
  * GET `/api/v3/auth/captcha/info` · from `structured_operation:GET:/api/v3/auth/captcha/info` · @ js/index-BZVDPgzb.js
* **`auth_evidence_changed`** (atomic) — Frontend authentication/header-related evidence disappeared. Not proof the server dropped an auth requirement.
  * GET `/api/v3/connect/list` · from `structured_operation:GET:/api/v3/connect/list` · @ js/index-BZVDPgzb.js
* **`auth_evidence_changed`** (atomic) — Frontend authentication/header-related evidence disappeared. Not proof the server dropped an auth requirement.
  * POST `/api/v3/auth/checkFor2faLogin` · from `structured_operation:POST:/api/v3/auth/checkFor2faLogin` · @ js/index-BZVDPgzb.js
* **`auth_evidence_changed`** (atomic) — Frontend authentication/header-related evidence disappeared. Not proof the server dropped an auth requirement.
  * POST `/api/v3/auth/keycloak/migration/login/{username_or_email_or_userid}` · from `structured_operation:POST:/api/v3/auth/keycloak/migration/login/{username_or_email_or_userid}` · @ js/index-BZVDPgzb.js
* **`auth_evidence_changed`** (atomic) — Frontend authentication/header-related evidence disappeared. Not proof the server dropped an auth requirement.
  * POST `/api/v3/auth/login` · from `structured_operation:POST:/api/v3/auth/login` · @ js/index-BZVDPgzb.js
* **`auth_evidence_changed`** (atomic) — Frontend authentication/header-related evidence disappeared. Not proof the server dropped an auth requirement.
  * POST `/api/v3/auth/logout` · from `structured_operation:POST:/api/v3/auth/logout` · @ js/index-BZVDPgzb.js
* **`auth_evidence_changed`** (atomic) — Frontend authentication/header-related evidence disappeared. Not proof the server dropped an auth requirement.
  * POST `/api/v3/auth/signup` · from `structured_operation:POST:/api/v3/auth/signup` · @ js/index-BZVDPgzb.js
* **`auth_evidence_changed`** (atomic) — Frontend authentication/header-related evidence disappeared. Not proof the server dropped an auth requirement.
  * POST `/api/v3/auth/spoof/begin` · from `structured_operation:POST:/api/v3/auth/spoof/begin` · @ js/index-BZVDPgzb.js
* **`auth_evidence_changed`** (atomic) — Frontend authentication/header-related evidence disappeared. Not proof the server dropped an auth requirement.
  * POST `/api/v3/auth/spoof/end` · from `structured_operation:POST:/api/v3/auth/spoof/end` · @ js/index-BZVDPgzb.js
* **`auth_evidence_changed`** (atomic) — Frontend authentication/header-related evidence disappeared. Not proof the server dropped an auth requirement.
  * POST `/api/v3/connect/complete` · from `structured_operation:POST:/api/v3/connect/complete` · @ js/index-BZVDPgzb.js
* **`auth_evidence_changed`** (atomic) — Frontend authentication/header-related evidence disappeared. Not proof the server dropped an auth requirement.
  * POST `/api/v3/connect/dissociate` · from `structured_operation:POST:/api/v3/connect/dissociate` · @ js/index-BZVDPgzb.js
* **`auth_evidence_changed`** (atomic) — Frontend authentication/header-related evidence disappeared. Not proof the server dropped an auth requirement.
  * POST `/api/v3/connect/refresh` · from `structured_operation:POST:/api/v3/connect/refresh` · @ js/index-BZVDPgzb.js
* **`auth_evidence_changed`** (atomic) — Frontend authentication/header-related evidence disappeared. Not proof the server dropped an auth requirement.
  * POST `/api/v3/socket/connect` · from `structured_operation:POST:/api/v3/socket/connect` · @ js/index-BZVDPgzb.js
* **`auth_evidence_changed`** (atomic) — Frontend authentication/header-related evidence disappeared. Not proof the server dropped an auth requirement.
  * POST `/api/v3/socket/tk/connect` · from `structured_operation:POST:/api/v3/socket/tk/connect` · @ js/index-BZVDPgzb.js

## Response mapper changes

_None._

## Realtime changes

_None._

## Weaker/ambiguous evidence

_None._

## Frontend-only movement

* **`provenance_moved`** (atomic) — Semantic evidence identity unchanged; source artifact/provenance moved. Informational / frontend-only — not an API change.
  * — `/api/badges/download-on-the-app-store/black/en-us` · from `ambiguous_reference:-:/api/badges/download-on-the-app-store/black/en-us:absolute_api_url_unknown_host` · to `ambiguous_reference:-:/api/badges/download-on-the-app-store/black/en-us:absolute_api_url_unknown_host` · @ js/CD2cugro.js
* **`provenance_moved`** (atomic) — Semantic evidence identity unchanged; source artifact/provenance moved. Informational / frontend-only — not an API change.
  * — `https://apm.floatplane.com` · from `network_reference:-:/:host:apm` · to `network_reference:-:/:host:apm` · @ js/index-DaEmRTqt.js
* **`provenance_moved`** (atomic) — Semantic evidence identity unchanged; source artifact/provenance moved. Informational / frontend-only — not an API change.
  * — `https://auth.floatplane.com` · from `network_reference:-:/:host:auth` · to `network_reference:-:/:host:auth` · @ js/index-DaEmRTqt.js
* **`provenance_moved`** (atomic) — Semantic evidence identity unchanged; source artifact/provenance moved. Informational / frontend-only — not an API change.
  * — `https://chat.floatplane.com` · from `network_reference:-:/:host:chat_socket` · to `network_reference:-:/:host:chat_socket` · @ js/index-DaEmRTqt.js
* **`provenance_moved`** (atomic) — Semantic evidence identity unchanged; source artifact/provenance moved. Informational / frontend-only — not an API change.
  * — `https://frontend.floatplane.com` · from `network_reference:-:/:host:frontend_cdn` · to `network_reference:-:/:host:frontend_cdn` · @ js/index-DaEmRTqt.js
* **`provenance_moved`** (atomic) — Semantic evidence identity unchanged; source artifact/provenance moved. Informational / frontend-only — not an API change.
  * — `https://status.floatplane.com` · from `network_reference:-:/:host:status` · to `network_reference:-:/:host:status` · @ js/index-DaEmRTqt.js
* **`provenance_moved`** (atomic) — Semantic evidence identity unchanged; source artifact/provenance moved. Informational / frontend-only — not an API change.
  * — `/api/authxml` · from `network_reference:-:/api/authxml:string_literal_api` · to `network_reference:-:/api/authxml:string_literal_api` · @ js/TfN8-Zm-.js
* **`provenance_moved`** (atomic) — Semantic evidence identity unchanged; source artifact/provenance moved. Informational / frontend-only — not an API change.
  * — `/api/v3/auth/keycloak/migration/login/{username_or_email}` · from `network_reference:-:/api/v3/auth/keycloak/migration/login/{username_or_email}:string_literal_api` · to `network_reference:-:/api/v3/auth/keycloak/migration/login/{username_or_email}:string_literal_api` · @ js/index-DaEmRTqt.js
* **`provenance_moved`** (atomic) — Semantic evidence identity unchanged; source artifact/provenance moved. Informational / frontend-only — not an API change.
  * — `/api/v3/connect/{site}` · from `network_reference:-:/api/v3/connect/{site}:string_literal_api` · to `network_reference:-:/api/v3/connect/{site}:string_literal_api` · @ js/index-DaEmRTqt.js
* **`provenance_moved`** (atomic) — Semantic evidence identity unchanged; source artifact/provenance moved. Informational / frontend-only — not an API change.
  * — `/api/v3/connect/{site}/callback` · from `network_reference:-:/api/v3/connect/{site}/callback:string_literal_api` · to `network_reference:-:/api/v3/connect/{site}/callback:string_literal_api` · @ js/index-DaEmRTqt.js
* **`provenance_moved`** (atomic) — Semantic evidence identity unchanged; source artifact/provenance moved. Informational / frontend-only — not an API change.
  * — `/api/v3/payment/webhook/{paymentProcessor}` · from `network_reference:-:/api/v3/payment/webhook/{paymentProcessor}:string_literal_api` · to `network_reference:-:/api/v3/payment/webhook/{paymentProcessor}:string_literal_api` · @ js/index-DaEmRTqt.js
* **`provenance_moved`** (atomic) — Semantic evidence identity unchanged; source artifact/provenance moved. Informational / frontend-only — not an API change.
  * — `/api/v3/payment/webhook/{paymentProcessor}/{subPaymentProcessor}` · from `network_reference:-:/api/v3/payment/webhook/{paymentProcessor}/{subPaymentProcessor}:string_literal_api` · to `network_reference:-:/api/v3/payment/webhook/{paymentProcessor}/{subPaymentProcessor}:string_literal_api` · @ js/index-DaEmRTqt.js
* **`provenance_moved`** (atomic) — Semantic evidence identity unchanged; source artifact/provenance moved. Informational / frontend-only — not an API change.
  * — `/api/v3/poll/live/joinroom` · from `network_reference:-:/api/v3/poll/live/joinroom:string_literal_api` · to `network_reference:-:/api/v3/poll/live/joinroom:string_literal_api` · @ js/2XaFvhNJ.js
* **`provenance_moved`** (atomic) — Semantic evidence identity unchanged; source artifact/provenance moved. Informational / frontend-only — not an API change.
  * — `/api/v3/poll/live/leaveroom` · from `network_reference:-:/api/v3/poll/live/leaveroom:string_literal_api` · to `network_reference:-:/api/v3/poll/live/leaveroom:string_literal_api` · @ js/2XaFvhNJ.js
* **`provenance_moved`** (atomic) — Semantic evidence identity unchanged; source artifact/provenance moved. Informational / frontend-only — not an API change.
  * — `/api/v3/poll/tk/live/joinroom` · from `network_reference:-:/api/v3/poll/tk/live/joinroom:string_literal_api` · to `network_reference:-:/api/v3/poll/tk/live/joinroom:string_literal_api` · @ js/2XaFvhNJ.js
* **`provenance_moved`** (atomic) — Semantic evidence identity unchanged; source artifact/provenance moved. Informational / frontend-only — not an API change.
  * — `/api/v3/poll/tk/live/leaveroom` · from `network_reference:-:/api/v3/poll/tk/live/leaveroom:string_literal_api` · to `network_reference:-:/api/v3/poll/tk/live/leaveroom:string_literal_api` · @ js/2XaFvhNJ.js
* **`provenance_moved`** (atomic) — Semantic evidence identity unchanged; source artifact/provenance moved. Informational / frontend-only — not an API change.
  * — `/api/v3/redirect-yt-latest/{channelKey}` · from `network_reference:-:/api/v3/redirect-yt-latest/{channelKey}:string_literal_api` · to `network_reference:-:/api/v3/redirect-yt-latest/{channelKey}:string_literal_api` · @ js/index-DaEmRTqt.js
* **`provenance_moved`** (atomic) — Semantic evidence identity unchanged; source artifact/provenance moved. Informational / frontend-only — not an API change.
  * — `/` · from `realtime_operation:-:/:chat_socket_uri` · to `realtime_operation:-:/:chat_socket_uri` · @ js/index-DaEmRTqt.js
* **`provenance_moved`** (atomic) — Semantic evidence identity unchanged; source artifact/provenance moved. Informational / frontend-only — not an API change.
  * POST `—` · from `realtime_operation:POST:-:sails_socket_post_unresolved_path` · to `realtime_operation:POST:-:sails_socket_post_unresolved_path` · @ js/2XaFvhNJ.js
* **`provenance_moved`** (atomic) — Semantic evidence identity unchanged; source artifact/provenance moved. Informational / frontend-only — not an API change.
  * POST `/api/v3/socket/connect` · from `realtime_operation:POST:/api/v3/socket/connect:sails_socket_post` · to `realtime_operation:POST:/api/v3/socket/connect:sails_socket_post` · @ js/index-DaEmRTqt.js
* **`provenance_moved`** (atomic) — Semantic evidence identity unchanged; source artifact/provenance moved. Informational / frontend-only — not an API change.
  * POST `/api/v3/socket/disconnect` · from `realtime_operation:POST:/api/v3/socket/disconnect:sails_socket_post` · to `realtime_operation:POST:/api/v3/socket/disconnect:sails_socket_post` · @ js/index-DaEmRTqt.js
* **`provenance_moved`** (atomic) — Semantic evidence identity unchanged; source artifact/provenance moved. Informational / frontend-only — not an API change.
  * POST `/api/v3/socket/tk/connect` · from `realtime_operation:POST:/api/v3/socket/tk/connect:sails_socket_post` · to `realtime_operation:POST:/api/v3/socket/tk/connect:sails_socket_post` · @ js/index-DaEmRTqt.js
* **`provenance_moved`** (atomic) — Semantic evidence identity unchanged; source artifact/provenance moved. Informational / frontend-only — not an API change.
  * POST `/api/v3/socket/tk/disconnect` · from `realtime_operation:POST:/api/v3/socket/tk/disconnect:sails_socket_post` · to `realtime_operation:POST:/api/v3/socket/tk/disconnect:sails_socket_post` · @ js/index-DaEmRTqt.js
* **`provenance_moved`** (atomic) — Semantic evidence identity unchanged; source artifact/provenance moved. Informational / frontend-only — not an API change.
  * — `/api/cms/v3/subscribers/download` · from `url_template:-:/api/cms/v3/subscribers/download:template_literal` · to `url_template:-:/api/cms/v3/subscribers/download:template_literal` · @ js/BV0d5Y1o.js
* **`provenance_moved`** (atomic) — Semantic evidence identity unchanged; source artifact/provenance moved. Informational / frontend-only — not an API change.
  * — `/api/connect/{param}` · from `url_template:-:/api/connect/{param}:template_literal` · to `url_template:-:/api/connect/{param}:template_literal` · @ js/ljJPxNpq.js
* **`provenance_moved`** (atomic) — Semantic evidence identity unchanged; source artifact/provenance moved. Informational / frontend-only — not an API change.
  * — `/api/v1/components/groups` · from `url_template:-:/api/v1/components/groups:template_literal` · to `url_template:-:/api/v1/components/groups:template_literal` · @ js/C02NyVxO.js
* **`provenance_moved`** (atomic) — Semantic evidence identity unchanged; source artifact/provenance moved. Informational / frontend-only — not an API change.
  * — `/api/v2/connect/discord` · from `url_template:-:/api/v2/connect/discord:template_literal` · to `url_template:-:/api/v2/connect/discord:template_literal` · @ js/CWZoCrqS.js

## Suppressed / indeterminate

_None._

## Warnings / limitations

* (none)

* Comparator: `phase2.2-frontend-evidence-diff@2.2.1` (schema v2)
* Frontend-evidence change report only. Not an authoritative server API changelog. Do not treat structured_operation_disappeared as API removal without a later verification phase. method_set_changed is a derived grouping of atomic method+path facts — do not triple-count with add/disappear.

