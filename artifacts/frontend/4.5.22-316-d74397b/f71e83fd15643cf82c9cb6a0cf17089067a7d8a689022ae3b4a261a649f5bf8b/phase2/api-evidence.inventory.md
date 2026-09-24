# Frontend API evidence inventory

**Observation:** `f71e83fd15643cf82c9cb6a0cf17089067a7d8a689022ae3b4a261a649f5bf8b`
**Build:** `4.5.22-316-d74397b`
**Extractor:** `phase2.1-frontend-evidence@2.1.0`
**Evidence schema:** `v1`
**Extracted at:** 2026-09-24T17:18:33.525Z

> Frontend client evidence from archived JS for this observation only.
> This is **not** a complete server API catalog and **not** an inter-observation change report.

## Counts

| Metric | Value |
|--------|------:|
| Structured operations (unique method+path) | 350 |
| Evidence items (all categories) | 377 |
| Category `ambiguous_reference` | 1 |
| Category `network_reference` | 16 |
| Category `realtime_operation` | 6 |
| Category `structured_operation` | 350 |
| Category `url_template` | 4 |
| Rejected signals | 7 |
| Reachable JS modules | 249 |
| Lazy JS (excl. entry) | 248 |
| JS bytes archived (phase2 chunks) | 3570490 |
| Collection status | complete |

## Structured operations by method

| Method | Count |
|--------|------:|
| GET | 156 |
| POST | 194 |

## Structured operations (METHOD PATH SOURCE)

