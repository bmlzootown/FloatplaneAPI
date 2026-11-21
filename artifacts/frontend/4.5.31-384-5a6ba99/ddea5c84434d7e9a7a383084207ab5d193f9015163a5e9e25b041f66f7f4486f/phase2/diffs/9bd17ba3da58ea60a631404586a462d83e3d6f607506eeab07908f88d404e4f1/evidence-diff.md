# Floatplane Frontend API Evidence Changes

From:
`4.5.26-355-797bc04 / 9bd17ba3da58ea60a631404586a462d83e3d6f607506eeab07908f88d404e4f1`

To:
`4.5.31-384-5a6ba99 / ddea5c84434d7e9a7a383084207ab5d193f9015163a5e9e25b041f66f7f4486f`

> **Label:** real archived Floatplane observations.

_Frontend-evidence change report only. **Not** an authoritative server API changelog._

## Extraction status

| Side | Observation | Build | Closure status | refuseRemoval | completeEnough |
| ---- | ----------- | ----- | -------------- | ------------- | -------------- |
| From | `9bd17ba3da58…` | `4.5.26-355-797bc04` | `complete_with_external_rejects` | false | true |
| To | `ddea5c84434d…` | `4.5.31-384-5a6ba99` | `complete_with_external_rejects` | false | true |

Comparison status: **complete**

### Directional gating (2.2.1)

* Addition conclusions allowed (requires FROM complete): **yes**
* Disappearance conclusions allowed (requires TO complete): **yes**
* Method-set conclusions allowed (requires both complete): **yes**

## Summary

### Atomic (primary facts)

* Structured operations added: **0**
* Structured operations disappeared from frontend evidence: **0**
* Request-construction changes: **0**
* Auth/header evidence changes: **4**
* Response mapper changes: **0**
* Realtime evidence changes: **1**
* Weaker references added: **13**; disappeared: **100**
* Frontend-only / provenance movement: **278**
* Atomic total: **396**

### Derived (grouped — do not triple-count with atomic)

* Method-set changes: **0** (derived from atomic method+path add/disappear on the same path)
* Derived total: **0**

* Authoritative emitted changes (atomic + derived): **396**
* Suppressed (indeterminate) conclusions: **0** — not in authoritative totals

## Structured operation changes (atomic + derived)

_None._

## Request behavior changes

_None._

## Authentication/header changes

* **`auth_evidence_changed`** (atomic) — Frontend authentication/header-related evidence disappeared. Not proof the server dropped an auth requirement.
  * — `/api/v2/connect/discord` · from `url_template:-:/api/v2/connect/discord:template_literal` · @ js/Dq_ZZD-Q.js
* **`auth_evidence_changed`** (atomic) — Frontend authentication/header-related evidence appeared. Phrase as frontend behavior, not a server auth requirement.
  * — `/api/v3/connect/discord` · to `url_template:-:/api/v3/connect/discord:template_literal` · @ js/DLIaBi1j.js
* **`auth_evidence_changed`** (atomic) — Frontend authentication/header-related evidence disappeared. Not proof the server dropped an auth requirement.
  * — `/api/v3/socket/connect` · from `url_template:-:/api/v3/socket/connect:template_literal` · @ js/index-Dxy9c0et.js
* **`auth_evidence_changed`** (atomic) — Frontend authentication/header-related evidence disappeared. Not proof the server dropped an auth requirement.
  * — `/api/v3/socket/tk/connect` · from `url_template:-:/api/v3/socket/tk/connect:template_literal` · @ js/index-Dxy9c0et.js

## Response mapper changes

_None._

## Realtime changes

* **`realtime_evidence_changed`** (atomic) — Realtime evidence disappeared from the frontend inventory.
  * POST `—` · from `realtime_operation:POST:-:sails_socket_post_unresolved_path` · @ js/C1rO4Kzx.js

## Weaker/ambiguous evidence

* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/acp/v3/user/profileImage` · to `url_template:-:/api/acp/v3/user/profileImage:template_literal` · @ js/CO45nlDH.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/cms/v3/blogPost/plan/apply` · to `url_template:-:/api/cms/v3/blogPost/plan/apply:template_literal` · @ js/C28j6yuy.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/socket` · to `url_template:-:/api/socket:template_literal` · @ js/eXnI0t6i.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/v3/chat/channel` · to `url_template:-:/api/v3/chat/channel:template_literal` · @ js/C28j6yuy.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/v3/chat/channel/message` · to `url_template:-:/api/v3/chat/channel/message:template_literal` · @ js/C28j6yuy.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/v3/chat/channel/user/list` · to `url_template:-:/api/v3/chat/channel/user/list:template_literal` · @ js/C28j6yuy.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/v3/connect/discord` · to `url_template:-:/api/v3/connect/discord:template_literal` · @ js/DLIaBi1j.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/v3/payment/subscription/purchase/option` · to `url_template:-:/api/v3/payment/subscription/purchase/option:template_literal` · @ js/C28j6yuy.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/v3/payment/subscription/purchase/options` · to `url_template:-:/api/v3/payment/subscription/purchase/options:template_literal` · @ js/C28j6yuy.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/v3/promotion/voucher/verify` · to `url_template:-:/api/v3/promotion/voucher/verify:template_literal` · @ js/C28j6yuy.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/v3/shopify/voucher` · to `url_template:-:/api/v3/shopify/voucher:template_literal` · @ js/C28j6yuy.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/v3/shopify/voucher/revoke` · to `url_template:-:/api/v3/shopify/voucher/revoke:template_literal` · @ js/C28j6yuy.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/v3/user/profileImage` · to `url_template:-:/api/v3/user/profileImage:template_literal` · @ js/C28j6yuy.js
* **`weak_reference_disappeared`** (atomic) — Weaker network_reference evidence disappeared from the frontend. Not a structured operation disappearance.
  * — `https://chat.floatplane.com` · from `network_reference:-:/:host:chat_socket` · @ js/aWszMqew.js
* **`weak_reference_disappeared`** (atomic) — Weaker url_template evidence disappeared from the frontend. Not a structured operation disappearance.
  * — `/api/acp/v3/achievement` · from `url_template:-:/api/acp/v3/achievement:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_disappeared`** (atomic) — Weaker url_template evidence disappeared from the frontend. Not a structured operation disappearance.
  * — `/api/acp/v3/achievement/award` · from `url_template:-:/api/acp/v3/achievement/award:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_disappeared`** (atomic) — Weaker url_template evidence disappeared from the frontend. Not a structured operation disappearance.
  * — `/api/acp/v3/achievement/create` · from `url_template:-:/api/acp/v3/achievement/create:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_disappeared`** (atomic) — Weaker url_template evidence disappeared from the frontend. Not a structured operation disappearance.
  * — `/api/acp/v3/achievement/create/multi-stage` · from `url_template:-:/api/acp/v3/achievement/create/multi-stage:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_disappeared`** (atomic) — Weaker url_template evidence disappeared from the frontend. Not a structured operation disappearance.
  * — `/api/acp/v3/achievement/delete` · from `url_template:-:/api/acp/v3/achievement/delete:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_disappeared`** (atomic) — Weaker url_template evidence disappeared from the frontend. Not a structured operation disappearance.
  * — `/api/acp/v3/achievement/list` · from `url_template:-:/api/acp/v3/achievement/list:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_disappeared`** (atomic) — Weaker url_template evidence disappeared from the frontend. Not a structured operation disappearance.
  * — `/api/acp/v3/achievement/perk` · from `url_template:-:/api/acp/v3/achievement/perk:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_disappeared`** (atomic) — Weaker url_template evidence disappeared from the frontend. Not a structured operation disappearance.
  * — `/api/acp/v3/achievement/perk/create` · from `url_template:-:/api/acp/v3/achievement/perk/create:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_disappeared`** (atomic) — Weaker url_template evidence disappeared from the frontend. Not a structured operation disappearance.
  * — `/api/acp/v3/achievement/perk/delete` · from `url_template:-:/api/acp/v3/achievement/perk/delete:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_disappeared`** (atomic) — Weaker url_template evidence disappeared from the frontend. Not a structured operation disappearance.
  * — `/api/acp/v3/achievement/perk/image/upload` · from `url_template:-:/api/acp/v3/achievement/perk/image/upload:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_disappeared`** (atomic) — Weaker url_template evidence disappeared from the frontend. Not a structured operation disappearance.
  * — `/api/acp/v3/achievement/perk/list` · from `url_template:-:/api/acp/v3/achievement/perk/list:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_disappeared`** (atomic) — Weaker url_template evidence disappeared from the frontend. Not a structured operation disappearance.
  * — `/api/acp/v3/achievement/perk/update` · from `url_template:-:/api/acp/v3/achievement/perk/update:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_disappeared`** (atomic) — Weaker url_template evidence disappeared from the frontend. Not a structured operation disappearance.
  * — `/api/acp/v3/achievement/strip` · from `url_template:-:/api/acp/v3/achievement/strip:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_disappeared`** (atomic) — Weaker url_template evidence disappeared from the frontend. Not a structured operation disappearance.
  * — `/api/acp/v3/achievement/update` · from `url_template:-:/api/acp/v3/achievement/update:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_disappeared`** (atomic) — Weaker url_template evidence disappeared from the frontend. Not a structured operation disappearance.
  * — `/api/acp/v3/agreement` · from `url_template:-:/api/acp/v3/agreement:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_disappeared`** (atomic) — Weaker url_template evidence disappeared from the frontend. Not a structured operation disappearance.
  * — `/api/acp/v3/agreement/create` · from `url_template:-:/api/acp/v3/agreement/create:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_disappeared`** (atomic) — Weaker url_template evidence disappeared from the frontend. Not a structured operation disappearance.
  * — `/api/acp/v3/agreement/list` · from `url_template:-:/api/acp/v3/agreement/list:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_disappeared`** (atomic) — Weaker url_template evidence disappeared from the frontend. Not a structured operation disappearance.
  * — `/api/acp/v3/agreement/update` · from `url_template:-:/api/acp/v3/agreement/update:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_disappeared`** (atomic) — Weaker url_template evidence disappeared from the frontend. Not a structured operation disappearance.
  * — `/api/acp/v3/blogPost` · from `url_template:-:/api/acp/v3/blogPost:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_disappeared`** (atomic) — Weaker url_template evidence disappeared from the frontend. Not a structured operation disappearance.
  * — `/api/acp/v3/blogPost/invalidateCache` · from `url_template:-:/api/acp/v3/blogPost/invalidateCache:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_disappeared`** (atomic) — Weaker url_template evidence disappeared from the frontend. Not a structured operation disappearance.
  * — `/api/acp/v3/blogPost/list` · from `url_template:-:/api/acp/v3/blogPost/list:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_disappeared`** (atomic) — Weaker url_template evidence disappeared from the frontend. Not a structured operation disappearance.
  * — `/api/acp/v3/blogPost/moveContent` · from `url_template:-:/api/acp/v3/blogPost/moveContent:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_disappeared`** (atomic) — Weaker url_template evidence disappeared from the frontend. Not a structured operation disappearance.
  * — `/api/acp/v3/blogPost/multi` · from `url_template:-:/api/acp/v3/blogPost/multi:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_disappeared`** (atomic) — Weaker url_template evidence disappeared from the frontend. Not a structured operation disappearance.
  * — `/api/acp/v3/channel` · from `url_template:-:/api/acp/v3/channel:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_disappeared`** (atomic) — Weaker url_template evidence disappeared from the frontend. Not a structured operation disappearance.
  * — `/api/acp/v3/channel/list` · from `url_template:-:/api/acp/v3/channel/list:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_disappeared`** (atomic) — Weaker url_template evidence disappeared from the frontend. Not a structured operation disappearance.
  * — `/api/acp/v3/channel/multi` · from `url_template:-:/api/acp/v3/channel/multi:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_disappeared`** (atomic) — Weaker url_template evidence disappeared from the frontend. Not a structured operation disappearance.
  * — `/api/acp/v3/chat/channel/list` · from `url_template:-:/api/acp/v3/chat/channel/list:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_disappeared`** (atomic) — Weaker url_template evidence disappeared from the frontend. Not a structured operation disappearance.
  * — `/api/acp/v3/chat/list` · from `url_template:-:/api/acp/v3/chat/list:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_disappeared`** (atomic) — Weaker url_template evidence disappeared from the frontend. Not a structured operation disappearance.
  * — `/api/acp/v3/content` · from `url_template:-:/api/acp/v3/content:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_disappeared`** (atomic) — Weaker url_template evidence disappeared from the frontend. Not a structured operation disappearance.
  * — `/api/acp/v3/content/invalidateCache` · from `url_template:-:/api/acp/v3/content/invalidateCache:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_disappeared`** (atomic) — Weaker url_template evidence disappeared from the frontend. Not a structured operation disappearance.
  * — `/api/acp/v3/content/list` · from `url_template:-:/api/acp/v3/content/list:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_disappeared`** (atomic) — Weaker url_template evidence disappeared from the frontend. Not a structured operation disappearance.
  * — `/api/acp/v3/content/multi` · from `url_template:-:/api/acp/v3/content/multi:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_disappeared`** (atomic) — Weaker url_template evidence disappeared from the frontend. Not a structured operation disappearance.
  * — `/api/acp/v3/creator` · from `url_template:-:/api/acp/v3/creator:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_disappeared`** (atomic) — Weaker url_template evidence disappeared from the frontend. Not a structured operation disappearance.
  * — `/api/acp/v3/creator/category` · from `url_template:-:/api/acp/v3/creator/category:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_disappeared`** (atomic) — Weaker url_template evidence disappeared from the frontend. Not a structured operation disappearance.
  * — `/api/acp/v3/creator/category/create` · from `url_template:-:/api/acp/v3/creator/category/create:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_disappeared`** (atomic) — Weaker url_template evidence disappeared from the frontend. Not a structured operation disappearance.
  * — `/api/acp/v3/creator/category/delete` · from `url_template:-:/api/acp/v3/creator/category/delete:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_disappeared`** (atomic) — Weaker url_template evidence disappeared from the frontend. Not a structured operation disappearance.
  * — `/api/acp/v3/creator/category/list` · from `url_template:-:/api/acp/v3/creator/category/list:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_disappeared`** (atomic) — Weaker url_template evidence disappeared from the frontend. Not a structured operation disappearance.
  * — `/api/acp/v3/creator/category/update` · from `url_template:-:/api/acp/v3/creator/category/update:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_disappeared`** (atomic) — Weaker url_template evidence disappeared from the frontend. Not a structured operation disappearance.
  * — `/api/acp/v3/creator/create` · from `url_template:-:/api/acp/v3/creator/create:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_disappeared`** (atomic) — Weaker url_template evidence disappeared from the frontend. Not a structured operation disappearance.
  * — `/api/acp/v3/creator/invalidateCache` · from `url_template:-:/api/acp/v3/creator/invalidateCache:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_disappeared`** (atomic) — Weaker url_template evidence disappeared from the frontend. Not a structured operation disappearance.
  * — `/api/acp/v3/creator/invite/create` · from `url_template:-:/api/acp/v3/creator/invite/create:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_disappeared`** (atomic) — Weaker url_template evidence disappeared from the frontend. Not a structured operation disappearance.
  * — `/api/acp/v3/creator/invite/list` · from `url_template:-:/api/acp/v3/creator/invite/list:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_disappeared`** (atomic) — Weaker url_template evidence disappeared from the frontend. Not a structured operation disappearance.
  * — `/api/acp/v3/creator/invite/update` · from `url_template:-:/api/acp/v3/creator/invite/update:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_disappeared`** (atomic) — Weaker url_template evidence disappeared from the frontend. Not a structured operation disappearance.
  * — `/api/acp/v3/creator/list` · from `url_template:-:/api/acp/v3/creator/list:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_disappeared`** (atomic) — Weaker url_template evidence disappeared from the frontend. Not a structured operation disappearance.
  * — `/api/acp/v3/creator/multi` · from `url_template:-:/api/acp/v3/creator/multi:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_disappeared`** (atomic) — Weaker url_template evidence disappeared from the frontend. Not a structured operation disappearance.
  * — `/api/acp/v3/creator/update` · from `url_template:-:/api/acp/v3/creator/update:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_disappeared`** (atomic) — Weaker url_template evidence disappeared from the frontend. Not a structured operation disappearance.
  * — `/api/acp/v3/creator/urlname/availability` · from `url_template:-:/api/acp/v3/creator/urlname/availability:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_disappeared`** (atomic) — Weaker url_template evidence disappeared from the frontend. Not a structured operation disappearance.
  * — `/api/acp/v3/faq` · from `url_template:-:/api/acp/v3/faq:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_disappeared`** (atomic) — Weaker url_template evidence disappeared from the frontend. Not a structured operation disappearance.
  * — `/api/acp/v3/faq/list` · from `url_template:-:/api/acp/v3/faq/list:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_disappeared`** (atomic) — Weaker url_template evidence disappeared from the frontend. Not a structured operation disappearance.
  * — `/api/acp/v3/ingest` · from `url_template:-:/api/acp/v3/ingest:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_disappeared`** (atomic) — Weaker url_template evidence disappeared from the frontend. Not a structured operation disappearance.
  * — `/api/acp/v3/ingest/delete` · from `url_template:-:/api/acp/v3/ingest/delete:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_disappeared`** (atomic) — Weaker url_template evidence disappeared from the frontend. Not a structured operation disappearance.
  * — `/api/acp/v3/ingest/list` · from `url_template:-:/api/acp/v3/ingest/list:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_disappeared`** (atomic) — Weaker url_template evidence disappeared from the frontend. Not a structured operation disappearance.
  * — `/api/acp/v3/ingest/multi` · from `url_template:-:/api/acp/v3/ingest/multi:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_disappeared`** (atomic) — Weaker url_template evidence disappeared from the frontend. Not a structured operation disappearance.
  * — `/api/acp/v3/ingest/start` · from `url_template:-:/api/acp/v3/ingest/start:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_disappeared`** (atomic) — Weaker url_template evidence disappeared from the frontend. Not a structured operation disappearance.
  * — `/api/acp/v3/ingest/stop` · from `url_template:-:/api/acp/v3/ingest/stop:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_disappeared`** (atomic) — Weaker url_template evidence disappeared from the frontend. Not a structured operation disappearance.
  * — `/api/acp/v3/ingest/update` · from `url_template:-:/api/acp/v3/ingest/update:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_disappeared`** (atomic) — Weaker url_template evidence disappeared from the frontend. Not a structured operation disappearance.
  * — `/api/acp/v3/job/start` · from `url_template:-:/api/acp/v3/job/start:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_disappeared`** (atomic) — Weaker url_template evidence disappeared from the frontend. Not a structured operation disappearance.
  * — `/api/acp/v3/job/status` · from `url_template:-:/api/acp/v3/job/status:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_disappeared`** (atomic) — Weaker url_template evidence disappeared from the frontend. Not a structured operation disappearance.
  * — `/api/acp/v3/job/stop` · from `url_template:-:/api/acp/v3/job/stop:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_disappeared`** (atomic) — Weaker url_template evidence disappeared from the frontend. Not a structured operation disappearance.
  * — `/api/acp/v3/plan` · from `url_template:-:/api/acp/v3/plan:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_disappeared`** (atomic) — Weaker url_template evidence disappeared from the frontend. Not a structured operation disappearance.
  * — `/api/acp/v3/plan/cost` · from `url_template:-:/api/acp/v3/plan/cost:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_disappeared`** (atomic) — Weaker url_template evidence disappeared from the frontend. Not a structured operation disappearance.
  * — `/api/acp/v3/plan/create` · from `url_template:-:/api/acp/v3/plan/create:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_disappeared`** (atomic) — Weaker url_template evidence disappeared from the frontend. Not a structured operation disappearance.
  * — `/api/acp/v3/plan/delete` · from `url_template:-:/api/acp/v3/plan/delete:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_disappeared`** (atomic) — Weaker url_template evidence disappeared from the frontend. Not a structured operation disappearance.
  * — `/api/acp/v3/plan/list` · from `url_template:-:/api/acp/v3/plan/list:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_disappeared`** (atomic) — Weaker url_template evidence disappeared from the frontend. Not a structured operation disappearance.
  * — `/api/acp/v3/plan/multi` · from `url_template:-:/api/acp/v3/plan/multi:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_disappeared`** (atomic) — Weaker url_template evidence disappeared from the frontend. Not a structured operation disappearance.
  * — `/api/acp/v3/plan/update` · from `url_template:-:/api/acp/v3/plan/update:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_disappeared`** (atomic) — Weaker url_template evidence disappeared from the frontend. Not a structured operation disappearance.
  * — `/api/acp/v3/promotion` · from `url_template:-:/api/acp/v3/promotion:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_disappeared`** (atomic) — Weaker url_template evidence disappeared from the frontend. Not a structured operation disappearance.
  * — `/api/acp/v3/promotion/delete` · from `url_template:-:/api/acp/v3/promotion/delete:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_disappeared`** (atomic) — Weaker url_template evidence disappeared from the frontend. Not a structured operation disappearance.
  * — `/api/acp/v3/promotion/list` · from `url_template:-:/api/acp/v3/promotion/list:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_disappeared`** (atomic) — Weaker url_template evidence disappeared from the frontend. Not a structured operation disappearance.
  * — `/api/acp/v3/promotion/multi` · from `url_template:-:/api/acp/v3/promotion/multi:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_disappeared`** (atomic) — Weaker url_template evidence disappeared from the frontend. Not a structured operation disappearance.
  * — `/api/acp/v3/promotion/types` · from `url_template:-:/api/acp/v3/promotion/types:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_disappeared`** (atomic) — Weaker url_template evidence disappeared from the frontend. Not a structured operation disappearance.
  * — `/api/acp/v3/promotion/unclaim` · from `url_template:-:/api/acp/v3/promotion/unclaim:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_disappeared`** (atomic) — Weaker url_template evidence disappeared from the frontend. Not a structured operation disappearance.
  * — `/api/acp/v3/promotion/update` · from `url_template:-:/api/acp/v3/promotion/update:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_disappeared`** (atomic) — Weaker url_template evidence disappeared from the frontend. Not a structured operation disappearance.
  * — `/api/acp/v3/service-message` · from `url_template:-:/api/acp/v3/service-message:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_disappeared`** (atomic) — Weaker url_template evidence disappeared from the frontend. Not a structured operation disappearance.
  * — `/api/acp/v3/service-message/create` · from `url_template:-:/api/acp/v3/service-message/create:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_disappeared`** (atomic) — Weaker url_template evidence disappeared from the frontend. Not a structured operation disappearance.
  * — `/api/acp/v3/service-message/delete` · from `url_template:-:/api/acp/v3/service-message/delete:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_disappeared`** (atomic) — Weaker url_template evidence disappeared from the frontend. Not a structured operation disappearance.
  * — `/api/acp/v3/service-message/list` · from `url_template:-:/api/acp/v3/service-message/list:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_disappeared`** (atomic) — Weaker url_template evidence disappeared from the frontend. Not a structured operation disappearance.
  * — `/api/acp/v3/service-message/update` · from `url_template:-:/api/acp/v3/service-message/update:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_disappeared`** (atomic) — Weaker url_template evidence disappeared from the frontend. Not a structured operation disappearance.
  * — `/api/acp/v3/transcode/start` · from `url_template:-:/api/acp/v3/transcode/start:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_disappeared`** (atomic) — Weaker url_template evidence disappeared from the frontend. Not a structured operation disappearance.
  * — `/api/acp/v3/transcode/update` · from `url_template:-:/api/acp/v3/transcode/update:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_disappeared`** (atomic) — Weaker url_template evidence disappeared from the frontend. Not a structured operation disappearance.
  * — `/api/acp/v3/upload` · from `url_template:-:/api/acp/v3/upload:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_disappeared`** (atomic) — Weaker url_template evidence disappeared from the frontend. Not a structured operation disappearance.
  * — `/api/acp/v3/upload/delete` · from `url_template:-:/api/acp/v3/upload/delete:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_disappeared`** (atomic) — Weaker url_template evidence disappeared from the frontend. Not a structured operation disappearance.
  * — `/api/acp/v3/upload/list` · from `url_template:-:/api/acp/v3/upload/list:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_disappeared`** (atomic) — Weaker url_template evidence disappeared from the frontend. Not a structured operation disappearance.
  * — `/api/acp/v3/user/achievement` · from `url_template:-:/api/acp/v3/user/achievement:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_disappeared`** (atomic) — Weaker url_template evidence disappeared from the frontend. Not a structured operation disappearance.
  * — `/api/cms/v3/chat/list` · from `url_template:-:/api/cms/v3/chat/list:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_disappeared`** (atomic) — Weaker url_template evidence disappeared from the frontend. Not a structured operation disappearance.
  * — `/api/cms/v3/processing/active` · from `url_template:-:/api/cms/v3/processing/active:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_disappeared`** (atomic) — Weaker url_template evidence disappeared from the frontend. Not a structured operation disappearance.
  * — `/api/cms/v3/transcode/subscribe` · from `url_template:-:/api/cms/v3/transcode/subscribe:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_disappeared`** (atomic) — Weaker url_template evidence disappeared from the frontend. Not a structured operation disappearance.
  * — `/api/cms/v3/transcode/unsubscribe` · from `url_template:-:/api/cms/v3/transcode/unsubscribe:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_disappeared`** (atomic) — Weaker url_template evidence disappeared from the frontend. Not a structured operation disappearance.
  * — `/api/v2/connect/discord` · from `url_template:-:/api/v2/connect/discord:template_literal` · @ js/Dq_ZZD-Q.js
* **`weak_reference_disappeared`** (atomic) — Weaker url_template evidence disappeared from the frontend. Not a structured operation disappearance.
  * — `/api/v3/live/info` · from `url_template:-:/api/v3/live/info:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_disappeared`** (atomic) — Weaker url_template evidence disappeared from the frontend. Not a structured operation disappearance.
  * — `/api/v3/redirect-yt-latest/{channelKey}` · from `url_template:-:/api/v3/redirect-yt-latest/{channelKey}:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_disappeared`** (atomic) — Weaker url_template evidence disappeared from the frontend. Not a structured operation disappearance.
  * — `/api/v3/redirect/app` · from `url_template:-:/api/v3/redirect/app:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_disappeared`** (atomic) — Weaker url_template evidence disappeared from the frontend. Not a structured operation disappearance.
  * — `/api/v3/socket/connect` · from `url_template:-:/api/v3/socket/connect:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_disappeared`** (atomic) — Weaker url_template evidence disappeared from the frontend. Not a structured operation disappearance.
  * — `/api/v3/socket/disconnect` · from `url_template:-:/api/v3/socket/disconnect:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_disappeared`** (atomic) — Weaker url_template evidence disappeared from the frontend. Not a structured operation disappearance.
  * — `/api/v3/socket/tk/connect` · from `url_template:-:/api/v3/socket/tk/connect:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_disappeared`** (atomic) — Weaker url_template evidence disappeared from the frontend. Not a structured operation disappearance.
  * — `/api/v3/socket/tk/disconnect` · from `url_template:-:/api/v3/socket/tk/disconnect:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_disappeared`** (atomic) — Weaker url_template evidence disappeared from the frontend. Not a structured operation disappearance.
  * — `/api/v3/spec` · from `url_template:-:/api/v3/spec:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_disappeared`** (atomic) — Weaker url_template evidence disappeared from the frontend. Not a structured operation disappearance.
  * — `/api/v3/webhooks/ivs/livestream` · from `url_template:-:/api/v3/webhooks/ivs/livestream:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_disappeared`** (atomic) — Weaker url_template evidence disappeared from the frontend. Not a structured operation disappearance.
  * — `/api/v3/webhooks/livestream` · from `url_template:-:/api/v3/webhooks/livestream:template_literal` · @ js/index-Dxy9c0et.js

## Frontend-only movement

* **`provenance_moved`** (atomic) — Semantic evidence identity unchanged; source artifact/provenance moved. Informational / frontend-only — not an API change.
  * — `https://apm.floatplane.com` · from `network_reference:-:/:host:apm` · to `network_reference:-:/:host:apm` · @ js/Dz3hTNnP.js
* **`provenance_moved`** (atomic) — Semantic evidence identity unchanged; source artifact/provenance moved. Informational / frontend-only — not an API change.
  * — `https://auth.floatplane.com` · from `network_reference:-:/:host:auth` · to `network_reference:-:/:host:auth` · @ js/C28j6yuy.js
* **`provenance_moved`** (atomic) — Semantic evidence identity unchanged; source artifact/provenance moved. Informational / frontend-only — not an API change.
  * — `https://frontend.floatplane.com` · from `network_reference:-:/:host:frontend_cdn` · to `network_reference:-:/:host:frontend_cdn` · @ js/B2rQdpxZ.js
* **`provenance_moved`** (atomic) — Semantic evidence identity unchanged; source artifact/provenance moved. Informational / frontend-only — not an API change.
  * — `https://status.floatplane.com` · from `network_reference:-:/:host:status` · to `network_reference:-:/:host:status` · @ js/Dz3hTNnP.js
* **`provenance_moved`** (atomic) — Semantic evidence identity unchanged; source artifact/provenance moved. Informational / frontend-only — not an API change.
  * — `/api/acp/v3/invoice/mark-refunded` · from `url_template:-:/api/acp/v3/invoice/mark-refunded:template_literal` · to `url_template:-:/api/acp/v3/invoice/mark-refunded:template_literal` · @ js/CO45nlDH.js
* **`provenance_moved`** (atomic) — Semantic evidence identity unchanged; source artifact/provenance moved. Informational / frontend-only — not an API change.
  * — `/api/acp/v3/invoice/user/list` · from `url_template:-:/api/acp/v3/invoice/user/list:template_literal` · to `url_template:-:/api/acp/v3/invoice/user/list:template_literal` · @ js/CO45nlDH.js
* **`provenance_moved`** (atomic) — Semantic evidence identity unchanged; source artifact/provenance moved. Informational / frontend-only — not an API change.
  * — `/api/acp/v3/invoice/user/processor` · from `url_template:-:/api/acp/v3/invoice/user/processor:template_literal` · to `url_template:-:/api/acp/v3/invoice/user/processor:template_literal` · @ js/CO45nlDH.js
* **`provenance_moved`** (atomic) — Semantic evidence identity unchanged; source artifact/provenance moved. Informational / frontend-only — not an API change.
  * — `/api/acp/v3/moderator/create` · from `url_template:-:/api/acp/v3/moderator/create:template_literal` · to `url_template:-:/api/acp/v3/moderator/create:template_literal` · @ js/CO45nlDH.js
* **`provenance_moved`** (atomic) — Semantic evidence identity unchanged; source artifact/provenance moved. Informational / frontend-only — not an API change.
  * — `/api/acp/v3/moderator/creator/add` · from `url_template:-:/api/acp/v3/moderator/creator/add:template_literal` · to `url_template:-:/api/acp/v3/moderator/creator/add:template_literal` · @ js/CO45nlDH.js
* **`provenance_moved`** (atomic) — Semantic evidence identity unchanged; source artifact/provenance moved. Informational / frontend-only — not an API change.
  * — `/api/acp/v3/moderator/creator/available` · from `url_template:-:/api/acp/v3/moderator/creator/available:template_literal` · to `url_template:-:/api/acp/v3/moderator/creator/available:template_literal` · @ js/CO45nlDH.js
* **`provenance_moved`** (atomic) — Semantic evidence identity unchanged; source artifact/provenance moved. Informational / frontend-only — not an API change.
  * — `/api/acp/v3/moderator/creator/remove` · from `url_template:-:/api/acp/v3/moderator/creator/remove:template_literal` · to `url_template:-:/api/acp/v3/moderator/creator/remove:template_literal` · @ js/CO45nlDH.js
* **`provenance_moved`** (atomic) — Semantic evidence identity unchanged; source artifact/provenance moved. Informational / frontend-only — not an API change.
  * — `/api/acp/v3/moderator/list` · from `url_template:-:/api/acp/v3/moderator/list:template_literal` · to `url_template:-:/api/acp/v3/moderator/list:template_literal` · @ js/CO45nlDH.js