| Method | Path | Source |
|--------|------|--------|
| GET | `/api/acp/v3/achievement` | `js/index-BZVDPgzb.js` |
| POST | `/api/acp/v3/achievement/award` | `js/index-BZVDPgzb.js` |
| POST | `/api/acp/v3/achievement/create` | `js/index-BZVDPgzb.js` |
| POST | `/api/acp/v3/achievement/create/multi-stage` | `js/index-BZVDPgzb.js` |
| POST | `/api/acp/v3/achievement/delete` | `js/index-BZVDPgzb.js` |
| GET | `/api/acp/v3/achievement/list` | `js/index-BZVDPgzb.js` |
| GET | `/api/acp/v3/achievement/perk` | `js/index-BZVDPgzb.js` |
| POST | `/api/acp/v3/achievement/perk/create` | `js/index-BZVDPgzb.js` |
| POST | `/api/acp/v3/achievement/perk/delete` | `js/index-BZVDPgzb.js` |
| POST | `/api/acp/v3/achievement/perk/image/upload` | `js/index-BZVDPgzb.js` |
| GET | `/api/acp/v3/achievement/perk/list` | `js/index-BZVDPgzb.js` |
| POST | `/api/acp/v3/achievement/perk/update` | `js/index-BZVDPgzb.js` |
| POST | `/api/acp/v3/achievement/strip` | `js/index-BZVDPgzb.js` |
| POST | `/api/acp/v3/achievement/update` | `js/index-BZVDPgzb.js` |
| GET | `/api/acp/v3/agreement` | `js/index-BZVDPgzb.js` |
| POST | `/api/acp/v3/agreement/create` | `js/index-BZVDPgzb.js` |
| GET | `/api/acp/v3/agreement/list` | `js/index-BZVDPgzb.js` |
| POST | `/api/acp/v3/agreement/update` | `js/index-BZVDPgzb.js` |
| GET | `/api/acp/v3/blogPost` | `js/index-BZVDPgzb.js` |
| GET | `/api/acp/v3/blogPost/list` | `js/index-BZVDPgzb.js` |
| POST | `/api/acp/v3/blogPost/moveContent` | `js/index-BZVDPgzb.js` |
| GET | `/api/acp/v3/blogPost/multi` | `js/index-BZVDPgzb.js` |
| GET | `/api/acp/v3/channel` | `js/index-BZVDPgzb.js` |
| GET | `/api/acp/v3/channel/list` | `js/index-BZVDPgzb.js` |
| GET | `/api/acp/v3/channel/multi` | `js/index-BZVDPgzb.js` |
| GET | `/api/acp/v3/chat/channel/list` | `js/index-BZVDPgzb.js` |
| GET | `/api/acp/v3/chat/list` | `js/index-BZVDPgzb.js` |
| GET | `/api/acp/v3/content` | `js/index-BZVDPgzb.js` |
| GET | `/api/acp/v3/content/list` | `js/index-BZVDPgzb.js` |
| GET | `/api/acp/v3/content/multi` | `js/index-BZVDPgzb.js` |
| GET | `/api/acp/v3/creator` | `js/index-BZVDPgzb.js` |
| GET | `/api/acp/v3/creator/category` | `js/index-BZVDPgzb.js` |
| POST | `/api/acp/v3/creator/category/create` | `js/index-BZVDPgzb.js` |
| POST | `/api/acp/v3/creator/category/delete` | `js/index-BZVDPgzb.js` |
| GET | `/api/acp/v3/creator/category/list` | `js/index-BZVDPgzb.js` |
| POST | `/api/acp/v3/creator/category/update` | `js/index-BZVDPgzb.js` |
| POST | `/api/acp/v3/creator/create` | `js/index-BZVDPgzb.js` |
| POST | `/api/acp/v3/creator/invite/create` | `js/index-BZVDPgzb.js` |
| GET | `/api/acp/v3/creator/invite/list` | `js/index-BZVDPgzb.js` |
| POST | `/api/acp/v3/creator/invite/update` | `js/index-BZVDPgzb.js` |
| GET | `/api/acp/v3/creator/list` | `js/index-BZVDPgzb.js` |
| GET | `/api/acp/v3/creator/multi` | `js/index-BZVDPgzb.js` |
| POST | `/api/acp/v3/creator/update` | `js/index-BZVDPgzb.js` |
| GET | `/api/acp/v3/creator/urlname/availability` | `js/index-BZVDPgzb.js` |
| GET | `/api/acp/v3/faq` | `js/index-BZVDPgzb.js` |
| GET | `/api/acp/v3/faq/list` | `js/index-BZVDPgzb.js` |
| GET | `/api/acp/v3/ingest` | `js/index-BZVDPgzb.js` |
| POST | `/api/acp/v3/ingest` | `js/index-BZVDPgzb.js` |
| POST | `/api/acp/v3/ingest/delete` | `js/index-BZVDPgzb.js` |
| GET | `/api/acp/v3/ingest/list` | `js/index-BZVDPgzb.js` |
| POST | `/api/acp/v3/ingest/multi` | `js/index-BZVDPgzb.js` |
| POST | `/api/acp/v3/ingest/start` | `js/index-BZVDPgzb.js` |
| POST | `/api/acp/v3/ingest/stop` | `js/index-BZVDPgzb.js` |
| POST | `/api/acp/v3/ingest/update` | `js/index-BZVDPgzb.js` |
| POST | `/api/acp/v3/invoice/mark-refunded` | `js/index-BZVDPgzb.js` |
| GET | `/api/acp/v3/invoice/user/list` | `js/index-BZVDPgzb.js` |
| GET | `/api/acp/v3/invoice/user/processor` | `js/index-BZVDPgzb.js` |
| POST | `/api/acp/v3/job/start` | `js/index-BZVDPgzb.js` |
| GET | `/api/acp/v3/job/status` | `js/index-BZVDPgzb.js` |
| POST | `/api/acp/v3/job/stop` | `js/index-BZVDPgzb.js` |
| GET | `/api/acp/v3/moderator/list` | `js/index-BZVDPgzb.js` |
| GET | `/api/acp/v3/plan` | `js/index-BZVDPgzb.js` |
| POST | `/api/acp/v3/plan/cost` | `js/index-BZVDPgzb.js` |
| POST | `/api/acp/v3/plan/create` | `js/index-BZVDPgzb.js` |
| POST | `/api/acp/v3/plan/delete` | `js/index-BZVDPgzb.js` |
| GET | `/api/acp/v3/plan/list` | `js/index-BZVDPgzb.js` |
| GET | `/api/acp/v3/plan/multi` | `js/index-BZVDPgzb.js` |
| POST | `/api/acp/v3/plan/update` | `js/index-BZVDPgzb.js` |
| GET | `/api/acp/v3/promotion` | `js/index-BZVDPgzb.js` |
| POST | `/api/acp/v3/promotion` | `js/index-BZVDPgzb.js` |
| POST | `/api/acp/v3/promotion/delete` | `js/index-BZVDPgzb.js` |
| GET | `/api/acp/v3/promotion/list` | `js/index-BZVDPgzb.js` |
| POST | `/api/acp/v3/promotion/multi` | `js/index-BZVDPgzb.js` |
| GET | `/api/acp/v3/promotion/types` | `js/index-BZVDPgzb.js` |
| POST | `/api/acp/v3/promotion/unclaim` | `js/index-BZVDPgzb.js` |
| POST | `/api/acp/v3/promotion/update` | `js/index-BZVDPgzb.js` |
| GET | `/api/acp/v3/service-message` | `js/index-BZVDPgzb.js` |
| POST | `/api/acp/v3/service-message/create` | `js/index-BZVDPgzb.js` |
| POST | `/api/acp/v3/service-message/delete` | `js/index-BZVDPgzb.js` |
| GET | `/api/acp/v3/service-message/list` | `js/index-BZVDPgzb.js` |
| POST | `/api/acp/v3/service-message/update` | `js/index-BZVDPgzb.js` |
| GET | `/api/acp/v3/survey/report` | `js/index-BZVDPgzb.js` |
| GET | `/api/acp/v3/user` | `js/index-BZVDPgzb.js` |
| GET | `/api/acp/v3/user/achievement` | `js/index-BZVDPgzb.js` |
| POST | `/api/acp/v3/user/avatar/upload` | `js/index-BZVDPgzb.js` |
| POST | `/api/acp/v3/user/delete` | `js/index-BZVDPgzb.js` |
| GET | `/api/acp/v3/user/export` | `js/index-BZVDPgzb.js` |
| GET | `/api/acp/v3/user/list` | `js/index-BZVDPgzb.js` |
| POST | `/api/acp/v3/user/password/reset/request` | `js/index-BZVDPgzb.js` |
| POST | `/api/acp/v3/user/subscription/create` | `js/index-BZVDPgzb.js` |
| POST | `/api/acp/v3/user/subscription/delete` | `js/index-BZVDPgzb.js` |
| POST | `/api/acp/v3/user/undelete` | `js/index-BZVDPgzb.js` |
| POST | `/api/acp/v3/user/update` | `js/index-BZVDPgzb.js` |
| GET | `/api/cms/v3/achievement` | `js/index-BZVDPgzb.js` |
| POST | `/api/cms/v3/achievement/award` | `js/index-BZVDPgzb.js` |
| POST | `/api/cms/v3/achievement/create` | `js/index-BZVDPgzb.js` |
| POST | `/api/cms/v3/achievement/create/progressive` | `js/index-BZVDPgzb.js` |
| POST | `/api/cms/v3/achievement/delete` | `js/index-BZVDPgzb.js` |
| GET | `/api/cms/v3/achievement/list` | `js/index-BZVDPgzb.js` |
| GET | `/api/cms/v3/achievement/perk` | `js/index-BZVDPgzb.js` |
| POST | `/api/cms/v3/achievement/perk/create` | `js/index-BZVDPgzb.js` |
| POST | `/api/cms/v3/achievement/perk/delete` | `js/index-BZVDPgzb.js` |
| POST | `/api/cms/v3/achievement/perk/image/upload` | `js/index-BZVDPgzb.js` |
| GET | `/api/cms/v3/achievement/perk/list` | `js/index-BZVDPgzb.js` |
| POST | `/api/cms/v3/achievement/perk/update` | `js/index-BZVDPgzb.js` |
| POST | `/api/cms/v3/achievement/strip` | `js/index-BZVDPgzb.js` |
| POST | `/api/cms/v3/achievement/update` | `js/index-BZVDPgzb.js` |
| GET | `/api/cms/v3/blogPost` | `js/index-BZVDPgzb.js` |
| POST | `/api/cms/v3/blogPost/attachments/update` | `js/index-BZVDPgzb.js` |
| POST | `/api/cms/v3/blogPost/create` | `js/index-BZVDPgzb.js` |
| POST | `/api/cms/v3/blogPost/delete` | `js/index-BZVDPgzb.js` |
| POST | `/api/cms/v3/blogPost/edit` | `js/index-BZVDPgzb.js` |
| POST | `/api/cms/v3/blogPost/edit/bulk` | `js/index-BZVDPgzb.js` |
| GET | `/api/cms/v3/blogPost/get` | `js/index-BZVDPgzb.js` |
| GET | `/api/cms/v3/blogPost/list` | `js/index-BZVDPgzb.js` |
| POST | `/api/cms/v3/blogPost/multi` | `js/index-BZVDPgzb.js` |
| GET | `/api/cms/v3/chat/list` | `js/index-BZVDPgzb.js` |
| GET | `/api/cms/v3/comment/list` | `js/index-BZVDPgzb.js` |
| GET | `/api/cms/v3/content` | `js/index-BZVDPgzb.js` |
| GET | `/api/cms/v3/content/audio` | `js/index-BZVDPgzb.js` |
| GET | `/api/cms/v3/content/audio/list` | `js/index-BZVDPgzb.js` |
| GET | `/api/cms/v3/content/bulk` | `js/index-BZVDPgzb.js` |
| POST | `/api/cms/v3/content/delete` | `js/index-BZVDPgzb.js` |
| POST | `/api/cms/v3/content/delete/texttrack` | `js/index-BZVDPgzb.js` |
| POST | `/api/cms/v3/content/edit` | `js/index-BZVDPgzb.js` |
| POST | `/api/cms/v3/content/move` | `js/index-BZVDPgzb.js` |
| GET | `/api/cms/v3/content/picture` | `js/index-BZVDPgzb.js` |
| GET | `/api/cms/v3/content/picture/list` | `js/index-BZVDPgzb.js` |
| POST | `/api/cms/v3/content/upload/texttrack` | `js/index-BZVDPgzb.js` |
| GET | `/api/cms/v3/content/video` | `js/index-BZVDPgzb.js` |
| GET | `/api/cms/v3/content/video/list` | `js/index-BZVDPgzb.js` |
| GET | `/api/cms/v3/creator` | `js/index-BZVDPgzb.js` |
| GET | `/api/cms/v3/creator/agreement` | `js/index-BZVDPgzb.js` |
| POST | `/api/cms/v3/creator/agreement/confirm` | `js/index-BZVDPgzb.js` |
| GET | `/api/cms/v3/creator/channel` | `js/index-BZVDPgzb.js` |
| POST | `/api/cms/v3/creator/channels` | `js/index-BZVDPgzb.js` |
| POST | `/api/cms/v3/creator/channels/default` | `js/index-BZVDPgzb.js` |
| POST | `/api/cms/v3/creator/channels/delete` | `js/index-BZVDPgzb.js` |
| POST | `/api/cms/v3/creator/channels/image` | `js/index-BZVDPgzb.js` |
| GET | `/api/cms/v3/creator/channels/list` | `js/index-BZVDPgzb.js` |
| POST | `/api/cms/v3/creator/channels/reorder` | `js/index-BZVDPgzb.js` |
| GET | `/api/cms/v3/creator/channels/social` | `js/index-BZVDPgzb.js` |
| POST | `/api/cms/v3/creator/channels/social` | `js/index-BZVDPgzb.js` |
| POST | `/api/cms/v3/creator/channels/update` | `js/index-BZVDPgzb.js` |
| GET | `/api/cms/v3/creator/social` | `js/index-BZVDPgzb.js` |
| POST | `/api/cms/v3/creator/social/update` | `js/index-BZVDPgzb.js` |
| POST | `/api/cms/v3/creator/update` | `js/index-BZVDPgzb.js` |
| POST | `/api/cms/v3/creator/update/image` | `js/index-BZVDPgzb.js` |
| POST | `/api/cms/v3/creator/visibility/update` | `js/index-BZVDPgzb.js` |
| GET | `/api/cms/v3/live/info` | `js/index-BZVDPgzb.js` |
| POST | `/api/cms/v3/live/thumbnail` | `js/index-BZVDPgzb.js` |
| POST | `/api/cms/v3/live/update` | `js/index-BZVDPgzb.js` |
| GET | `/api/cms/v3/plan` | `js/index-BZVDPgzb.js` |
| POST | `/api/cms/v3/plan/cost` | `js/index-BZVDPgzb.js` |
| POST | `/api/cms/v3/plan/create` | `js/index-BZVDPgzb.js` |
| POST | `/api/cms/v3/plan/delete` | `js/index-BZVDPgzb.js` |
| GET | `/api/cms/v3/plan/list` | `js/index-BZVDPgzb.js` |
| GET | `/api/cms/v3/plan/multi` | `js/index-BZVDPgzb.js` |
| POST | `/api/cms/v3/plan/preview` | `js/index-BZVDPgzb.js` |
| POST | `/api/cms/v3/plan/preview/stop` | `js/index-BZVDPgzb.js` |
| POST | `/api/cms/v3/plan/publish` | `js/index-BZVDPgzb.js` |
| POST | `/api/cms/v3/plan/update` | `js/index-BZVDPgzb.js` |
| GET | `/api/cms/v3/poll/list` | `js/index-BZVDPgzb.js` |
| GET | `/api/cms/v3/processing/active` | `js/index-BZVDPgzb.js` |
| GET | `/api/cms/v3/subscribers/download` | `js/index-BZVDPgzb.js` |
| GET | `/api/cms/v3/subscribers/list` | `js/index-BZVDPgzb.js` |
| GET | `/api/cms/v3/survey/report` | `js/index-BZVDPgzb.js` |
| GET | `/api/cms/v3/survey/report/enabled` | `js/index-BZVDPgzb.js` |
| POST | `/api/cms/v3/transcode/subscribe` | `js/index-BZVDPgzb.js` |
| POST | `/api/cms/v3/transcode/unsubscribe` | `js/index-BZVDPgzb.js` |
| POST | `/api/v3/achievement/perks` | `js/index-BZVDPgzb.js` |
| POST | `/api/v3/activation/email/confirm` | `js/index-BZVDPgzb.js` |
| POST | `/api/v3/activation/email/request` | `js/index-BZVDPgzb.js` |
| GET | `/api/v3/auth/captcha/info` | `js/index-BZVDPgzb.js` |
| POST | `/api/v3/auth/checkFor2faLogin` | `js/index-BZVDPgzb.js` |
| POST | `/api/v3/auth/keycloak/migration/login/{username_or_email_or_userid}` | `js/index-BZVDPgzb.js` |
| POST | `/api/v3/auth/login` | `js/index-BZVDPgzb.js` |
| POST | `/api/v3/auth/logout` | `js/index-BZVDPgzb.js` |
| POST | `/api/v3/auth/signup` | `js/index-BZVDPgzb.js` |
| POST | `/api/v3/auth/spoof/begin` | `js/index-BZVDPgzb.js` |
| POST | `/api/v3/auth/spoof/end` | `js/index-BZVDPgzb.js` |
| GET | `/api/v3/comment` | `js/index-BZVDPgzb.js` |
| POST | `/api/v3/comment` | `js/index-BZVDPgzb.js` |
| POST | `/api/v3/comment/delete` | `js/index-BZVDPgzb.js` |
| POST | `/api/v3/comment/dislike` | `js/index-BZVDPgzb.js` |
| POST | `/api/v3/comment/edit` | `js/index-BZVDPgzb.js` |
| GET | `/api/v3/comment/history` | `js/index-BZVDPgzb.js` |
| POST | `/api/v3/comment/like` | `js/index-BZVDPgzb.js` |
| POST | `/api/v3/comment/pin` | `js/index-BZVDPgzb.js` |
| GET | `/api/v3/comment/replies` | `js/index-BZVDPgzb.js` |
| POST | `/api/v3/comment/reply` | `js/index-BZVDPgzb.js` |
| POST | `/api/v3/connect/complete` | `js/index-BZVDPgzb.js` |
| POST | `/api/v3/connect/dissociate` | `js/index-BZVDPgzb.js` |
| GET | `/api/v3/connect/list` | `js/index-BZVDPgzb.js` |
| POST | `/api/v3/connect/refresh` | `js/index-BZVDPgzb.js` |
| GET | `/api/v3/content/audio` | `js/index-BZVDPgzb.js` |
| GET | `/api/v3/content/creator` | `js/index-BZVDPgzb.js` |
| POST | `/api/v3/content/creator/list` | `js/index-BZVDPgzb.js` |
| POST | `/api/v3/content/dislike` | `js/index-BZVDPgzb.js` |
| GET | `/api/v3/content/history` | `js/index-BZVDPgzb.js` |
| GET | `/api/v3/content/info` | `js/index-BZVDPgzb.js` |
| GET | `/api/v3/content/landing-page` | `js/index-BZVDPgzb.js` |
| POST | `/api/v3/content/like` | `js/index-BZVDPgzb.js` |
| GET | `/api/v3/content/picture` | `js/index-BZVDPgzb.js` |
| GET | `/api/v3/content/picture/url` | `js/index-BZVDPgzb.js` |
| GET | `/api/v3/content/post` | `js/index-BZVDPgzb.js` |
| POST | `/api/v3/content/post/list` | `js/index-BZVDPgzb.js` |
| GET | `/api/v3/content/post/random` | `js/index-BZVDPgzb.js` |
| GET | `/api/v3/content/progress` | `js/index-BZVDPgzb.js` |
| POST | `/api/v3/content/progress` | `js/index-BZVDPgzb.js` |
| POST | `/api/v3/content/progress/clear` | `js/index-BZVDPgzb.js` |
| POST | `/api/v3/content/progress/delete` | `js/index-BZVDPgzb.js` |
| GET | `/api/v3/content/related` | `js/index-BZVDPgzb.js` |
| GET | `/api/v3/content/search` | `js/index-BZVDPgzb.js` |
| GET | `/api/v3/content/tags` | `js/index-BZVDPgzb.js` |
| POST | `/api/v3/content/thumbnail/subscribe` | `js/index-BZVDPgzb.js` |
| POST | `/api/v3/content/thumbnail/unsubscribe` | `js/index-BZVDPgzb.js` |
| GET | `/api/v3/content/upload/s3/multipart` | `js/index-BZVDPgzb.js` |
| POST | `/api/v3/content/upload/s3/multipart` | `js/index-BZVDPgzb.js` |
| POST | `/api/v3/content/upload/s3/multipart/abort` | `js/index-BZVDPgzb.js` |
| POST | `/api/v3/content/upload/s3/multipart/complete` | `js/index-BZVDPgzb.js` |
| GET | `/api/v3/content/upload/s3/multipart/sign` | `js/index-BZVDPgzb.js` |
| POST | `/api/v3/content/upload/thumbnail` | `js/index-BZVDPgzb.js` |
| GET | `/api/v3/content/video` | `js/index-BZVDPgzb.js` |
| GET | `/api/v3/creator/category/list` | `js/index-BZVDPgzb.js` |
| GET | `/api/v3/creator/channels/list` | `js/index-BZVDPgzb.js` |
| GET | `/api/v3/creator/discover` | `js/index-BZVDPgzb.js` |
| GET | `/api/v3/creator/info` | `js/index-BZVDPgzb.js` |
| POST | `/api/v3/creator/invite/bind` | `js/index-BZVDPgzb.js` |
| POST | `/api/v3/creator/invite/claim` | `js/index-BZVDPgzb.js` |
| GET | `/api/v3/creator/invite/info` | `js/index-BZVDPgzb.js` |
| GET | `/api/v3/creator/list` | `js/index-BZVDPgzb.js` |
| GET | `/api/v3/creator/named` | `js/index-BZVDPgzb.js` |
| GET | `/api/v3/creator/stats` | `js/index-BZVDPgzb.js` |
| POST | `/api/v3/creator/subscribe` | `js/index-BZVDPgzb.js` |
| POST | `/api/v3/creator/unsubscribe` | `js/index-BZVDPgzb.js` |
| GET | `/api/v3/delivery/info` | `js/index-BZVDPgzb.js` |
| GET | `/api/v3/discord/bot/info` | `js/index-BZVDPgzb.js` |
| GET | `/api/v3/discord/bot/invite/generate` | `js/index-BZVDPgzb.js` |
| GET | `/api/v3/discord/bot/link` | `js/index-BZVDPgzb.js` |
| GET | `/api/v3/discord/bot/link/callback` | `js/index-BZVDPgzb.js` |
| GET | `/api/v3/discord/bot/list` | `js/index-BZVDPgzb.js` |
| POST | `/api/v3/discord/bot/unlink` | `js/index-BZVDPgzb.js` |
| POST | `/api/v3/discord/bot/update` | `js/index-BZVDPgzb.js` |
| POST | `/api/v3/discord/server/join` | `js/index-BZVDPgzb.js` |
| GET | `/api/v3/faq/list` | `js/index-BZVDPgzb.js` |
| GET | `/api/v3/image/optimizations` | `js/index-BZVDPgzb.js` |
| GET | `/api/v3/image/type` | `js/index-BZVDPgzb.js` |
| GET | `/api/v3/image/type/list` | `js/index-BZVDPgzb.js` |
| GET | `/api/v3/live/info` | `js/index-BZVDPgzb.js` |
| POST | `/api/v3/moderation/comment/hide` | `js/index-BZVDPgzb.js` |
| POST | `/api/v3/moderation/comment/unhide` | `js/index-BZVDPgzb.js` |
| POST | `/api/v3/moderation/user/ban` | `js/index-BZVDPgzb.js` |
| GET | `/api/v3/moderation/user/ban/list` | `js/index-BZVDPgzb.js` |
| GET | `/api/v3/moderation/user/info` | `js/index-BZVDPgzb.js` |
| POST | `/api/v3/moderation/user/unban` | `js/index-BZVDPgzb.js` |
| POST | `/api/v3/payment/address/add` | `js/index-BZVDPgzb.js` |
| POST | `/api/v3/payment/address/delete` | `js/index-BZVDPgzb.js` |
| GET | `/api/v3/payment/address/list` | `js/index-BZVDPgzb.js` |
| POST | `/api/v3/payment/address/set` | `js/index-BZVDPgzb.js` |
| POST | `/api/v3/payment/address/update` | `js/index-BZVDPgzb.js` |
| GET | `/api/v3/payment/braintree/token` | `js/index-BZVDPgzb.js` |
| GET | `/api/v3/payment/invoice/list` | `js/index-BZVDPgzb.js` |
| POST | `/api/v3/payment/method/add` | `js/index-BZVDPgzb.js` |
| POST | `/api/v3/payment/method/delete` | `js/index-BZVDPgzb.js` |
| GET | `/api/v3/payment/method/list` | `js/index-BZVDPgzb.js` |
| POST | `/api/v3/payment/method/set` | `js/index-BZVDPgzb.js` |
| POST | `/api/v3/payment/setup-intents` | `js/index-BZVDPgzb.js` |
| GET | `/api/v3/payment/stripe/checkout` | `js/index-BZVDPgzb.js` |
| GET | `/api/v3/payment/stripe/manage` | `js/index-BZVDPgzb.js` |
| GET | `/api/v3/payment/stripe/pk` | `js/index-BZVDPgzb.js` |
| GET | `/api/v3/payment/stripe/products` | `js/index-BZVDPgzb.js` |
| GET | `/api/v3/payment/stripe/subscription` | `js/index-BZVDPgzb.js` |
| POST | `/api/v3/payment/stripe/webhook` | `js/index-BZVDPgzb.js` |
| POST | `/api/v3/payment/subscription/cancel` | `js/index-BZVDPgzb.js` |
| POST | `/api/v3/payment/subscription/cancel-renew-change` | `js/index-BZVDPgzb.js` |
| POST | `/api/v3/payment/subscription/change` | `js/index-BZVDPgzb.js` |
| POST | `/api/v3/payment/subscription/purchase` | `js/index-BZVDPgzb.js` |
| POST | `/api/v3/payment/subscription/uncancel` | `js/index-BZVDPgzb.js` |
| GET | `/api/v3/payment/tax/estimate` | `js/index-BZVDPgzb.js` |
| GET | `/api/v3/plan/content` | `js/index-BZVDPgzb.js` |
| GET | `/api/v3/plan/info` | `js/index-BZVDPgzb.js` |
| POST | `/api/v3/poll/close` | `js/index-BZVDPgzb.js` |
| GET | `/api/v3/poll/cms/list` | `js/index-BZVDPgzb.js` |
| POST | `/api/v3/poll/live/create` | `js/index-BZVDPgzb.js` |
| POST | `/api/v3/poll/live/joinroom` | `js/index-BZVDPgzb.js` |
| POST | `/api/v3/poll/live/joinroommoderator` | `js/index-BZVDPgzb.js` |
| POST | `/api/v3/poll/live/leaveroom` | `js/index-BZVDPgzb.js` |
| POST | `/api/v3/poll/live/leaveroommoderator` | `js/index-BZVDPgzb.js` |
| POST | `/api/v3/poll/tk/live/joinroom` | `js/index-BZVDPgzb.js` |
| POST | `/api/v3/poll/tk/live/leaveroom` | `js/index-BZVDPgzb.js` |
| POST | `/api/v3/poll/vote` | `js/index-BZVDPgzb.js` |
| POST | `/api/v3/promotion/claim` | `js/index-BZVDPgzb.js` |
| GET | `/api/v3/promotion/list` | `js/index-BZVDPgzb.js` |
| GET | `/api/v3/push/web/info` | `js/index-BZVDPgzb.js` |
| POST | `/api/v3/push/web/register` | `js/index-BZVDPgzb.js` |
| POST | `/api/v3/push/web/revoke` | `js/index-BZVDPgzb.js` |
| GET | `/api/v3/redirect/app` | `js/index-BZVDPgzb.js` |
| POST | `/api/v3/shopify/multipass` | `js/index-BZVDPgzb.js` |
| POST | `/api/v3/shopify/verify` | `js/index-BZVDPgzb.js` |
| POST | `/api/v3/socket/connect` | `js/index-BZVDPgzb.js` |
| POST | `/api/v3/socket/disconnect` | `js/index-BZVDPgzb.js` |
| POST | `/api/v3/socket/tk/connect` | `js/index-BZVDPgzb.js` |
| POST | `/api/v3/socket/tk/disconnect` | `js/index-BZVDPgzb.js` |
| GET | `/api/v3/spec` | `js/index-BZVDPgzb.js` |
| GET | `/api/v3/status` | `js/index-BZVDPgzb.js` |
| POST | `/api/v3/support` | `js/index-BZVDPgzb.js` |
| GET | `/api/v3/support/ticket/types` | `js/index-BZVDPgzb.js` |
| POST | `/api/v3/survey` | `js/index-BZVDPgzb.js` |
| GET | `/api/v3/survey/questions` | `js/index-BZVDPgzb.js` |
| GET | `/api/v3/user` | `js/index-BZVDPgzb.js` |
| GET | `/api/v3/user/achievement` | `js/index-BZVDPgzb.js` |
| POST | `/api/v3/user/achievement/badges` | `js/index-BZVDPgzb.js` |
| GET | `/api/v3/user/achievement/perks` | `js/index-BZVDPgzb.js` |
| GET | `/api/v3/user/achievement/perks/list` | `js/index-BZVDPgzb.js` |
| GET | `/api/v3/user/activity` | `js/index-BZVDPgzb.js` |
| POST | `/api/v3/user/avatar` | `js/index-BZVDPgzb.js` |
| GET | `/api/v3/user/ban/status` | `js/index-BZVDPgzb.js` |
| GET | `/api/v3/user/creator` | `js/index-BZVDPgzb.js` |
| POST | `/api/v3/user/delete` | `js/index-BZVDPgzb.js` |
| POST | `/api/v3/user/email/update` | `js/index-BZVDPgzb.js` |
| POST | `/api/v3/user/email/update/complete` | `js/index-BZVDPgzb.js` |
| GET | `/api/v3/user/info` | `js/index-BZVDPgzb.js` |
| GET | `/api/v3/user/multi` | `js/index-BZVDPgzb.js` |
| GET | `/api/v3/user/named` | `js/index-BZVDPgzb.js` |
| POST | `/api/v3/user/notification/channels` | `js/index-BZVDPgzb.js` |
| GET | `/api/v3/user/notification/channels/list` | `js/index-BZVDPgzb.js` |
| POST | `/api/v3/user/notification/digest` | `js/index-BZVDPgzb.js` |
| POST | `/api/v3/user/notification/email` | `js/index-BZVDPgzb.js` |
| GET | `/api/v3/user/notification/list` | `js/index-BZVDPgzb.js` |
| POST | `/api/v3/user/notification/update` | `js/index-BZVDPgzb.js` |
| POST | `/api/v3/user/password/change` | `js/index-BZVDPgzb.js` |
| POST | `/api/v3/user/password/reset` | `js/index-BZVDPgzb.js` |
| POST | `/api/v3/user/password/reset/request` | `js/index-BZVDPgzb.js` |
| POST | `/api/v3/user/password/reset/validate` | `js/index-BZVDPgzb.js` |
| GET | `/api/v3/user/security` | `js/index-BZVDPgzb.js` |
| POST | `/api/v3/user/security/2fa` | `js/index-BZVDPgzb.js` |
| POST | `/api/v3/user/security/2fa/activate` | `js/index-BZVDPgzb.js` |
| POST | `/api/v3/user/security/2fa/deactivate` | `js/index-BZVDPgzb.js` |
| POST | `/api/v3/user/security/backupcode` | `js/index-BZVDPgzb.js` |
| POST | `/api/v3/user/security/backupcode/activate` | `js/index-BZVDPgzb.js` |
| POST | `/api/v3/user/security/backupcode/deactivate` | `js/index-BZVDPgzb.js` |
| GET | `/api/v3/user/self` | `js/index-BZVDPgzb.js` |
| POST | `/api/v3/user/subscribed` | `js/index-BZVDPgzb.js` |
| GET | `/api/v3/user/subscriptions` | `js/index-BZVDPgzb.js` |
| POST | `/api/v3/user/undelete` | `js/index-BZVDPgzb.js` |
| POST | `/api/v3/user/update` | `js/index-BZVDPgzb.js` |
| GET | `/api/v3/user/username/available` | `js/index-BZVDPgzb.js` |
| POST | `/api/v3/webhooks/ivs/livestream` | `js/index-BZVDPgzb.js` |
| POST | `/api/v3/webhooks/livestream` | `js/index-BZVDPgzb.js` |