* **`provenance_moved`** (atomic) — Semantic evidence identity unchanged; source artifact/provenance moved. Informational / frontend-only — not an API change.
  * — `/api/acp/v3/moderator/update/global` · from `url_template:-:/api/acp/v3/moderator/update/global:template_literal` · to `url_template:-:/api/acp/v3/moderator/update/global:template_literal` · @ js/CO45nlDH.js
* **`provenance_moved`** (atomic) — Semantic evidence identity unchanged; source artifact/provenance moved. Informational / frontend-only — not an API change.
  * — `/api/acp/v3/survey/report` · from `url_template:-:/api/acp/v3/survey/report:template_literal` · to `url_template:-:/api/acp/v3/survey/report:template_literal` · @ js/C28j6yuy.js
* **`provenance_moved`** (atomic) — Semantic evidence identity unchanged; source artifact/provenance moved. Informational / frontend-only — not an API change.
  * — `/api/acp/v3/user` · from `url_template:-:/api/acp/v3/user:template_literal` · to `url_template:-:/api/acp/v3/user:template_literal` · @ js/CO45nlDH.js
* **`provenance_moved`** (atomic) — Semantic evidence identity unchanged; source artifact/provenance moved. Informational / frontend-only — not an API change.
  * — `/api/acp/v3/user/administrator/update` · from `url_template:-:/api/acp/v3/user/administrator/update:template_literal` · to `url_template:-:/api/acp/v3/user/administrator/update:template_literal` · @ js/CO45nlDH.js
* **`provenance_moved`** (atomic) — Semantic evidence identity unchanged; source artifact/provenance moved. Informational / frontend-only — not an API change.
  * — `/api/acp/v3/user/avatar/upload` · from `url_template:-:/api/acp/v3/user/avatar/upload:template_literal` · to `url_template:-:/api/acp/v3/user/avatar/upload:template_literal` · @ js/CO45nlDH.js
* **`provenance_moved`** (atomic) — Semantic evidence identity unchanged; source artifact/provenance moved. Informational / frontend-only — not an API change.
  * — `/api/acp/v3/user/comment/list` · from `url_template:-:/api/acp/v3/user/comment/list:template_literal` · to `url_template:-:/api/acp/v3/user/comment/list:template_literal` · @ js/CO45nlDH.js
* **`provenance_moved`** (atomic) — Semantic evidence identity unchanged; source artifact/provenance moved. Informational / frontend-only — not an API change.
  * — `/api/acp/v3/user/create` · from `url_template:-:/api/acp/v3/user/create:template_literal` · to `url_template:-:/api/acp/v3/user/create:template_literal` · @ js/CO45nlDH.js
* **`provenance_moved`** (atomic) — Semantic evidence identity unchanged; source artifact/provenance moved. Informational / frontend-only — not an API change.
  * — `/api/acp/v3/user/delete` · from `url_template:-:/api/acp/v3/user/delete:template_literal` · to `url_template:-:/api/acp/v3/user/delete:template_literal` · @ js/CO45nlDH.js
* **`provenance_moved`** (atomic) — Semantic evidence identity unchanged; source artifact/provenance moved. Informational / frontend-only — not an API change.
  * — `/api/acp/v3/user/email/availability` · from `url_template:-:/api/acp/v3/user/email/availability:template_literal` · to `url_template:-:/api/acp/v3/user/email/availability:template_literal` · @ js/CO45nlDH.js
* **`provenance_moved`** (atomic) — Semantic evidence identity unchanged; source artifact/provenance moved. Informational / frontend-only — not an API change.
  * — `/api/acp/v3/user/export` · from `url_template:-:/api/acp/v3/user/export:template_literal` · to `url_template:-:/api/acp/v3/user/export:template_literal` · @ js/CO45nlDH.js
* **`provenance_moved`** (atomic) — Semantic evidence identity unchanged; source artifact/provenance moved. Informational / frontend-only — not an API change.
  * — `/api/acp/v3/user/list` · from `url_template:-:/api/acp/v3/user/list:template_literal` · to `url_template:-:/api/acp/v3/user/list:template_literal` · @ js/CO45nlDH.js
* **`provenance_moved`** (atomic) — Semantic evidence identity unchanged; source artifact/provenance moved. Informational / frontend-only — not an API change.
  * — `/api/acp/v3/user/password/reset/request` · from `url_template:-:/api/acp/v3/user/password/reset/request:template_literal` · to `url_template:-:/api/acp/v3/user/password/reset/request:template_literal` · @ js/CO45nlDH.js
* **`provenance_moved`** (atomic) — Semantic evidence identity unchanged; source artifact/provenance moved. Informational / frontend-only — not an API change.
  * — `/api/acp/v3/user/subscription/create` · from `url_template:-:/api/acp/v3/user/subscription/create:template_literal` · to `url_template:-:/api/acp/v3/user/subscription/create:template_literal` · @ js/CO45nlDH.js
* **`provenance_moved`** (atomic) — Semantic evidence identity unchanged; source artifact/provenance moved. Informational / frontend-only — not an API change.
  * — `/api/acp/v3/user/subscription/delete` · from `url_template:-:/api/acp/v3/user/subscription/delete:template_literal` · to `url_template:-:/api/acp/v3/user/subscription/delete:template_literal` · @ js/CO45nlDH.js
* **`provenance_moved`** (atomic) — Semantic evidence identity unchanged; source artifact/provenance moved. Informational / frontend-only — not an API change.
  * — `/api/acp/v3/user/undelete` · from `url_template:-:/api/acp/v3/user/undelete:template_literal` · to `url_template:-:/api/acp/v3/user/undelete:template_literal` · @ js/CO45nlDH.js
* **`provenance_moved`** (atomic) — Semantic evidence identity unchanged; source artifact/provenance moved. Informational / frontend-only — not an API change.
  * — `/api/acp/v3/user/update` · from `url_template:-:/api/acp/v3/user/update:template_literal` · to `url_template:-:/api/acp/v3/user/update:template_literal` · @ js/CO45nlDH.js
* **`provenance_moved`** (atomic) — Semantic evidence identity unchanged; source artifact/provenance moved. Informational / frontend-only — not an API change.
  * — `/api/acp/v3/user/username/availability` · from `url_template:-:/api/acp/v3/user/username/availability:template_literal` · to `url_template:-:/api/acp/v3/user/username/availability:template_literal` · @ js/CO45nlDH.js
* **`provenance_moved`** (atomic) — Semantic evidence identity unchanged; source artifact/provenance moved. Informational / frontend-only — not an API change.
  * — `/api/authxml` · from `url_template:-:/api/authxml:template_literal` · to `url_template:-:/api/authxml:template_literal` · @ js/C-RNOVUC.js
* **`provenance_moved`** (atomic) — Semantic evidence identity unchanged; source artifact/provenance moved. Informational / frontend-only — not an API change.
  * — `/api/badges/download-on-the-app-store/black/en-us` · from `url_template:-:/api/badges/download-on-the-app-store/black/en-us:template_literal` · to `url_template:-:/api/badges/download-on-the-app-store/black/en-us:template_literal` · @ js/XvMK4PfN.js
* **`provenance_moved`** (atomic) — Semantic evidence identity unchanged; source artifact/provenance moved. Informational / frontend-only — not an API change.
  * — `/api/cms/v3/achievement` · from `url_template:-:/api/cms/v3/achievement:template_literal` · to `url_template:-:/api/cms/v3/achievement:template_literal` · @ js/C28j6yuy.js
* **`provenance_moved`** (atomic) — Semantic evidence identity unchanged; source artifact/provenance moved. Informational / frontend-only — not an API change.
  * — `/api/cms/v3/achievement/award` · from `url_template:-:/api/cms/v3/achievement/award:template_literal` · to `url_template:-:/api/cms/v3/achievement/award:template_literal` · @ js/C28j6yuy.js
* **`provenance_moved`** (atomic) — Semantic evidence identity unchanged; source artifact/provenance moved. Informational / frontend-only — not an API change.
  * — `/api/cms/v3/achievement/create` · from `url_template:-:/api/cms/v3/achievement/create:template_literal` · to `url_template:-:/api/cms/v3/achievement/create:template_literal` · @ js/C28j6yuy.js
* **`provenance_moved`** (atomic) — Semantic evidence identity unchanged; source artifact/provenance moved. Informational / frontend-only — not an API change.
  * — `/api/cms/v3/achievement/create/progressive` · from `url_template:-:/api/cms/v3/achievement/create/progressive:template_literal` · to `url_template:-:/api/cms/v3/achievement/create/progressive:template_literal` · @ js/C28j6yuy.js
* **`provenance_moved`** (atomic) — Semantic evidence identity unchanged; source artifact/provenance moved. Informational / frontend-only — not an API change.
  * — `/api/cms/v3/achievement/delete` · from `url_template:-:/api/cms/v3/achievement/delete:template_literal` · to `url_template:-:/api/cms/v3/achievement/delete:template_literal` · @ js/C28j6yuy.js
* **`provenance_moved`** (atomic) — Semantic evidence identity unchanged; source artifact/provenance moved. Informational / frontend-only — not an API change.
  * — `/api/cms/v3/achievement/list` · from `url_template:-:/api/cms/v3/achievement/list:template_literal` · to `url_template:-:/api/cms/v3/achievement/list:template_literal` · @ js/C28j6yuy.js
* **`provenance_moved`** (atomic) — Semantic evidence identity unchanged; source artifact/provenance moved. Informational / frontend-only — not an API change.
  * — `/api/cms/v3/achievement/perk` · from `url_template:-:/api/cms/v3/achievement/perk:template_literal` · to `url_template:-:/api/cms/v3/achievement/perk:template_literal` · @ js/C28j6yuy.js
* **`provenance_moved`** (atomic) — Semantic evidence identity unchanged; source artifact/provenance moved. Informational / frontend-only — not an API change.
  * — `/api/cms/v3/achievement/perk/create` · from `url_template:-:/api/cms/v3/achievement/perk/create:template_literal` · to `url_template:-:/api/cms/v3/achievement/perk/create:template_literal` · @ js/C28j6yuy.js
* **`provenance_moved`** (atomic) — Semantic evidence identity unchanged; source artifact/provenance moved. Informational / frontend-only — not an API change.
  * — `/api/cms/v3/achievement/perk/delete` · from `url_template:-:/api/cms/v3/achievement/perk/delete:template_literal` · to `url_template:-:/api/cms/v3/achievement/perk/delete:template_literal` · @ js/C28j6yuy.js
* **`provenance_moved`** (atomic) — Semantic evidence identity unchanged; source artifact/provenance moved. Informational / frontend-only — not an API change.
  * — `/api/cms/v3/achievement/perk/image/upload` · from `url_template:-:/api/cms/v3/achievement/perk/image/upload:template_literal` · to `url_template:-:/api/cms/v3/achievement/perk/image/upload:template_literal` · @ js/C28j6yuy.js
* **`provenance_moved`** (atomic) — Semantic evidence identity unchanged; source artifact/provenance moved. Informational / frontend-only — not an API change.
  * — `/api/cms/v3/achievement/perk/list` · from `url_template:-:/api/cms/v3/achievement/perk/list:template_literal` · to `url_template:-:/api/cms/v3/achievement/perk/list:template_literal` · @ js/C28j6yuy.js
* **`provenance_moved`** (atomic) — Semantic evidence identity unchanged; source artifact/provenance moved. Informational / frontend-only — not an API change.
  * — `/api/cms/v3/achievement/perk/update` · from `url_template:-:/api/cms/v3/achievement/perk/update:template_literal` · to `url_template:-:/api/cms/v3/achievement/perk/update:template_literal` · @ js/C28j6yuy.js
* **`provenance_moved`** (atomic) — Semantic evidence identity unchanged; source artifact/provenance moved. Informational / frontend-only — not an API change.
  * — `/api/cms/v3/achievement/strip` · from `url_template:-:/api/cms/v3/achievement/strip:template_literal` · to `url_template:-:/api/cms/v3/achievement/strip:template_literal` · @ js/C28j6yuy.js
* **`provenance_moved`** (atomic) — Semantic evidence identity unchanged; source artifact/provenance moved. Informational / frontend-only — not an API change.
  * — `/api/cms/v3/achievement/update` · from `url_template:-:/api/cms/v3/achievement/update:template_literal` · to `url_template:-:/api/cms/v3/achievement/update:template_literal` · @ js/C28j6yuy.js
* **`provenance_moved`** (atomic) — Semantic evidence identity unchanged; source artifact/provenance moved. Informational / frontend-only — not an API change.
  * — `/api/cms/v3/blogPost` · from `url_template:-:/api/cms/v3/blogPost:template_literal` · to `url_template:-:/api/cms/v3/blogPost:template_literal` · @ js/C28j6yuy.js
* **`provenance_moved`** (atomic) — Semantic evidence identity unchanged; source artifact/provenance moved. Informational / frontend-only — not an API change.
  * — `/api/cms/v3/blogPost/create` · from `url_template:-:/api/cms/v3/blogPost/create:template_literal` · to `url_template:-:/api/cms/v3/blogPost/create:template_literal` · @ js/C28j6yuy.js
* **`provenance_moved`** (atomic) — Semantic evidence identity unchanged; source artifact/provenance moved. Informational / frontend-only — not an API change.
  * — `/api/cms/v3/blogPost/delete` · from `url_template:-:/api/cms/v3/blogPost/delete:template_literal` · to `url_template:-:/api/cms/v3/blogPost/delete:template_literal` · @ js/C28j6yuy.js
* **`provenance_moved`** (atomic) — Semantic evidence identity unchanged; source artifact/provenance moved. Informational / frontend-only — not an API change.
  * — `/api/cms/v3/blogPost/edit` · from `url_template:-:/api/cms/v3/blogPost/edit:template_literal` · to `url_template:-:/api/cms/v3/blogPost/edit:template_literal` · @ js/C28j6yuy.js
* **`provenance_moved`** (atomic) — Semantic evidence identity unchanged; source artifact/provenance moved. Informational / frontend-only — not an API change.
  * — `/api/cms/v3/blogPost/edit/bulk` · from `url_template:-:/api/cms/v3/blogPost/edit/bulk:template_literal` · to `url_template:-:/api/cms/v3/blogPost/edit/bulk:template_literal` · @ js/C28j6yuy.js
* **`provenance_moved`** (atomic) — Semantic evidence identity unchanged; source artifact/provenance moved. Informational / frontend-only — not an API change.
  * — `/api/cms/v3/blogPost/get` · from `url_template:-:/api/cms/v3/blogPost/get:template_literal` · to `url_template:-:/api/cms/v3/blogPost/get:template_literal` · @ js/C28j6yuy.js
* **`provenance_moved`** (atomic) — Semantic evidence identity unchanged; source artifact/provenance moved. Informational / frontend-only — not an API change.
  * — `/api/cms/v3/blogPost/list` · from `url_template:-:/api/cms/v3/blogPost/list:template_literal` · to `url_template:-:/api/cms/v3/blogPost/list:template_literal` · @ js/C28j6yuy.js
* **`provenance_moved`** (atomic) — Semantic evidence identity unchanged; source artifact/provenance moved. Informational / frontend-only — not an API change.
  * — `/api/cms/v3/blogPost/multi` · from `url_template:-:/api/cms/v3/blogPost/multi:template_literal` · to `url_template:-:/api/cms/v3/blogPost/multi:template_literal` · @ js/C28j6yuy.js
* **`provenance_moved`** (atomic) — Semantic evidence identity unchanged; source artifact/provenance moved. Informational / frontend-only — not an API change.
  * — `/api/cms/v3/comment/list` · from `url_template:-:/api/cms/v3/comment/list:template_literal` · to `url_template:-:/api/cms/v3/comment/list:template_literal` · @ js/C28j6yuy.js
* **`provenance_moved`** (atomic) — Semantic evidence identity unchanged; source artifact/provenance moved. Informational / frontend-only — not an API change.
  * — `/api/cms/v3/content` · from `url_template:-:/api/cms/v3/content:template_literal` · to `url_template:-:/api/cms/v3/content:template_literal` · @ js/C28j6yuy.js
* **`provenance_moved`** (atomic) — Semantic evidence identity unchanged; source artifact/provenance moved. Informational / frontend-only — not an API change.
  * — `/api/cms/v3/content/audio` · from `url_template:-:/api/cms/v3/content/audio:template_literal` · to `url_template:-:/api/cms/v3/content/audio:template_literal` · @ js/C28j6yuy.js
* **`provenance_moved`** (atomic) — Semantic evidence identity unchanged; source artifact/provenance moved. Informational / frontend-only — not an API change.
  * — `/api/cms/v3/content/audio/list` · from `url_template:-:/api/cms/v3/content/audio/list:template_literal` · to `url_template:-:/api/cms/v3/content/audio/list:template_literal` · @ js/C28j6yuy.js
* **`provenance_moved`** (atomic) — Semantic evidence identity unchanged; source artifact/provenance moved. Informational / frontend-only — not an API change.
  * — `/api/cms/v3/content/bulk` · from `url_template:-:/api/cms/v3/content/bulk:template_literal` · to `url_template:-:/api/cms/v3/content/bulk:template_literal` · @ js/C28j6yuy.js
* **`provenance_moved`** (atomic) — Semantic evidence identity unchanged; source artifact/provenance moved. Informational / frontend-only — not an API change.
  * — `/api/cms/v3/content/delete` · from `url_template:-:/api/cms/v3/content/delete:template_literal` · to `url_template:-:/api/cms/v3/content/delete:template_literal` · @ js/C28j6yuy.js
* **`provenance_moved`** (atomic) — Semantic evidence identity unchanged; source artifact/provenance moved. Informational / frontend-only — not an API change.
  * — `/api/cms/v3/content/delete/texttrack` · from `url_template:-:/api/cms/v3/content/delete/texttrack:template_literal` · to `url_template:-:/api/cms/v3/content/delete/texttrack:template_literal` · @ js/C28j6yuy.js
* **`provenance_moved`** (atomic) — Semantic evidence identity unchanged; source artifact/provenance moved. Informational / frontend-only — not an API change.
  * — `/api/cms/v3/content/edit` · from `url_template:-:/api/cms/v3/content/edit:template_literal` · to `url_template:-:/api/cms/v3/content/edit:template_literal` · @ js/C28j6yuy.js
* **`provenance_moved`** (atomic) — Semantic evidence identity unchanged; source artifact/provenance moved. Informational / frontend-only — not an API change.
  * — `/api/cms/v3/content/move` · from `url_template:-:/api/cms/v3/content/move:template_literal` · to `url_template:-:/api/cms/v3/content/move:template_literal` · @ js/C28j6yuy.js
* **`provenance_moved`** (atomic) — Semantic evidence identity unchanged; source artifact/provenance moved. Informational / frontend-only — not an API change.
  * — `/api/cms/v3/content/picture` · from `url_template:-:/api/cms/v3/content/picture:template_literal` · to `url_template:-:/api/cms/v3/content/picture:template_literal` · @ js/C28j6yuy.js
* **`provenance_moved`** (atomic) — Semantic evidence identity unchanged; source artifact/provenance moved. Informational / frontend-only — not an API change.
  * — `/api/cms/v3/content/picture/list` · from `url_template:-:/api/cms/v3/content/picture/list:template_literal` · to `url_template:-:/api/cms/v3/content/picture/list:template_literal` · @ js/C28j6yuy.js
* **`provenance_moved`** (atomic) — Semantic evidence identity unchanged; source artifact/provenance moved. Informational / frontend-only — not an API change.
  * — `/api/cms/v3/content/upload/texttrack` · from `url_template:-:/api/cms/v3/content/upload/texttrack:template_literal` · to `url_template:-:/api/cms/v3/content/upload/texttrack:template_literal` · @ js/C28j6yuy.js
* **`provenance_moved`** (atomic) — Semantic evidence identity unchanged; source artifact/provenance moved. Informational / frontend-only — not an API change.
  * — `/api/cms/v3/content/video` · from `url_template:-:/api/cms/v3/content/video:template_literal` · to `url_template:-:/api/cms/v3/content/video:template_literal` · @ js/C28j6yuy.js
* **`provenance_moved`** (atomic) — Semantic evidence identity unchanged; source artifact/provenance moved. Informational / frontend-only — not an API change.
  * — `/api/cms/v3/content/video/list` · from `url_template:-:/api/cms/v3/content/video/list:template_literal` · to `url_template:-:/api/cms/v3/content/video/list:template_literal` · @ js/C28j6yuy.js
* **`provenance_moved`** (atomic) — Semantic evidence identity unchanged; source artifact/provenance moved. Informational / frontend-only — not an API change.
  * — `/api/cms/v3/creator` · from `url_template:-:/api/cms/v3/creator:template_literal` · to `url_template:-:/api/cms/v3/creator:template_literal` · @ js/C28j6yuy.js
* **`provenance_moved`** (atomic) — Semantic evidence identity unchanged; source artifact/provenance moved. Informational / frontend-only — not an API change.
  * — `/api/cms/v3/creator/agreement` · from `url_template:-:/api/cms/v3/creator/agreement:template_literal` · to `url_template:-:/api/cms/v3/creator/agreement:template_literal` · @ js/C28j6yuy.js
* **`provenance_moved`** (atomic) — Semantic evidence identity unchanged; source artifact/provenance moved. Informational / frontend-only — not an API change.
  * — `/api/cms/v3/creator/agreement/confirm` · from `url_template:-:/api/cms/v3/creator/agreement/confirm:template_literal` · to `url_template:-:/api/cms/v3/creator/agreement/confirm:template_literal` · @ js/C28j6yuy.js
* **`provenance_moved`** (atomic) — Semantic evidence identity unchanged; source artifact/provenance moved. Informational / frontend-only — not an API change.
  * — `/api/cms/v3/creator/channel` · from `url_template:-:/api/cms/v3/creator/channel:template_literal` · to `url_template:-:/api/cms/v3/creator/channel:template_literal` · @ js/C28j6yuy.js
* **`provenance_moved`** (atomic) — Semantic evidence identity unchanged; source artifact/provenance moved. Informational / frontend-only — not an API change.
  * — `/api/cms/v3/creator/channels` · from `url_template:-:/api/cms/v3/creator/channels:template_literal` · to `url_template:-:/api/cms/v3/creator/channels:template_literal` · @ js/C28j6yuy.js
* **`provenance_moved`** (atomic) — Semantic evidence identity unchanged; source artifact/provenance moved. Informational / frontend-only — not an API change.
  * — `/api/cms/v3/creator/channels/default` · from `url_template:-:/api/cms/v3/creator/channels/default:template_literal` · to `url_template:-:/api/cms/v3/creator/channels/default:template_literal` · @ js/C28j6yuy.js
* **`provenance_moved`** (atomic) — Semantic evidence identity unchanged; source artifact/provenance moved. Informational / frontend-only — not an API change.
  * — `/api/cms/v3/creator/channels/delete` · from `url_template:-:/api/cms/v3/creator/channels/delete:template_literal` · to `url_template:-:/api/cms/v3/creator/channels/delete:template_literal` · @ js/C28j6yuy.js
* **`provenance_moved`** (atomic) — Semantic evidence identity unchanged; source artifact/provenance moved. Informational / frontend-only — not an API change.
  * — `/api/cms/v3/creator/channels/image` · from `url_template:-:/api/cms/v3/creator/channels/image:template_literal` · to `url_template:-:/api/cms/v3/creator/channels/image:template_literal` · @ js/C28j6yuy.js
* **`provenance_moved`** (atomic) — Semantic evidence identity unchanged; source artifact/provenance moved. Informational / frontend-only — not an API change.
  * — `/api/cms/v3/creator/channels/list` · from `url_template:-:/api/cms/v3/creator/channels/list:template_literal` · to `url_template:-:/api/cms/v3/creator/channels/list:template_literal` · @ js/C28j6yuy.js
* **`provenance_moved`** (atomic) — Semantic evidence identity unchanged; source artifact/provenance moved. Informational / frontend-only — not an API change.
  * — `/api/cms/v3/creator/channels/reorder` · from `url_template:-:/api/cms/v3/creator/channels/reorder:template_literal` · to `url_template:-:/api/cms/v3/creator/channels/reorder:template_literal` · @ js/C28j6yuy.js
* **`provenance_moved`** (atomic) — Semantic evidence identity unchanged; source artifact/provenance moved. Informational / frontend-only — not an API change.
  * — `/api/cms/v3/creator/channels/social` · from `url_template:-:/api/cms/v3/creator/channels/social:template_literal` · to `url_template:-:/api/cms/v3/creator/channels/social:template_literal` · @ js/C28j6yuy.js
* **`provenance_moved`** (atomic) — Semantic evidence identity unchanged; source artifact/provenance moved. Informational / frontend-only — not an API change.
  * — `/api/cms/v3/creator/channels/update` · from `url_template:-:/api/cms/v3/creator/channels/update:template_literal` · to `url_template:-:/api/cms/v3/creator/channels/update:template_literal` · @ js/C28j6yuy.js
* **`provenance_moved`** (atomic) — Semantic evidence identity unchanged; source artifact/provenance moved. Informational / frontend-only — not an API change.
  * — `/api/cms/v3/creator/social` · from `url_template:-:/api/cms/v3/creator/social:template_literal` · to `url_template:-:/api/cms/v3/creator/social:template_literal` · @ js/C28j6yuy.js
* **`provenance_moved`** (atomic) — Semantic evidence identity unchanged; source artifact/provenance moved. Informational / frontend-only — not an API change.
  * — `/api/cms/v3/creator/social/update` · from `url_template:-:/api/cms/v3/creator/social/update:template_literal` · to `url_template:-:/api/cms/v3/creator/social/update:template_literal` · @ js/C28j6yuy.js
* **`provenance_moved`** (atomic) — Semantic evidence identity unchanged; source artifact/provenance moved. Informational / frontend-only — not an API change.
  * — `/api/cms/v3/creator/update` · from `url_template:-:/api/cms/v3/creator/update:template_literal` · to `url_template:-:/api/cms/v3/creator/update:template_literal` · @ js/C28j6yuy.js
* **`provenance_moved`** (atomic) — Semantic evidence identity unchanged; source artifact/provenance moved. Informational / frontend-only — not an API change.
  * — `/api/cms/v3/creator/update/image` · from `url_template:-:/api/cms/v3/creator/update/image:template_literal` · to `url_template:-:/api/cms/v3/creator/update/image:template_literal` · @ js/C28j6yuy.js
* **`provenance_moved`** (atomic) — Semantic evidence identity unchanged; source artifact/provenance moved. Informational / frontend-only — not an API change.
  * — `/api/cms/v3/creator/visibility/update` · from `url_template:-:/api/cms/v3/creator/visibility/update:template_literal` · to `url_template:-:/api/cms/v3/creator/visibility/update:template_literal` · @ js/C28j6yuy.js
* **`provenance_moved`** (atomic) — Semantic evidence identity unchanged; source artifact/provenance moved. Informational / frontend-only — not an API change.
  * — `/api/cms/v3/live/info` · from `url_template:-:/api/cms/v3/live/info:template_literal` · to `url_template:-:/api/cms/v3/live/info:template_literal` · @ js/C28j6yuy.js
* **`provenance_moved`** (atomic) — Semantic evidence identity unchanged; source artifact/provenance moved. Informational / frontend-only — not an API change.
  * — `/api/cms/v3/live/thumbnail` · from `url_template:-:/api/cms/v3/live/thumbnail:template_literal` · to `url_template:-:/api/cms/v3/live/thumbnail:template_literal` · @ js/C28j6yuy.js
* **`provenance_moved`** (atomic) — Semantic evidence identity unchanged; source artifact/provenance moved. Informational / frontend-only — not an API change.
  * — `/api/cms/v3/live/update` · from `url_template:-:/api/cms/v3/live/update:template_literal` · to `url_template:-:/api/cms/v3/live/update:template_literal` · @ js/C28j6yuy.js
* **`provenance_moved`** (atomic) — Semantic evidence identity unchanged; source artifact/provenance moved. Informational / frontend-only — not an API change.
  * — `/api/cms/v3/plan` · from `url_template:-:/api/cms/v3/plan:template_literal` · to `url_template:-:/api/cms/v3/plan:template_literal` · @ js/C28j6yuy.js
* **`provenance_moved`** (atomic) — Semantic evidence identity unchanged; source artifact/provenance moved. Informational / frontend-only — not an API change.
  * — `/api/cms/v3/plan/cost` · from `url_template:-:/api/cms/v3/plan/cost:template_literal` · to `url_template:-:/api/cms/v3/plan/cost:template_literal` · @ js/C28j6yuy.js
* **`provenance_moved`** (atomic) — Semantic evidence identity unchanged; source artifact/provenance moved. Informational / frontend-only — not an API change.
  * — `/api/cms/v3/plan/create` · from `url_template:-:/api/cms/v3/plan/create:template_literal` · to `url_template:-:/api/cms/v3/plan/create:template_literal` · @ js/C28j6yuy.js
* **`provenance_moved`** (atomic) — Semantic evidence identity unchanged; source artifact/provenance moved. Informational / frontend-only — not an API change.
  * — `/api/cms/v3/plan/delete` · from `url_template:-:/api/cms/v3/plan/delete:template_literal` · to `url_template:-:/api/cms/v3/plan/delete:template_literal` · @ js/C28j6yuy.js
* **`provenance_moved`** (atomic) — Semantic evidence identity unchanged; source artifact/provenance moved. Informational / frontend-only — not an API change.
  * — `/api/cms/v3/plan/list` · from `url_template:-:/api/cms/v3/plan/list:template_literal` · to `url_template:-:/api/cms/v3/plan/list:template_literal` · @ js/C28j6yuy.js
* **`provenance_moved`** (atomic) — Semantic evidence identity unchanged; source artifact/provenance moved. Informational / frontend-only — not an API change.
  * — `/api/cms/v3/plan/multi` · from `url_template:-:/api/cms/v3/plan/multi:template_literal` · to `url_template:-:/api/cms/v3/plan/multi:template_literal` · @ js/C28j6yuy.js
* **`provenance_moved`** (atomic) — Semantic evidence identity unchanged; source artifact/provenance moved. Informational / frontend-only — not an API change.
  * — `/api/cms/v3/plan/preview` · from `url_template:-:/api/cms/v3/plan/preview:template_literal` · to `url_template:-:/api/cms/v3/plan/preview:template_literal` · @ js/C28j6yuy.js
* **`provenance_moved`** (atomic) — Semantic evidence identity unchanged; source artifact/provenance moved. Informational / frontend-only — not an API change.
  * — `/api/cms/v3/plan/preview/stop` · from `url_template:-:/api/cms/v3/plan/preview/stop:template_literal` · to `url_template:-:/api/cms/v3/plan/preview/stop:template_literal` · @ js/C28j6yuy.js
* **`provenance_moved`** (atomic) — Semantic evidence identity unchanged; source artifact/provenance moved. Informational / frontend-only — not an API change.
  * — `/api/cms/v3/plan/publish` · from `url_template:-:/api/cms/v3/plan/publish:template_literal` · to `url_template:-:/api/cms/v3/plan/publish:template_literal` · @ js/C28j6yuy.js
* **`provenance_moved`** (atomic) — Semantic evidence identity unchanged; source artifact/provenance moved. Informational / frontend-only — not an API change.
  * — `/api/cms/v3/plan/update` · from `url_template:-:/api/cms/v3/plan/update:template_literal` · to `url_template:-:/api/cms/v3/plan/update:template_literal` · @ js/C28j6yuy.js
* **`provenance_moved`** (atomic) — Semantic evidence identity unchanged; source artifact/provenance moved. Informational / frontend-only — not an API change.
  * — `/api/cms/v3/poll/list` · from `url_template:-:/api/cms/v3/poll/list:template_literal` · to `url_template:-:/api/cms/v3/poll/list:template_literal` · @ js/C28j6yuy.js
* **`provenance_moved`** (atomic) — Semantic evidence identity unchanged; source artifact/provenance moved. Informational / frontend-only — not an API change.
  * — `/api/cms/v3/subscribers/download` · from `url_template:-:/api/cms/v3/subscribers/download:template_literal` · to `url_template:-:/api/cms/v3/subscribers/download:template_literal` · @ js/C28j6yuy.js