## Realtime

- `POST` `—` (sails_socket_post_unresolved_path) — `js/D7uD_hMz.js`
- `—` `/` (chat_socket_uri) — `js/index-BZVDPgzb.js`
- `POST` `/api/v3/socket/connect` (sails_socket_post) — `js/index-BZVDPgzb.js`
- `POST` `/api/v3/socket/disconnect` (sails_socket_post) — `js/index-BZVDPgzb.js`
- `POST` `/api/v3/socket/tk/connect` (sails_socket_post) — `js/index-BZVDPgzb.js`
- `POST` `/api/v3/socket/tk/disconnect` (sails_socket_post) — `js/index-BZVDPgzb.js`

## URL templates

- `/api/cms/v3/subscribers/download` — `js/3L4qsYBe.js`
- `/api/connect/{param}` — `js/DllpNifU.js`
- `/api/v1/components/groups` — `js/Bnzp30aR.js`
- `/api/v2/connect/discord` — `js/DWolNGfu.js`

## Warnings

- socket.post without resolvable path at js/D7uD_hMz.js:14576
- socket.post without resolvable path at js/D7uD_hMz.js:15272

## Rejected signals

- `non_floatplane_host`: `https://fairplay.twitch.keyos.com` (`js/CIWlSVcH.js`)
- `non_floatplane_host`: `https://playready.twitch.keyos.com` (`js/CIWlSVcH.js`)
- `non_floatplane_host`: `https://widevine.twitch.keyos.com` (`js/CIWlSVcH.js`)
- `non_floatplane_host`: `https://fairplay.twitch.keyos.com/api/v4/getCertificate?certHash=a17fd33d3843df9b17679ccf50a419b2` (`js/CIWlSVcH.js`)
- `non_floatplane_host`: `https://fairplay.twitch.keyos.com/api/v4/getLicense` (`js/CIWlSVcH.js`)
- `non_floatplane_host`: `https://playready.twitch.keyos.com/api/v4/getLicense` (`js/CIWlSVcH.js`)
- `non_floatplane_host`: `https://widevine.twitch.keyos.com/api/v4/getLicense` (`js/CIWlSVcH.js`)

## Disclaimer

Paths and methods above are evidenced in frontend client bundles for this observation.
Presence in the client does not confirm public availability, authorization, or server behavior.