* **`provenance_moved`** (atomic) — Semantic evidence identity unchanged; source artifact/provenance moved. Informational / frontend-only — not an API change.
  * — `/api/cms/v3/subscribers/list` · from `url_template:-:/api/cms/v3/subscribers/list:template_literal` · to `url_template:-:/api/cms/v3/subscribers/list:template_literal` · @ js/C28j6yuy.js
* **`provenance_moved`** (atomic) — Semantic evidence identity unchanged; source artifact/provenance moved. Informational / frontend-only — not an API change.
  * — `/api/cms/v3/survey/report` · from `url_template:-:/api/cms/v3/survey/report:template_literal` · to `url_template:-:/api/cms/v3/survey/report:template_literal` · @ js/C28j6yuy.js
* **`provenance_moved`** (atomic) — Semantic evidence identity unchanged; source artifact/provenance moved. Informational / frontend-only — not an API change.
  * — `/api/cms/v3/survey/report/enabled` · from `url_template:-:/api/cms/v3/survey/report/enabled:template_literal` · to `url_template:-:/api/cms/v3/survey/report/enabled:template_literal` · @ js/C28j6yuy.js
* **`provenance_moved`** (atomic) — Semantic evidence identity unchanged; source artifact/provenance moved. Informational / frontend-only — not an API change.
  * — `/api/connect/{param}` · from `url_template:-:/api/connect/{param}:template_literal` · to `url_template:-:/api/connect/{param}:template_literal` · @ js/BD07vIHj.js
* **`provenance_moved`** (atomic) — Semantic evidence identity unchanged; source artifact/provenance moved. Informational / frontend-only — not an API change.
  * — `/api/v1/components/groups` · from `url_template:-:/api/v1/components/groups:template_literal` · to `url_template:-:/api/v1/components/groups:template_literal` · @ js/DmBm0dVs.js
* **`provenance_moved`** (atomic) — Semantic evidence identity unchanged; source artifact/provenance moved. Informational / frontend-only — not an API change.
  * — `/api/v3/achievement/perks` · from `url_template:-:/api/v3/achievement/perks:template_literal` · to `url_template:-:/api/v3/achievement/perks:template_literal` · @ js/C28j6yuy.js
* **`provenance_moved`** (atomic) — Semantic evidence identity unchanged; source artifact/provenance moved. Informational / frontend-only — not an API change.
  * — `/api/v3/activation/email/confirm` · from `url_template:-:/api/v3/activation/email/confirm:template_literal` · to `url_template:-:/api/v3/activation/email/confirm:template_literal` · @ js/C28j6yuy.js
* **`provenance_moved`** (atomic) — Semantic evidence identity unchanged; source artifact/provenance moved. Informational / frontend-only — not an API change.
  * — `/api/v3/activation/email/request` · from `url_template:-:/api/v3/activation/email/request:template_literal` · to `url_template:-:/api/v3/activation/email/request:template_literal` · @ js/C28j6yuy.js
* **`provenance_moved`** (atomic) — Semantic evidence identity unchanged; source artifact/provenance moved. Informational / frontend-only — not an API change.
  * — `/api/v3/auth/captcha/info` · from `url_template:-:/api/v3/auth/captcha/info:template_literal` · to `url_template:-:/api/v3/auth/captcha/info:template_literal` · @ js/C28j6yuy.js
* **`provenance_moved`** (atomic) — Semantic evidence identity unchanged; source artifact/provenance moved. Informational / frontend-only — not an API change.
  * — `/api/v3/auth/checkFor2faLogin` · from `url_template:-:/api/v3/auth/checkFor2faLogin:template_literal` · to `url_template:-:/api/v3/auth/checkFor2faLogin:template_literal` · @ js/C28j6yuy.js
* **`provenance_moved`** (atomic) — Semantic evidence identity unchanged; source artifact/provenance moved. Informational / frontend-only — not an API change.
  * — `/api/v3/auth/keycloak/migration/login/{username_or_email_or_userid}` · from `url_template:-:/api/v3/auth/keycloak/migration/login/{username_or_email_or_userid}:template_literal` · to `url_template:-:/api/v3/auth/keycloak/migration/login/{username_or_email_or_userid}:template_literal` · @ js/C28j6yuy.js
* **`provenance_moved`** (atomic) — Semantic evidence identity unchanged; source artifact/provenance moved. Informational / frontend-only — not an API change.
  * — `/api/v3/auth/keycloak/migration/login/{username_or_email}` · from `url_template:-:/api/v3/auth/keycloak/migration/login/{username_or_email}:template_literal` · to `url_template:-:/api/v3/auth/keycloak/migration/login/{username_or_email}:template_literal` · @ js/C28j6yuy.js
* **`provenance_moved`** (atomic) — Semantic evidence identity unchanged; source artifact/provenance moved. Informational / frontend-only — not an API change.
  * — `/api/v3/auth/login` · from `url_template:-:/api/v3/auth/login:template_literal` · to `url_template:-:/api/v3/auth/login:template_literal` · @ js/C28j6yuy.js
* **`provenance_moved`** (atomic) — Semantic evidence identity unchanged; source artifact/provenance moved. Informational / frontend-only — not an API change.
  * — `/api/v3/auth/logout` · from `url_template:-:/api/v3/auth/logout:template_literal` · to `url_template:-:/api/v3/auth/logout:template_literal` · @ js/C28j6yuy.js
* **`provenance_moved`** (atomic) — Semantic evidence identity unchanged; source artifact/provenance moved. Informational / frontend-only — not an API change.
  * — `/api/v3/auth/signup` · from `url_template:-:/api/v3/auth/signup:template_literal` · to `url_template:-:/api/v3/auth/signup:template_literal` · @ js/C28j6yuy.js
* **`provenance_moved`** (atomic) — Semantic evidence identity unchanged; source artifact/provenance moved. Informational / frontend-only — not an API change.
  * — `/api/v3/auth/spoof/begin` · from `url_template:-:/api/v3/auth/spoof/begin:template_literal` · to `url_template:-:/api/v3/auth/spoof/begin:template_literal` · @ js/C28j6yuy.js
* **`provenance_moved`** (atomic) — Semantic evidence identity unchanged; source artifact/provenance moved. Informational / frontend-only — not an API change.
  * — `/api/v3/auth/spoof/end` · from `url_template:-:/api/v3/auth/spoof/end:template_literal` · to `url_template:-:/api/v3/auth/spoof/end:template_literal` · @ js/C28j6yuy.js
* **`provenance_moved`** (atomic) — Semantic evidence identity unchanged; source artifact/provenance moved. Informational / frontend-only — not an API change.
  * — `/api/v3/comment` · from `url_template:-:/api/v3/comment:template_literal` · to `url_template:-:/api/v3/comment:template_literal` · @ js/C28j6yuy.js
* **`provenance_moved`** (atomic) — Semantic evidence identity unchanged; source artifact/provenance moved. Informational / frontend-only — not an API change.
  * — `/api/v3/comment/delete` · from `url_template:-:/api/v3/comment/delete:template_literal` · to `url_template:-:/api/v3/comment/delete:template_literal` · @ js/C28j6yuy.js
* **`provenance_moved`** (atomic) — Semantic evidence identity unchanged; source artifact/provenance moved. Informational / frontend-only — not an API change.
  * — `/api/v3/comment/dislike` · from `url_template:-:/api/v3/comment/dislike:template_literal` · to `url_template:-:/api/v3/comment/dislike:template_literal` · @ js/C28j6yuy.js
* **`provenance_moved`** (atomic) — Semantic evidence identity unchanged; source artifact/provenance moved. Informational / frontend-only — not an API change.
  * — `/api/v3/comment/edit` · from `url_template:-:/api/v3/comment/edit:template_literal` · to `url_template:-:/api/v3/comment/edit:template_literal` · @ js/C28j6yuy.js
* **`provenance_moved`** (atomic) — Semantic evidence identity unchanged; source artifact/provenance moved. Informational / frontend-only — not an API change.
  * — `/api/v3/comment/history` · from `url_template:-:/api/v3/comment/history:template_literal` · to `url_template:-:/api/v3/comment/history:template_literal` · @ js/C28j6yuy.js
* **`provenance_moved`** (atomic) — Semantic evidence identity unchanged; source artifact/provenance moved. Informational / frontend-only — not an API change.
  * — `/api/v3/comment/like` · from `url_template:-:/api/v3/comment/like:template_literal` · to `url_template:-:/api/v3/comment/like:template_literal` · @ js/C28j6yuy.js
* **`provenance_moved`** (atomic) — Semantic evidence identity unchanged; source artifact/provenance moved. Informational / frontend-only — not an API change.
  * — `/api/v3/comment/pin` · from `url_template:-:/api/v3/comment/pin:template_literal` · to `url_template:-:/api/v3/comment/pin:template_literal` · @ js/C28j6yuy.js
* **`provenance_moved`** (atomic) — Semantic evidence identity unchanged; source artifact/provenance moved. Informational / frontend-only — not an API change.
  * — `/api/v3/comment/replies` · from `url_template:-:/api/v3/comment/replies:template_literal` · to `url_template:-:/api/v3/comment/replies:template_literal` · @ js/C28j6yuy.js
* **`provenance_moved`** (atomic) — Semantic evidence identity unchanged; source artifact/provenance moved. Informational / frontend-only — not an API change.
  * — `/api/v3/comment/reply` · from `url_template:-:/api/v3/comment/reply:template_literal` · to `url_template:-:/api/v3/comment/reply:template_literal` · @ js/C28j6yuy.js
* **`provenance_moved`** (atomic) — Semantic evidence identity unchanged; source artifact/provenance moved. Informational / frontend-only — not an API change.
  * — `/api/v3/connect/{site}` · from `url_template:-:/api/v3/connect/{site}:template_literal` · to `url_template:-:/api/v3/connect/{site}:template_literal` · @ js/C28j6yuy.js
* **`provenance_moved`** (atomic) — Semantic evidence identity unchanged; source artifact/provenance moved. Informational / frontend-only — not an API change.
  * — `/api/v3/connect/{site}/callback` · from `url_template:-:/api/v3/connect/{site}/callback:template_literal` · to `url_template:-:/api/v3/connect/{site}/callback:template_literal` · @ js/C28j6yuy.js
* **`provenance_moved`** (atomic) — Semantic evidence identity unchanged; source artifact/provenance moved. Informational / frontend-only — not an API change.
  * — `/api/v3/connect/complete` · from `url_template:-:/api/v3/connect/complete:template_literal` · to `url_template:-:/api/v3/connect/complete:template_literal` · @ js/C28j6yuy.js
* **`provenance_moved`** (atomic) — Semantic evidence identity unchanged; source artifact/provenance moved. Informational / frontend-only — not an API change.
  * — `/api/v3/connect/dissociate` · from `url_template:-:/api/v3/connect/dissociate:template_literal` · to `url_template:-:/api/v3/connect/dissociate:template_literal` · @ js/C28j6yuy.js
* **`provenance_moved`** (atomic) — Semantic evidence identity unchanged; source artifact/provenance moved. Informational / frontend-only — not an API change.
  * — `/api/v3/connect/list` · from `url_template:-:/api/v3/connect/list:template_literal` · to `url_template:-:/api/v3/connect/list:template_literal` · @ js/C28j6yuy.js
* **`provenance_moved`** (atomic) — Semantic evidence identity unchanged; source artifact/provenance moved. Informational / frontend-only — not an API change.
  * — `/api/v3/connect/refresh` · from `url_template:-:/api/v3/connect/refresh:template_literal` · to `url_template:-:/api/v3/connect/refresh:template_literal` · @ js/C28j6yuy.js
* **`provenance_moved`** (atomic) — Semantic evidence identity unchanged; source artifact/provenance moved. Informational / frontend-only — not an API change.
  * — `/api/v3/content/audio` · from `url_template:-:/api/v3/content/audio:template_literal` · to `url_template:-:/api/v3/content/audio:template_literal` · @ js/C28j6yuy.js
* **`provenance_moved`** (atomic) — Semantic evidence identity unchanged; source artifact/provenance moved. Informational / frontend-only — not an API change.
  * — `/api/v3/content/creator` · from `url_template:-:/api/v3/content/creator:template_literal` · to `url_template:-:/api/v3/content/creator:template_literal` · @ js/C28j6yuy.js
* **`provenance_moved`** (atomic) — Semantic evidence identity unchanged; source artifact/provenance moved. Informational / frontend-only — not an API change.
  * — `/api/v3/content/creator/list` · from `url_template:-:/api/v3/content/creator/list:template_literal` · to `url_template:-:/api/v3/content/creator/list:template_literal` · @ js/C28j6yuy.js
* **`provenance_moved`** (atomic) — Semantic evidence identity unchanged; source artifact/provenance moved. Informational / frontend-only — not an API change.
  * — `/api/v3/content/creator/list/paged` · from `url_template:-:/api/v3/content/creator/list/paged:template_literal` · to `url_template:-:/api/v3/content/creator/list/paged:template_literal` · @ js/C28j6yuy.js
* **`provenance_moved`** (atomic) — Semantic evidence identity unchanged; source artifact/provenance moved. Informational / frontend-only — not an API change.
  * — `/api/v3/content/dislike` · from `url_template:-:/api/v3/content/dislike:template_literal` · to `url_template:-:/api/v3/content/dislike:template_literal` · @ js/C28j6yuy.js
* **`provenance_moved`** (atomic) — Semantic evidence identity unchanged; source artifact/provenance moved. Informational / frontend-only — not an API change.
  * — `/api/v3/content/history` · from `url_template:-:/api/v3/content/history:template_literal` · to `url_template:-:/api/v3/content/history:template_literal` · @ js/C28j6yuy.js
* **`provenance_moved`** (atomic) — Semantic evidence identity unchanged; source artifact/provenance moved. Informational / frontend-only — not an API change.
  * — `/api/v3/content/info` · from `url_template:-:/api/v3/content/info:template_literal` · to `url_template:-:/api/v3/content/info:template_literal` · @ js/C28j6yuy.js
* **`provenance_moved`** (atomic) — Semantic evidence identity unchanged; source artifact/provenance moved. Informational / frontend-only — not an API change.
  * — `/api/v3/content/landing-page` · from `url_template:-:/api/v3/content/landing-page:template_literal` · to `url_template:-:/api/v3/content/landing-page:template_literal` · @ js/C28j6yuy.js
* **`provenance_moved`** (atomic) — Semantic evidence identity unchanged; source artifact/provenance moved. Informational / frontend-only — not an API change.
  * — `/api/v3/content/like` · from `url_template:-:/api/v3/content/like:template_literal` · to `url_template:-:/api/v3/content/like:template_literal` · @ js/C28j6yuy.js
* **`provenance_moved`** (atomic) — Semantic evidence identity unchanged; source artifact/provenance moved. Informational / frontend-only — not an API change.
  * — `/api/v3/content/picture` · from `url_template:-:/api/v3/content/picture:template_literal` · to `url_template:-:/api/v3/content/picture:template_literal` · @ js/C28j6yuy.js
* **`provenance_moved`** (atomic) — Semantic evidence identity unchanged; source artifact/provenance moved. Informational / frontend-only — not an API change.
  * — `/api/v3/content/picture/url` · from `url_template:-:/api/v3/content/picture/url:template_literal` · to `url_template:-:/api/v3/content/picture/url:template_literal` · @ js/C28j6yuy.js
* **`provenance_moved`** (atomic) — Semantic evidence identity unchanged; source artifact/provenance moved. Informational / frontend-only — not an API change.
  * — `/api/v3/content/post` · from `url_template:-:/api/v3/content/post:template_literal` · to `url_template:-:/api/v3/content/post:template_literal` · @ js/C28j6yuy.js
* **`provenance_moved`** (atomic) — Semantic evidence identity unchanged; source artifact/provenance moved. Informational / frontend-only — not an API change.
  * — `/api/v3/content/post/list` · from `url_template:-:/api/v3/content/post/list:template_literal` · to `url_template:-:/api/v3/content/post/list:template_literal` · @ js/C28j6yuy.js
* **`provenance_moved`** (atomic) — Semantic evidence identity unchanged; source artifact/provenance moved. Informational / frontend-only — not an API change.
  * — `/api/v3/content/post/random` · from `url_template:-:/api/v3/content/post/random:template_literal` · to `url_template:-:/api/v3/content/post/random:template_literal` · @ js/C28j6yuy.js
* **`provenance_moved`** (atomic) — Semantic evidence identity unchanged; source artifact/provenance moved. Informational / frontend-only — not an API change.
  * — `/api/v3/content/progress` · from `url_template:-:/api/v3/content/progress:template_literal` · to `url_template:-:/api/v3/content/progress:template_literal` · @ js/C28j6yuy.js
* **`provenance_moved`** (atomic) — Semantic evidence identity unchanged; source artifact/provenance moved. Informational / frontend-only — not an API change.
  * — `/api/v3/content/progress/clear` · from `url_template:-:/api/v3/content/progress/clear:template_literal` · to `url_template:-:/api/v3/content/progress/clear:template_literal` · @ js/C28j6yuy.js
* **`provenance_moved`** (atomic) — Semantic evidence identity unchanged; source artifact/provenance moved. Informational / frontend-only — not an API change.
  * — `/api/v3/content/progress/delete` · from `url_template:-:/api/v3/content/progress/delete:template_literal` · to `url_template:-:/api/v3/content/progress/delete:template_literal` · @ js/C28j6yuy.js
* **`provenance_moved`** (atomic) — Semantic evidence identity unchanged; source artifact/provenance moved. Informational / frontend-only — not an API change.
  * — `/api/v3/content/related` · from `url_template:-:/api/v3/content/related:template_literal` · to `url_template:-:/api/v3/content/related:template_literal` · @ js/C28j6yuy.js
* **`provenance_moved`** (atomic) — Semantic evidence identity unchanged; source artifact/provenance moved. Informational / frontend-only — not an API change.
  * — `/api/v3/content/search` · from `url_template:-:/api/v3/content/search:template_literal` · to `url_template:-:/api/v3/content/search:template_literal` · @ js/C28j6yuy.js
* **`provenance_moved`** (atomic) — Semantic evidence identity unchanged; source artifact/provenance moved. Informational / frontend-only — not an API change.
  * — `/api/v3/content/tags` · from `url_template:-:/api/v3/content/tags:template_literal` · to `url_template:-:/api/v3/content/tags:template_literal` · @ js/C28j6yuy.js
* **`provenance_moved`** (atomic) — Semantic evidence identity unchanged; source artifact/provenance moved. Informational / frontend-only — not an API change.
  * — `/api/v3/content/thumbnail/subscribe` · from `url_template:-:/api/v3/content/thumbnail/subscribe:template_literal` · to `url_template:-:/api/v3/content/thumbnail/subscribe:template_literal` · @ js/C28j6yuy.js
* **`provenance_moved`** (atomic) — Semantic evidence identity unchanged; source artifact/provenance moved. Informational / frontend-only — not an API change.
  * — `/api/v3/content/thumbnail/unsubscribe` · from `url_template:-:/api/v3/content/thumbnail/unsubscribe:template_literal` · to `url_template:-:/api/v3/content/thumbnail/unsubscribe:template_literal` · @ js/C28j6yuy.js
* **`provenance_moved`** (atomic) — Semantic evidence identity unchanged; source artifact/provenance moved. Informational / frontend-only — not an API change.
  * — `/api/v3/content/upload/s3/multipart` · from `url_template:-:/api/v3/content/upload/s3/multipart:template_literal` · to `url_template:-:/api/v3/content/upload/s3/multipart:template_literal` · @ js/C28j6yuy.js
* **`provenance_moved`** (atomic) — Semantic evidence identity unchanged; source artifact/provenance moved. Informational / frontend-only — not an API change.
  * — `/api/v3/content/upload/s3/multipart/abort` · from `url_template:-:/api/v3/content/upload/s3/multipart/abort:template_literal` · to `url_template:-:/api/v3/content/upload/s3/multipart/abort:template_literal` · @ js/C28j6yuy.js
* **`provenance_moved`** (atomic) — Semantic evidence identity unchanged; source artifact/provenance moved. Informational / frontend-only — not an API change.
  * — `/api/v3/content/upload/s3/multipart/complete` · from `url_template:-:/api/v3/content/upload/s3/multipart/complete:template_literal` · to `url_template:-:/api/v3/content/upload/s3/multipart/complete:template_literal` · @ js/C28j6yuy.js
* **`provenance_moved`** (atomic) — Semantic evidence identity unchanged; source artifact/provenance moved. Informational / frontend-only — not an API change.
  * — `/api/v3/content/upload/s3/multipart/sign` · from `url_template:-:/api/v3/content/upload/s3/multipart/sign:template_literal` · to `url_template:-:/api/v3/content/upload/s3/multipart/sign:template_literal` · @ js/C28j6yuy.js
* **`provenance_moved`** (atomic) — Semantic evidence identity unchanged; source artifact/provenance moved. Informational / frontend-only — not an API change.
  * — `/api/v3/content/upload/thumbnail` · from `url_template:-:/api/v3/content/upload/thumbnail:template_literal` · to `url_template:-:/api/v3/content/upload/thumbnail:template_literal` · @ js/C28j6yuy.js
* **`provenance_moved`** (atomic) — Semantic evidence identity unchanged; source artifact/provenance moved. Informational / frontend-only — not an API change.
  * — `/api/v3/content/video` · from `url_template:-:/api/v3/content/video:template_literal` · to `url_template:-:/api/v3/content/video:template_literal` · @ js/C28j6yuy.js
* **`provenance_moved`** (atomic) — Semantic evidence identity unchanged; source artifact/provenance moved. Informational / frontend-only — not an API change.
  * — `/api/v3/creator/category/list` · from `url_template:-:/api/v3/creator/category/list:template_literal` · to `url_template:-:/api/v3/creator/category/list:template_literal` · @ js/C28j6yuy.js
* **`provenance_moved`** (atomic) — Semantic evidence identity unchanged; source artifact/provenance moved. Informational / frontend-only — not an API change.
  * — `/api/v3/creator/channels/list` · from `url_template:-:/api/v3/creator/channels/list:template_literal` · to `url_template:-:/api/v3/creator/channels/list:template_literal` · @ js/C28j6yuy.js
* **`provenance_moved`** (atomic) — Semantic evidence identity unchanged; source artifact/provenance moved. Informational / frontend-only — not an API change.
  * — `/api/v3/creator/discover` · from `url_template:-:/api/v3/creator/discover:template_literal` · to `url_template:-:/api/v3/creator/discover:template_literal` · @ js/C28j6yuy.js
* **`provenance_moved`** (atomic) — Semantic evidence identity unchanged; source artifact/provenance moved. Informational / frontend-only — not an API change.
  * — `/api/v3/creator/info` · from `url_template:-:/api/v3/creator/info:template_literal` · to `url_template:-:/api/v3/creator/info:template_literal` · @ js/C28j6yuy.js
* **`provenance_moved`** (atomic) — Semantic evidence identity unchanged; source artifact/provenance moved. Informational / frontend-only — not an API change.
  * — `/api/v3/creator/invite/bind` · from `url_template:-:/api/v3/creator/invite/bind:template_literal` · to `url_template:-:/api/v3/creator/invite/bind:template_literal` · @ js/C28j6yuy.js
* **`provenance_moved`** (atomic) — Semantic evidence identity unchanged; source artifact/provenance moved. Informational / frontend-only — not an API change.
  * — `/api/v3/creator/invite/claim` · from `url_template:-:/api/v3/creator/invite/claim:template_literal` · to `url_template:-:/api/v3/creator/invite/claim:template_literal` · @ js/C28j6yuy.js
* **`provenance_moved`** (atomic) — Semantic evidence identity unchanged; source artifact/provenance moved. Informational / frontend-only — not an API change.
  * — `/api/v3/creator/invite/info` · from `url_template:-:/api/v3/creator/invite/info:template_literal` · to `url_template:-:/api/v3/creator/invite/info:template_literal` · @ js/C28j6yuy.js
* **`provenance_moved`** (atomic) — Semantic evidence identity unchanged; source artifact/provenance moved. Informational / frontend-only — not an API change.
  * — `/api/v3/creator/list` · from `url_template:-:/api/v3/creator/list:template_literal` · to `url_template:-:/api/v3/creator/list:template_literal` · @ js/C28j6yuy.js
* **`provenance_moved`** (atomic) — Semantic evidence identity unchanged; source artifact/provenance moved. Informational / frontend-only — not an API change.
  * — `/api/v3/creator/named` · from `url_template:-:/api/v3/creator/named:template_literal` · to `url_template:-:/api/v3/creator/named:template_literal` · @ js/C28j6yuy.js
* **`provenance_moved`** (atomic) — Semantic evidence identity unchanged; source artifact/provenance moved. Informational / frontend-only — not an API change.
  * — `/api/v3/creator/stats` · from `url_template:-:/api/v3/creator/stats:template_literal` · to `url_template:-:/api/v3/creator/stats:template_literal` · @ js/C28j6yuy.js
* **`provenance_moved`** (atomic) — Semantic evidence identity unchanged; source artifact/provenance moved. Informational / frontend-only — not an API change.
  * — `/api/v3/creator/subscribe` · from `url_template:-:/api/v3/creator/subscribe:template_literal` · to `url_template:-:/api/v3/creator/subscribe:template_literal` · @ js/C28j6yuy.js
* **`provenance_moved`** (atomic) — Semantic evidence identity unchanged; source artifact/provenance moved. Informational / frontend-only — not an API change.
  * — `/api/v3/creator/unsubscribe` · from `url_template:-:/api/v3/creator/unsubscribe:template_literal` · to `url_template:-:/api/v3/creator/unsubscribe:template_literal` · @ js/C28j6yuy.js
* **`provenance_moved`** (atomic) — Semantic evidence identity unchanged; source artifact/provenance moved. Informational / frontend-only — not an API change.
  * — `/api/v3/delivery/info` · from `url_template:-:/api/v3/delivery/info:template_literal` · to `url_template:-:/api/v3/delivery/info:template_literal` · @ js/C28j6yuy.js
* **`provenance_moved`** (atomic) — Semantic evidence identity unchanged; source artifact/provenance moved. Informational / frontend-only — not an API change.
  * — `/api/v3/discord/bot/info` · from `url_template:-:/api/v3/discord/bot/info:template_literal` · to `url_template:-:/api/v3/discord/bot/info:template_literal` · @ js/C28j6yuy.js
* **`provenance_moved`** (atomic) — Semantic evidence identity unchanged; source artifact/provenance moved. Informational / frontend-only — not an API change.
  * — `/api/v3/discord/bot/invite/generate` · from `url_template:-:/api/v3/discord/bot/invite/generate:template_literal` · to `url_template:-:/api/v3/discord/bot/invite/generate:template_literal` · @ js/C28j6yuy.js
* **`provenance_moved`** (atomic) — Semantic evidence identity unchanged; source artifact/provenance moved. Informational / frontend-only — not an API change.
  * — `/api/v3/discord/bot/link` · from `url_template:-:/api/v3/discord/bot/link:template_literal` · to `url_template:-:/api/v3/discord/bot/link:template_literal` · @ js/C28j6yuy.js
* **`provenance_moved`** (atomic) — Semantic evidence identity unchanged; source artifact/provenance moved. Informational / frontend-only — not an API change.
  * — `/api/v3/discord/bot/link/callback` · from `url_template:-:/api/v3/discord/bot/link/callback:template_literal` · to `url_template:-:/api/v3/discord/bot/link/callback:template_literal` · @ js/C28j6yuy.js
* **`provenance_moved`** (atomic) — Semantic evidence identity unchanged; source artifact/provenance moved. Informational / frontend-only — not an API change.
  * — `/api/v3/discord/bot/list` · from `url_template:-:/api/v3/discord/bot/list:template_literal` · to `url_template:-:/api/v3/discord/bot/list:template_literal` · @ js/C28j6yuy.js
* **`provenance_moved`** (atomic) — Semantic evidence identity unchanged; source artifact/provenance moved. Informational / frontend-only — not an API change.
  * — `/api/v3/discord/bot/unlink` · from `url_template:-:/api/v3/discord/bot/unlink:template_literal` · to `url_template:-:/api/v3/discord/bot/unlink:template_literal` · @ js/C28j6yuy.js
* **`provenance_moved`** (atomic) — Semantic evidence identity unchanged; source artifact/provenance moved. Informational / frontend-only — not an API change.
  * — `/api/v3/discord/bot/update` · from `url_template:-:/api/v3/discord/bot/update:template_literal` · to `url_template:-:/api/v3/discord/bot/update:template_literal` · @ js/C28j6yuy.js
* **`provenance_moved`** (atomic) — Semantic evidence identity unchanged; source artifact/provenance moved. Informational / frontend-only — not an API change.
  * — `/api/v3/discord/server/join` · from `url_template:-:/api/v3/discord/server/join:template_literal` · to `url_template:-:/api/v3/discord/server/join:template_literal` · @ js/C28j6yuy.js
* **`provenance_moved`** (atomic) — Semantic evidence identity unchanged; source artifact/provenance moved. Informational / frontend-only — not an API change.
  * — `/api/v3/faq/list` · from `url_template:-:/api/v3/faq/list:template_literal` · to `url_template:-:/api/v3/faq/list:template_literal` · @ js/C28j6yuy.js
* **`provenance_moved`** (atomic) — Semantic evidence identity unchanged; source artifact/provenance moved. Informational / frontend-only — not an API change.
  * — `/api/v3/image/optimizations` · from `url_template:-:/api/v3/image/optimizations:template_literal` · to `url_template:-:/api/v3/image/optimizations:template_literal` · @ js/C28j6yuy.js
* **`provenance_moved`** (atomic) — Semantic evidence identity unchanged; source artifact/provenance moved. Informational / frontend-only — not an API change.
  * — `/api/v3/image/type` · from `url_template:-:/api/v3/image/type:template_literal` · to `url_template:-:/api/v3/image/type:template_literal` · @ js/C28j6yuy.js
* **`provenance_moved`** (atomic) — Semantic evidence identity unchanged; source artifact/provenance moved. Informational / frontend-only — not an API change.
  * — `/api/v3/image/type/list` · from `url_template:-:/api/v3/image/type/list:template_literal` · to `url_template:-:/api/v3/image/type/list:template_literal` · @ js/C28j6yuy.js
* **`provenance_moved`** (atomic) — Semantic evidence identity unchanged; source artifact/provenance moved. Informational / frontend-only — not an API change.
  * — `/api/v3/moderation/comment/hide` · from `url_template:-:/api/v3/moderation/comment/hide:template_literal` · to `url_template:-:/api/v3/moderation/comment/hide:template_literal` · @ js/C28j6yuy.js
* **`provenance_moved`** (atomic) — Semantic evidence identity unchanged; source artifact/provenance moved. Informational / frontend-only — not an API change.
  * — `/api/v3/moderation/comment/unhide` · from `url_template:-:/api/v3/moderation/comment/unhide:template_literal` · to `url_template:-:/api/v3/moderation/comment/unhide:template_literal` · @ js/C28j6yuy.js
* **`provenance_moved`** (atomic) — Semantic evidence identity unchanged; source artifact/provenance moved. Informational / frontend-only — not an API change.
  * — `/api/v3/moderation/user/ban` · from `url_template:-:/api/v3/moderation/user/ban:template_literal` · to `url_template:-:/api/v3/moderation/user/ban:template_literal` · @ js/C28j6yuy.js
* **`provenance_moved`** (atomic) — Semantic evidence identity unchanged; source artifact/provenance moved. Informational / frontend-only — not an API change.
  * — `/api/v3/moderation/user/ban/list` · from `url_template:-:/api/v3/moderation/user/ban/list:template_literal` · to `url_template:-:/api/v3/moderation/user/ban/list:template_literal` · @ js/C28j6yuy.js
* **`provenance_moved`** (atomic) — Semantic evidence identity unchanged; source artifact/provenance moved. Informational / frontend-only — not an API change.
  * — `/api/v3/moderation/user/info` · from `url_template:-:/api/v3/moderation/user/info:template_literal` · to `url_template:-:/api/v3/moderation/user/info:template_literal` · @ js/C28j6yuy.js
* **`provenance_moved`** (atomic) — Semantic evidence identity unchanged; source artifact/provenance moved. Informational / frontend-only — not an API change.
  * — `/api/v3/moderation/user/unban` · from `url_template:-:/api/v3/moderation/user/unban:template_literal` · to `url_template:-:/api/v3/moderation/user/unban:template_literal` · @ js/C28j6yuy.js
* **`provenance_moved`** (atomic) — Semantic evidence identity unchanged; source artifact/provenance moved. Informational / frontend-only — not an API change.
  * — `/api/v3/payment/address/add` · from `url_template:-:/api/v3/payment/address/add:template_literal` · to `url_template:-:/api/v3/payment/address/add:template_literal` · @ js/C28j6yuy.js
* **`provenance_moved`** (atomic) — Semantic evidence identity unchanged; source artifact/provenance moved. Informational / frontend-only — not an API change.
  * — `/api/v3/payment/address/delete` · from `url_template:-:/api/v3/payment/address/delete:template_literal` · to `url_template:-:/api/v3/payment/address/delete:template_literal` · @ js/C28j6yuy.js
* **`provenance_moved`** (atomic) — Semantic evidence identity unchanged; source artifact/provenance moved. Informational / frontend-only — not an API change.
  * — `/api/v3/payment/address/list` · from `url_template:-:/api/v3/payment/address/list:template_literal` · to `url_template:-:/api/v3/payment/address/list:template_literal` · @ js/C28j6yuy.js
* **`provenance_moved`** (atomic) — Semantic evidence identity unchanged; source artifact/provenance moved. Informational / frontend-only — not an API change.
  * — `/api/v3/payment/address/set` · from `url_template:-:/api/v3/payment/address/set:template_literal` · to `url_template:-:/api/v3/payment/address/set:template_literal` · @ js/C28j6yuy.js
* **`provenance_moved`** (atomic) — Semantic evidence identity unchanged; source artifact/provenance moved. Informational / frontend-only — not an API change.
  * — `/api/v3/payment/address/update` · from `url_template:-:/api/v3/payment/address/update:template_literal` · to `url_template:-:/api/v3/payment/address/update:template_literal` · @ js/C28j6yuy.js
* **`provenance_moved`** (atomic) — Semantic evidence identity unchanged; source artifact/provenance moved. Informational / frontend-only — not an API change.
  * — `/api/v3/payment/braintree/token` · from `url_template:-:/api/v3/payment/braintree/token:template_literal` · to `url_template:-:/api/v3/payment/braintree/token:template_literal` · @ js/C28j6yuy.js
* **`provenance_moved`** (atomic) — Semantic evidence identity unchanged; source artifact/provenance moved. Informational / frontend-only — not an API change.
  * — `/api/v3/payment/invoice/list` · from `url_template:-:/api/v3/payment/invoice/list:template_literal` · to `url_template:-:/api/v3/payment/invoice/list:template_literal` · @ js/C28j6yuy.js
* **`provenance_moved`** (atomic) — Semantic evidence identity unchanged; source artifact/provenance moved. Informational / frontend-only — not an API change.
  * — `/api/v3/payment/method/add` · from `url_template:-:/api/v3/payment/method/add:template_literal` · to `url_template:-:/api/v3/payment/method/add:template_literal` · @ js/C28j6yuy.js
* **`provenance_moved`** (atomic) — Semantic evidence identity unchanged; source artifact/provenance moved. Informational / frontend-only — not an API change.
  * — `/api/v3/payment/method/delete` · from `url_template:-:/api/v3/payment/method/delete:template_literal` · to `url_template:-:/api/v3/payment/method/delete:template_literal` · @ js/C28j6yuy.js
* **`provenance_moved`** (atomic) — Semantic evidence identity unchanged; source artifact/provenance moved. Informational / frontend-only — not an API change.
  * — `/api/v3/payment/method/list` · from `url_template:-:/api/v3/payment/method/list:template_literal` · to `url_template:-:/api/v3/payment/method/list:template_literal` · @ js/C28j6yuy.js
* **`provenance_moved`** (atomic) — Semantic evidence identity unchanged; source artifact/provenance moved. Informational / frontend-only — not an API change.
  * — `/api/v3/payment/method/set` · from `url_template:-:/api/v3/payment/method/set:template_literal` · to `url_template:-:/api/v3/payment/method/set:template_literal` · @ js/C28j6yuy.js
* **`provenance_moved`** (atomic) — Semantic evidence identity unchanged; source artifact/provenance moved. Informational / frontend-only — not an API change.
  * — `/api/v3/payment/setup-intents` · from `url_template:-:/api/v3/payment/setup-intents:template_literal` · to `url_template:-:/api/v3/payment/setup-intents:template_literal` · @ js/C28j6yuy.js
* **`provenance_moved`** (atomic) — Semantic evidence identity unchanged; source artifact/provenance moved. Informational / frontend-only — not an API change.
  * — `/api/v3/payment/stripe/checkout` · from `url_template:-:/api/v3/payment/stripe/checkout:template_literal` · to `url_template:-:/api/v3/payment/stripe/checkout:template_literal` · @ js/C28j6yuy.js
* **`provenance_moved`** (atomic) — Semantic evidence identity unchanged; source artifact/provenance moved. Informational / frontend-only — not an API change.
  * — `/api/v3/payment/stripe/manage` · from `url_template:-:/api/v3/payment/stripe/manage:template_literal` · to `url_template:-:/api/v3/payment/stripe/manage:template_literal` · @ js/C28j6yuy.js
* **`provenance_moved`** (atomic) — Semantic evidence identity unchanged; source artifact/provenance moved. Informational / frontend-only — not an API change.
  * — `/api/v3/payment/stripe/pk` · from `url_template:-:/api/v3/payment/stripe/pk:template_literal` · to `url_template:-:/api/v3/payment/stripe/pk:template_literal` · @ js/C28j6yuy.js
* **`provenance_moved`** (atomic) — Semantic evidence identity unchanged; source artifact/provenance moved. Informational / frontend-only — not an API change.
  * — `/api/v3/payment/stripe/products` · from `url_template:-:/api/v3/payment/stripe/products:template_literal` · to `url_template:-:/api/v3/payment/stripe/products:template_literal` · @ js/C28j6yuy.js
* **`provenance_moved`** (atomic) — Semantic evidence identity unchanged; source artifact/provenance moved. Informational / frontend-only — not an API change.
  * — `/api/v3/payment/stripe/subscription` · from `url_template:-:/api/v3/payment/stripe/subscription:template_literal` · to `url_template:-:/api/v3/payment/stripe/subscription:template_literal` · @ js/C28j6yuy.js
* **`provenance_moved`** (atomic) — Semantic evidence identity unchanged; source artifact/provenance moved. Informational / frontend-only — not an API change.
  * — `/api/v3/payment/stripe/webhook` · from `url_template:-:/api/v3/payment/stripe/webhook:template_literal` · to `url_template:-:/api/v3/payment/stripe/webhook:template_literal` · @ js/C28j6yuy.js
* **`provenance_moved`** (atomic) — Semantic evidence identity unchanged; source artifact/provenance moved. Informational / frontend-only — not an API change.
  * — `/api/v3/payment/subscription/cancel-renew-change` · from `url_template:-:/api/v3/payment/subscription/cancel-renew-change:template_literal` · to `url_template:-:/api/v3/payment/subscription/cancel-renew-change:template_literal` · @ js/C28j6yuy.js
* **`provenance_moved`** (atomic) — Semantic evidence identity unchanged; source artifact/provenance moved. Informational / frontend-only — not an API change.
  * — `/api/v3/payment/subscription/cancel` · from `url_template:-:/api/v3/payment/subscription/cancel:template_literal` · to `url_template:-:/api/v3/payment/subscription/cancel:template_literal` · @ js/C28j6yuy.js
* **`provenance_moved`** (atomic) — Semantic evidence identity unchanged; source artifact/provenance moved. Informational / frontend-only — not an API change.
  * — `/api/v3/payment/subscription/change` · from `url_template:-:/api/v3/payment/subscription/change:template_literal` · to `url_template:-:/api/v3/payment/subscription/change:template_literal` · @ js/C28j6yuy.js
* **`provenance_moved`** (atomic) — Semantic evidence identity unchanged; source artifact/provenance moved. Informational / frontend-only — not an API change.
  * — `/api/v3/payment/subscription/purchase` · from `url_template:-:/api/v3/payment/subscription/purchase:template_literal` · to `url_template:-:/api/v3/payment/subscription/purchase:template_literal` · @ js/C28j6yuy.js
* **`provenance_moved`** (atomic) — Semantic evidence identity unchanged; source artifact/provenance moved. Informational / frontend-only — not an API change.
  * — `/api/v3/payment/subscription/uncancel` · from `url_template:-:/api/v3/payment/subscription/uncancel:template_literal` · to `url_template:-:/api/v3/payment/subscription/uncancel:template_literal` · @ js/C28j6yuy.js
* **`provenance_moved`** (atomic) — Semantic evidence identity unchanged; source artifact/provenance moved. Informational / frontend-only — not an API change.
  * — `/api/v3/payment/tax/estimate` · from `url_template:-:/api/v3/payment/tax/estimate:template_literal` · to `url_template:-:/api/v3/payment/tax/estimate:template_literal` · @ js/C28j6yuy.js
* **`provenance_moved`** (atomic) — Semantic evidence identity unchanged; source artifact/provenance moved. Informational / frontend-only — not an API change.
  * — `/api/v3/payment/webhook/{paymentProcessor}` · from `url_template:-:/api/v3/payment/webhook/{paymentProcessor}:template_literal` · to `url_template:-:/api/v3/payment/webhook/{paymentProcessor}:template_literal` · @ js/C28j6yuy.js
* **`provenance_moved`** (atomic) — Semantic evidence identity unchanged; source artifact/provenance moved. Informational / frontend-only — not an API change.
  * — `/api/v3/payment/webhook/{paymentProcessor}/{subPaymentProcessor}` · from `url_template:-:/api/v3/payment/webhook/{paymentProcessor}/{subPaymentProcessor}:template_literal` · to `url_template:-:/api/v3/payment/webhook/{paymentProcessor}/{subPaymentProcessor}:template_literal` · @ js/C28j6yuy.js
* **`provenance_moved`** (atomic) — Semantic evidence identity unchanged; source artifact/provenance moved. Informational / frontend-only — not an API change.
  * — `/api/v3/plan/content` · from `url_template:-:/api/v3/plan/content:template_literal` · to `url_template:-:/api/v3/plan/content:template_literal` · @ js/C28j6yuy.js
* **`provenance_moved`** (atomic) — Semantic evidence identity unchanged; source artifact/provenance moved. Informational / frontend-only — not an API change.
  * — `/api/v3/plan/info` · from `url_template:-:/api/v3/plan/info:template_literal` · to `url_template:-:/api/v3/plan/info:template_literal` · @ js/C28j6yuy.js
* **`provenance_moved`** (atomic) — Semantic evidence identity unchanged; source artifact/provenance moved. Informational / frontend-only — not an API change.
  * — `/api/v3/poll/close` · from `url_template:-:/api/v3/poll/close:template_literal` · to `url_template:-:/api/v3/poll/close:template_literal` · @ js/C28j6yuy.js
* **`provenance_moved`** (atomic) — Semantic evidence identity unchanged; source artifact/provenance moved. Informational / frontend-only — not an API change.
  * — `/api/v3/poll/cms/list` · from `url_template:-:/api/v3/poll/cms/list:template_literal` · to `url_template:-:/api/v3/poll/cms/list:template_literal` · @ js/C28j6yuy.js
* **`provenance_moved`** (atomic) — Semantic evidence identity unchanged; source artifact/provenance moved. Informational / frontend-only — not an API change.
  * — `/api/v3/poll/live/create` · from `url_template:-:/api/v3/poll/live/create:template_literal` · to `url_template:-:/api/v3/poll/live/create:template_literal` · @ js/C28j6yuy.js
* **`provenance_moved`** (atomic) — Semantic evidence identity unchanged; source artifact/provenance moved. Informational / frontend-only — not an API change.
  * — `/api/v3/poll/live/joinroom` · from `url_template:-:/api/v3/poll/live/joinroom:template_literal` · to `url_template:-:/api/v3/poll/live/joinroom:template_literal` · @ js/C28j6yuy.js
* **`provenance_moved`** (atomic) — Semantic evidence identity unchanged; source artifact/provenance moved. Informational / frontend-only — not an API change.
  * — `/api/v3/poll/live/joinroommoderator` · from `url_template:-:/api/v3/poll/live/joinroommoderator:template_literal` · to `url_template:-:/api/v3/poll/live/joinroommoderator:template_literal` · @ js/C28j6yuy.js
* **`provenance_moved`** (atomic) — Semantic evidence identity unchanged; source artifact/provenance moved. Informational / frontend-only — not an API change.
  * — `/api/v3/poll/live/leaveroom` · from `url_template:-:/api/v3/poll/live/leaveroom:template_literal` · to `url_template:-:/api/v3/poll/live/leaveroom:template_literal` · @ js/C28j6yuy.js
* **`provenance_moved`** (atomic) — Semantic evidence identity unchanged; source artifact/provenance moved. Informational / frontend-only — not an API change.
  * — `/api/v3/poll/live/leaveroommoderator` · from `url_template:-:/api/v3/poll/live/leaveroommoderator:template_literal` · to `url_template:-:/api/v3/poll/live/leaveroommoderator:template_literal` · @ js/C28j6yuy.js
* **`provenance_moved`** (atomic) — Semantic evidence identity unchanged; source artifact/provenance moved. Informational / frontend-only — not an API change.
  * — `/api/v3/poll/tk/live/joinroom` · from `url_template:-:/api/v3/poll/tk/live/joinroom:template_literal` · to `url_template:-:/api/v3/poll/tk/live/joinroom:template_literal` · @ js/C28j6yuy.js
* **`provenance_moved`** (atomic) — Semantic evidence identity unchanged; source artifact/provenance moved. Informational / frontend-only — not an API change.
  * — `/api/v3/poll/tk/live/leaveroom` · from `url_template:-:/api/v3/poll/tk/live/leaveroom:template_literal` · to `url_template:-:/api/v3/poll/tk/live/leaveroom:template_literal` · @ js/C28j6yuy.js
* **`provenance_moved`** (atomic) — Semantic evidence identity unchanged; source artifact/provenance moved. Informational / frontend-only — not an API change.
  * — `/api/v3/poll/vote` · from `url_template:-:/api/v3/poll/vote:template_literal` · to `url_template:-:/api/v3/poll/vote:template_literal` · @ js/C28j6yuy.js
* **`provenance_moved`** (atomic) — Semantic evidence identity unchanged; source artifact/provenance moved. Informational / frontend-only — not an API change.
  * — `/api/v3/promotion/claim` · from `url_template:-:/api/v3/promotion/claim:template_literal` · to `url_template:-:/api/v3/promotion/claim:template_literal` · @ js/C28j6yuy.js
* **`provenance_moved`** (atomic) — Semantic evidence identity unchanged; source artifact/provenance moved. Informational / frontend-only — not an API change.
  * — `/api/v3/promotion/list` · from `url_template:-:/api/v3/promotion/list:template_literal` · to `url_template:-:/api/v3/promotion/list:template_literal` · @ js/C28j6yuy.js
* **`provenance_moved`** (atomic) — Semantic evidence identity unchanged; source artifact/provenance moved. Informational / frontend-only — not an API change.
  * — `/api/v3/push/web/info` · from `url_template:-:/api/v3/push/web/info:template_literal` · to `url_template:-:/api/v3/push/web/info:template_literal` · @ js/C28j6yuy.js
* **`provenance_moved`** (atomic) — Semantic evidence identity unchanged; source artifact/provenance moved. Informational / frontend-only — not an API change.
  * — `/api/v3/push/web/register` · from `url_template:-:/api/v3/push/web/register:template_literal` · to `url_template:-:/api/v3/push/web/register:template_literal` · @ js/C28j6yuy.js
* **`provenance_moved`** (atomic) — Semantic evidence identity unchanged; source artifact/provenance moved. Informational / frontend-only — not an API change.
  * — `/api/v3/push/web/revoke` · from `url_template:-:/api/v3/push/web/revoke:template_literal` · to `url_template:-:/api/v3/push/web/revoke:template_literal` · @ js/C28j6yuy.js
* **`provenance_moved`** (atomic) — Semantic evidence identity unchanged; source artifact/provenance moved. Informational / frontend-only — not an API change.
  * — `/api/v3/shopify/multipass` · from `url_template:-:/api/v3/shopify/multipass:template_literal` · to `url_template:-:/api/v3/shopify/multipass:template_literal` · @ js/C28j6yuy.js
* **`provenance_moved`** (atomic) — Semantic evidence identity unchanged; source artifact/provenance moved. Informational / frontend-only — not an API change.
  * — `/api/v3/shopify/verify` · from `url_template:-:/api/v3/shopify/verify:template_literal` · to `url_template:-:/api/v3/shopify/verify:template_literal` · @ js/C28j6yuy.js
* **`provenance_moved`** (atomic) — Semantic evidence identity unchanged; source artifact/provenance moved. Informational / frontend-only — not an API change.
  * — `/api/v3/status` · from `url_template:-:/api/v3/status:template_literal` · to `url_template:-:/api/v3/status:template_literal` · @ js/C28j6yuy.js
* **`provenance_moved`** (atomic) — Semantic evidence identity unchanged; source artifact/provenance moved. Informational / frontend-only — not an API change.
  * — `/api/v3/support` · from `url_template:-:/api/v3/support:template_literal` · to `url_template:-:/api/v3/support:template_literal` · @ js/C28j6yuy.js
* **`provenance_moved`** (atomic) — Semantic evidence identity unchanged; source artifact/provenance moved. Informational / frontend-only — not an API change.
  * — `/api/v3/support/ticket/types` · from `url_template:-:/api/v3/support/ticket/types:template_literal` · to `url_template:-:/api/v3/support/ticket/types:template_literal` · @ js/C28j6yuy.js
* **`provenance_moved`** (atomic) — Semantic evidence identity unchanged; source artifact/provenance moved. Informational / frontend-only — not an API change.
  * — `/api/v3/survey` · from `url_template:-:/api/v3/survey:template_literal` · to `url_template:-:/api/v3/survey:template_literal` · @ js/C28j6yuy.js
* **`provenance_moved`** (atomic) — Semantic evidence identity unchanged; source artifact/provenance moved. Informational / frontend-only — not an API change.
  * — `/api/v3/survey/questions` · from `url_template:-:/api/v3/survey/questions:template_literal` · to `url_template:-:/api/v3/survey/questions:template_literal` · @ js/C28j6yuy.js
* **`provenance_moved`** (atomic) — Semantic evidence identity unchanged; source artifact/provenance moved. Informational / frontend-only — not an API change.
  * — `/api/v3/user` · from `url_template:-:/api/v3/user:template_literal` · to `url_template:-:/api/v3/user:template_literal` · @ js/C28j6yuy.js
* **`provenance_moved`** (atomic) — Semantic evidence identity unchanged; source artifact/provenance moved. Informational / frontend-only — not an API change.
  * — `/api/v3/user/achievement` · from `url_template:-:/api/v3/user/achievement:template_literal` · to `url_template:-:/api/v3/user/achievement:template_literal` · @ js/C28j6yuy.js
* **`provenance_moved`** (atomic) — Semantic evidence identity unchanged; source artifact/provenance moved. Informational / frontend-only — not an API change.
  * — `/api/v3/user/achievement/badges` · from `url_template:-:/api/v3/user/achievement/badges:template_literal` · to `url_template:-:/api/v3/user/achievement/badges:template_literal` · @ js/C28j6yuy.js
* **`provenance_moved`** (atomic) — Semantic evidence identity unchanged; source artifact/provenance moved. Informational / frontend-only — not an API change.
  * — `/api/v3/user/achievement/perks` · from `url_template:-:/api/v3/user/achievement/perks:template_literal` · to `url_template:-:/api/v3/user/achievement/perks:template_literal` · @ js/C28j6yuy.js
* **`provenance_moved`** (atomic) — Semantic evidence identity unchanged; source artifact/provenance moved. Informational / frontend-only — not an API change.
  * — `/api/v3/user/achievement/perks/list` · from `url_template:-:/api/v3/user/achievement/perks/list:template_literal` · to `url_template:-:/api/v3/user/achievement/perks/list:template_literal` · @ js/C28j6yuy.js
* **`provenance_moved`** (atomic) — Semantic evidence identity unchanged; source artifact/provenance moved. Informational / frontend-only — not an API change.
  * — `/api/v3/user/activity` · from `url_template:-:/api/v3/user/activity:template_literal` · to `url_template:-:/api/v3/user/activity:template_literal` · @ js/C28j6yuy.js
* **`provenance_moved`** (atomic) — Semantic evidence identity unchanged; source artifact/provenance moved. Informational / frontend-only — not an API change.
  * — `/api/v3/user/avatar` · from `url_template:-:/api/v3/user/avatar:template_literal` · to `url_template:-:/api/v3/user/avatar:template_literal` · @ js/C28j6yuy.js
* **`provenance_moved`** (atomic) — Semantic evidence identity unchanged; source artifact/provenance moved. Informational / frontend-only — not an API change.
  * — `/api/v3/user/ban/status` · from `url_template:-:/api/v3/user/ban/status:template_literal` · to `url_template:-:/api/v3/user/ban/status:template_literal` · @ js/C28j6yuy.js
* **`provenance_moved`** (atomic) — Semantic evidence identity unchanged; source artifact/provenance moved. Informational / frontend-only — not an API change.
  * — `/api/v3/user/creator` · from `url_template:-:/api/v3/user/creator:template_literal` · to `url_template:-:/api/v3/user/creator:template_literal` · @ js/C28j6yuy.js
* **`provenance_moved`** (atomic) — Semantic evidence identity unchanged; source artifact/provenance moved. Informational / frontend-only — not an API change.
  * — `/api/v3/user/delete` · from `url_template:-:/api/v3/user/delete:template_literal` · to `url_template:-:/api/v3/user/delete:template_literal` · @ js/C28j6yuy.js
* **`provenance_moved`** (atomic) — Semantic evidence identity unchanged; source artifact/provenance moved. Informational / frontend-only — not an API change.
  * — `/api/v3/user/email/update` · from `url_template:-:/api/v3/user/email/update:template_literal` · to `url_template:-:/api/v3/user/email/update:template_literal` · @ js/C28j6yuy.js
* **`provenance_moved`** (atomic) — Semantic evidence identity unchanged; source artifact/provenance moved. Informational / frontend-only — not an API change.
  * — `/api/v3/user/email/update/complete` · from `url_template:-:/api/v3/user/email/update/complete:template_literal` · to `url_template:-:/api/v3/user/email/update/complete:template_literal` · @ js/C28j6yuy.js
* **`provenance_moved`** (atomic) — Semantic evidence identity unchanged; source artifact/provenance moved. Informational / frontend-only — not an API change.
  * — `/api/v3/user/info` · from `url_template:-:/api/v3/user/info:template_literal` · to `url_template:-:/api/v3/user/info:template_literal` · @ js/C28j6yuy.js
* **`provenance_moved`** (atomic) — Semantic evidence identity unchanged; source artifact/provenance moved. Informational / frontend-only — not an API change.
  * — `/api/v3/user/multi` · from `url_template:-:/api/v3/user/multi:template_literal` · to `url_template:-:/api/v3/user/multi:template_literal` · @ js/C28j6yuy.js
* **`provenance_moved`** (atomic) — Semantic evidence identity unchanged; source artifact/provenance moved. Informational / frontend-only — not an API change.
  * — `/api/v3/user/named` · from `url_template:-:/api/v3/user/named:template_literal` · to `url_template:-:/api/v3/user/named:template_literal` · @ js/C28j6yuy.js
* **`provenance_moved`** (atomic) — Semantic evidence identity unchanged; source artifact/provenance moved. Informational / frontend-only — not an API change.
  * — `/api/v3/user/notification/channels` · from `url_template:-:/api/v3/user/notification/channels:template_literal` · to `url_template:-:/api/v3/user/notification/channels:template_literal` · @ js/C28j6yuy.js
* **`provenance_moved`** (atomic) — Semantic evidence identity unchanged; source artifact/provenance moved. Informational / frontend-only — not an API change.
  * — `/api/v3/user/notification/channels/list` · from `url_template:-:/api/v3/user/notification/channels/list:template_literal` · to `url_template:-:/api/v3/user/notification/channels/list:template_literal` · @ js/C28j6yuy.js
* **`provenance_moved`** (atomic) — Semantic evidence identity unchanged; source artifact/provenance moved. Informational / frontend-only — not an API change.
  * — `/api/v3/user/notification/digest` · from `url_template:-:/api/v3/user/notification/digest:template_literal` · to `url_template:-:/api/v3/user/notification/digest:template_literal` · @ js/C28j6yuy.js
* **`provenance_moved`** (atomic) — Semantic evidence identity unchanged; source artifact/provenance moved. Informational / frontend-only — not an API change.
  * — `/api/v3/user/notification/email` · from `url_template:-:/api/v3/user/notification/email:template_literal` · to `url_template:-:/api/v3/user/notification/email:template_literal` · @ js/C28j6yuy.js
* **`provenance_moved`** (atomic) — Semantic evidence identity unchanged; source artifact/provenance moved. Informational / frontend-only — not an API change.
  * — `/api/v3/user/notification/list` · from `url_template:-:/api/v3/user/notification/list:template_literal` · to `url_template:-:/api/v3/user/notification/list:template_literal` · @ js/C28j6yuy.js
* **`provenance_moved`** (atomic) — Semantic evidence identity unchanged; source artifact/provenance moved. Informational / frontend-only — not an API change.
  * — `/api/v3/user/notification/update` · from `url_template:-:/api/v3/user/notification/update:template_literal` · to `url_template:-:/api/v3/user/notification/update:template_literal` · @ js/C28j6yuy.js
* **`provenance_moved`** (atomic) — Semantic evidence identity unchanged; source artifact/provenance moved. Informational / frontend-only — not an API change.
  * — `/api/v3/user/password/change` · from `url_template:-:/api/v3/user/password/change:template_literal` · to `url_template:-:/api/v3/user/password/change:template_literal` · @ js/C28j6yuy.js
* **`provenance_moved`** (atomic) — Semantic evidence identity unchanged; source artifact/provenance moved. Informational / frontend-only — not an API change.
  * — `/api/v3/user/password/reset` · from `url_template:-:/api/v3/user/password/reset:template_literal` · to `url_template:-:/api/v3/user/password/reset:template_literal` · @ js/C28j6yuy.js
* **`provenance_moved`** (atomic) — Semantic evidence identity unchanged; source artifact/provenance moved. Informational / frontend-only — not an API change.
  * — `/api/v3/user/password/reset/request` · from `url_template:-:/api/v3/user/password/reset/request:template_literal` · to `url_template:-:/api/v3/user/password/reset/request:template_literal` · @ js/C28j6yuy.js
* **`provenance_moved`** (atomic) — Semantic evidence identity unchanged; source artifact/provenance moved. Informational / frontend-only — not an API change.
  * — `/api/v3/user/password/reset/validate` · from `url_template:-:/api/v3/user/password/reset/validate:template_literal` · to `url_template:-:/api/v3/user/password/reset/validate:template_literal` · @ js/C28j6yuy.js
* **`provenance_moved`** (atomic) — Semantic evidence identity unchanged; source artifact/provenance moved. Informational / frontend-only — not an API change.
  * — `/api/v3/user/security` · from `url_template:-:/api/v3/user/security:template_literal` · to `url_template:-:/api/v3/user/security:template_literal` · @ js/C28j6yuy.js
* **`provenance_moved`** (atomic) — Semantic evidence identity unchanged; source artifact/provenance moved. Informational / frontend-only — not an API change.
  * — `/api/v3/user/security/2fa` · from `url_template:-:/api/v3/user/security/2fa:template_literal` · to `url_template:-:/api/v3/user/security/2fa:template_literal` · @ js/C28j6yuy.js
* **`provenance_moved`** (atomic) — Semantic evidence identity unchanged; source artifact/provenance moved. Informational / frontend-only — not an API change.
  * — `/api/v3/user/security/2fa/activate` · from `url_template:-:/api/v3/user/security/2fa/activate:template_literal` · to `url_template:-:/api/v3/user/security/2fa/activate:template_literal` · @ js/C28j6yuy.js
* **`provenance_moved`** (atomic) — Semantic evidence identity unchanged; source artifact/provenance moved. Informational / frontend-only — not an API change.
  * — `/api/v3/user/security/2fa/deactivate` · from `url_template:-:/api/v3/user/security/2fa/deactivate:template_literal` · to `url_template:-:/api/v3/user/security/2fa/deactivate:template_literal` · @ js/C28j6yuy.js
* **`provenance_moved`** (atomic) — Semantic evidence identity unchanged; source artifact/provenance moved. Informational / frontend-only — not an API change.
  * — `/api/v3/user/security/backupcode` · from `url_template:-:/api/v3/user/security/backupcode:template_literal` · to `url_template:-:/api/v3/user/security/backupcode:template_literal` · @ js/C28j6yuy.js
* **`provenance_moved`** (atomic) — Semantic evidence identity unchanged; source artifact/provenance moved. Informational / frontend-only — not an API change.
  * — `/api/v3/user/security/backupcode/activate` · from `url_template:-:/api/v3/user/security/backupcode/activate:template_literal` · to `url_template:-:/api/v3/user/security/backupcode/activate:template_literal` · @ js/C28j6yuy.js
* **`provenance_moved`** (atomic) — Semantic evidence identity unchanged; source artifact/provenance moved. Informational / frontend-only — not an API change.
  * — `/api/v3/user/security/backupcode/deactivate` · from `url_template:-:/api/v3/user/security/backupcode/deactivate:template_literal` · to `url_template:-:/api/v3/user/security/backupcode/deactivate:template_literal` · @ js/C28j6yuy.js
* **`provenance_moved`** (atomic) — Semantic evidence identity unchanged; source artifact/provenance moved. Informational / frontend-only — not an API change.
  * — `/api/v3/user/self` · from `url_template:-:/api/v3/user/self:template_literal` · to `url_template:-:/api/v3/user/self:template_literal` · @ js/C28j6yuy.js
* **`provenance_moved`** (atomic) — Semantic evidence identity unchanged; source artifact/provenance moved. Informational / frontend-only — not an API change.
  * — `/api/v3/user/subscribed` · from `url_template:-:/api/v3/user/subscribed:template_literal` · to `url_template:-:/api/v3/user/subscribed:template_literal` · @ js/C28j6yuy.js
* **`provenance_moved`** (atomic) — Semantic evidence identity unchanged; source artifact/provenance moved. Informational / frontend-only — not an API change.
  * — `/api/v3/user/subscriptions` · from `url_template:-:/api/v3/user/subscriptions:template_literal` · to `url_template:-:/api/v3/user/subscriptions:template_literal` · @ js/C28j6yuy.js
* **`provenance_moved`** (atomic) — Semantic evidence identity unchanged; source artifact/provenance moved. Informational / frontend-only — not an API change.
  * — `/api/v3/user/undelete` · from `url_template:-:/api/v3/user/undelete:template_literal` · to `url_template:-:/api/v3/user/undelete:template_literal` · @ js/C28j6yuy.js
* **`provenance_moved`** (atomic) — Semantic evidence identity unchanged; source artifact/provenance moved. Informational / frontend-only — not an API change.
  * — `/api/v3/user/update` · from `url_template:-:/api/v3/user/update:template_literal` · to `url_template:-:/api/v3/user/update:template_literal` · @ js/C28j6yuy.js
* **`provenance_moved`** (atomic) — Semantic evidence identity unchanged; source artifact/provenance moved. Informational / frontend-only — not an API change.
  * — `/api/v3/user/username/available` · from `url_template:-:/api/v3/user/username/available:template_literal` · to `url_template:-:/api/v3/user/username/available:template_literal` · @ js/C28j6yuy.js

## Suppressed / indeterminate

_None._

## Warnings / limitations

* (none)

* Comparator: `phase2.2-frontend-evidence-diff@2.2.1` (schema v2)
* Frontend-evidence change report only. Not an authoritative server API changelog. Do not treat structured_operation_disappeared as API removal without a later verification phase. method_set_changed is a derived grouping of atomic method+path facts — do not triple-count with add/disappear.

