# Floatplane Frontend API Evidence Changes

From:
`4.5.25-340-92712da / 8cb81ec3d78e7025ca3787339bbc744b0d42e4daf8a94cbba40e934cf3cb8963`

To:
`4.5.26-355-797bc04 / 9bd17ba3da58ea60a631404586a462d83e3d6f607506eeab07908f88d404e4f1`

> **Label:** real archived Floatplane observations.

_Frontend-evidence change report only. **Not** an authoritative server API changelog._

## Extraction status

| Side | Observation | Build | Closure status | refuseRemoval | completeEnough |
| ---- | ----------- | ----- | -------------- | ------------- | -------------- |
| From | `8cb81ec3d78e…` | `4.5.25-340-92712da` | `complete_with_external_rejects` | false | true |
| To | `9bd17ba3da58…` | `4.5.26-355-797bc04` | `complete_with_external_rejects` | false | true |

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
* Auth/header evidence changes: **22**
* Response mapper changes: **0**
* Realtime evidence changes: **5**
* Weaker references added: **369**; disappeared: **12**
* Frontend-only / provenance movement: **10**
* Atomic total: **418**

### Derived (grouped — do not triple-count with atomic)

* Method-set changes: **0** (derived from atomic method+path add/disappear on the same path)
* Derived total: **0**

* Authoritative emitted changes (atomic + derived): **418**
* Suppressed (indeterminate) conclusions: **0** — not in authoritative totals

## Structured operation changes (atomic + derived)

_None._

## Request behavior changes

_None._

## Authentication/header changes

* **`auth_evidence_changed`** (atomic) — Frontend authentication/header-related evidence disappeared. Not proof the server dropped an auth requirement.
  * — `/api/authxml` · from `network_reference:-:/api/authxml:string_literal_api` · @ js/TfN8-Zm-.js
* **`auth_evidence_changed`** (atomic) — Frontend authentication/header-related evidence disappeared. Not proof the server dropped an auth requirement.
  * — `/api/v3/auth/keycloak/migration/login/{username_or_email}` · from `network_reference:-:/api/v3/auth/keycloak/migration/login/{username_or_email}:string_literal_api` · @ js/index-DaEmRTqt.js
* **`auth_evidence_changed`** (atomic) — Frontend authentication/header-related evidence disappeared. Not proof the server dropped an auth requirement.
  * — `/api/v3/connect/{site}` · from `network_reference:-:/api/v3/connect/{site}:string_literal_api` · @ js/index-DaEmRTqt.js
* **`auth_evidence_changed`** (atomic) — Frontend authentication/header-related evidence disappeared. Not proof the server dropped an auth requirement.
  * — `/api/v3/connect/{site}/callback` · from `network_reference:-:/api/v3/connect/{site}/callback:string_literal_api` · @ js/index-DaEmRTqt.js
* **`auth_evidence_changed`** (atomic) — Frontend authentication/header-related evidence appeared. Phrase as frontend behavior, not a server auth requirement.
  * — `/api/authxml` · to `url_template:-:/api/authxml:template_literal` · @ js/Cb3DAr7Y.js
* **`auth_evidence_changed`** (atomic) — Frontend authentication/header-related evidence appeared. Phrase as frontend behavior, not a server auth requirement.
  * — `/api/v3/auth/captcha/info` · to `url_template:-:/api/v3/auth/captcha/info:template_literal` · @ js/index-Dxy9c0et.js
* **`auth_evidence_changed`** (atomic) — Frontend authentication/header-related evidence appeared. Phrase as frontend behavior, not a server auth requirement.
  * — `/api/v3/auth/checkFor2faLogin` · to `url_template:-:/api/v3/auth/checkFor2faLogin:template_literal` · @ js/index-Dxy9c0et.js
* **`auth_evidence_changed`** (atomic) — Frontend authentication/header-related evidence appeared. Phrase as frontend behavior, not a server auth requirement.
  * — `/api/v3/auth/keycloak/migration/login/{username_or_email_or_userid}` · to `url_template:-:/api/v3/auth/keycloak/migration/login/{username_or_email_or_userid}:template_literal` · @ js/index-Dxy9c0et.js
* **`auth_evidence_changed`** (atomic) — Frontend authentication/header-related evidence appeared. Phrase as frontend behavior, not a server auth requirement.
  * — `/api/v3/auth/keycloak/migration/login/{username_or_email}` · to `url_template:-:/api/v3/auth/keycloak/migration/login/{username_or_email}:template_literal` · @ js/index-Dxy9c0et.js
* **`auth_evidence_changed`** (atomic) — Frontend authentication/header-related evidence appeared. Phrase as frontend behavior, not a server auth requirement.
  * — `/api/v3/auth/login` · to `url_template:-:/api/v3/auth/login:template_literal` · @ js/index-Dxy9c0et.js
* **`auth_evidence_changed`** (atomic) — Frontend authentication/header-related evidence appeared. Phrase as frontend behavior, not a server auth requirement.
  * — `/api/v3/auth/logout` · to `url_template:-:/api/v3/auth/logout:template_literal` · @ js/index-Dxy9c0et.js
* **`auth_evidence_changed`** (atomic) — Frontend authentication/header-related evidence appeared. Phrase as frontend behavior, not a server auth requirement.
  * — `/api/v3/auth/signup` · to `url_template:-:/api/v3/auth/signup:template_literal` · @ js/index-Dxy9c0et.js
* **`auth_evidence_changed`** (atomic) — Frontend authentication/header-related evidence appeared. Phrase as frontend behavior, not a server auth requirement.
  * — `/api/v3/auth/spoof/begin` · to `url_template:-:/api/v3/auth/spoof/begin:template_literal` · @ js/index-Dxy9c0et.js
* **`auth_evidence_changed`** (atomic) — Frontend authentication/header-related evidence appeared. Phrase as frontend behavior, not a server auth requirement.
  * — `/api/v3/auth/spoof/end` · to `url_template:-:/api/v3/auth/spoof/end:template_literal` · @ js/index-Dxy9c0et.js
* **`auth_evidence_changed`** (atomic) — Frontend authentication/header-related evidence appeared. Phrase as frontend behavior, not a server auth requirement.
  * — `/api/v3/connect/{site}` · to `url_template:-:/api/v3/connect/{site}:template_literal` · @ js/index-Dxy9c0et.js
* **`auth_evidence_changed`** (atomic) — Frontend authentication/header-related evidence appeared. Phrase as frontend behavior, not a server auth requirement.
  * — `/api/v3/connect/{site}/callback` · to `url_template:-:/api/v3/connect/{site}/callback:template_literal` · @ js/index-Dxy9c0et.js
* **`auth_evidence_changed`** (atomic) — Frontend authentication/header-related evidence appeared. Phrase as frontend behavior, not a server auth requirement.
  * — `/api/v3/connect/complete` · to `url_template:-:/api/v3/connect/complete:template_literal` · @ js/index-Dxy9c0et.js
* **`auth_evidence_changed`** (atomic) — Frontend authentication/header-related evidence appeared. Phrase as frontend behavior, not a server auth requirement.
  * — `/api/v3/connect/dissociate` · to `url_template:-:/api/v3/connect/dissociate:template_literal` · @ js/index-Dxy9c0et.js
* **`auth_evidence_changed`** (atomic) — Frontend authentication/header-related evidence appeared. Phrase as frontend behavior, not a server auth requirement.
  * — `/api/v3/connect/list` · to `url_template:-:/api/v3/connect/list:template_literal` · @ js/index-Dxy9c0et.js
* **`auth_evidence_changed`** (atomic) — Frontend authentication/header-related evidence appeared. Phrase as frontend behavior, not a server auth requirement.
  * — `/api/v3/connect/refresh` · to `url_template:-:/api/v3/connect/refresh:template_literal` · @ js/index-Dxy9c0et.js
* **`auth_evidence_changed`** (atomic) — Frontend authentication/header-related evidence appeared. Phrase as frontend behavior, not a server auth requirement.
  * — `/api/v3/socket/connect` · to `url_template:-:/api/v3/socket/connect:template_literal` · @ js/index-Dxy9c0et.js
* **`auth_evidence_changed`** (atomic) — Frontend authentication/header-related evidence appeared. Phrase as frontend behavior, not a server auth requirement.
  * — `/api/v3/socket/tk/connect` · to `url_template:-:/api/v3/socket/tk/connect:template_literal` · @ js/index-Dxy9c0et.js

## Response mapper changes

_None._

## Realtime changes

* **`realtime_evidence_changed`** (atomic) — Realtime evidence disappeared from the frontend inventory.
  * — `/` · from `realtime_operation:-:/:chat_socket_uri` · @ js/index-DaEmRTqt.js
* **`realtime_evidence_changed`** (atomic) — Realtime evidence disappeared from the frontend inventory.
  * POST `/api/v3/socket/connect` · from `realtime_operation:POST:/api/v3/socket/connect:sails_socket_post` · @ js/index-DaEmRTqt.js
* **`realtime_evidence_changed`** (atomic) — Realtime evidence disappeared from the frontend inventory.
  * POST `/api/v3/socket/disconnect` · from `realtime_operation:POST:/api/v3/socket/disconnect:sails_socket_post` · @ js/index-DaEmRTqt.js
* **`realtime_evidence_changed`** (atomic) — Realtime evidence disappeared from the frontend inventory.
  * POST `/api/v3/socket/tk/connect` · from `realtime_operation:POST:/api/v3/socket/tk/connect:sails_socket_post` · @ js/index-DaEmRTqt.js
* **`realtime_evidence_changed`** (atomic) — Realtime evidence disappeared from the frontend inventory.
  * POST `/api/v3/socket/tk/disconnect` · from `realtime_operation:POST:/api/v3/socket/tk/disconnect:sails_socket_post` · @ js/index-DaEmRTqt.js

## Weaker/ambiguous evidence

* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/acp/v3/achievement` · to `url_template:-:/api/acp/v3/achievement:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/acp/v3/achievement/award` · to `url_template:-:/api/acp/v3/achievement/award:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/acp/v3/achievement/create` · to `url_template:-:/api/acp/v3/achievement/create:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/acp/v3/achievement/create/multi-stage` · to `url_template:-:/api/acp/v3/achievement/create/multi-stage:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/acp/v3/achievement/delete` · to `url_template:-:/api/acp/v3/achievement/delete:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/acp/v3/achievement/list` · to `url_template:-:/api/acp/v3/achievement/list:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/acp/v3/achievement/perk` · to `url_template:-:/api/acp/v3/achievement/perk:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/acp/v3/achievement/perk/create` · to `url_template:-:/api/acp/v3/achievement/perk/create:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/acp/v3/achievement/perk/delete` · to `url_template:-:/api/acp/v3/achievement/perk/delete:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/acp/v3/achievement/perk/image/upload` · to `url_template:-:/api/acp/v3/achievement/perk/image/upload:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/acp/v3/achievement/perk/list` · to `url_template:-:/api/acp/v3/achievement/perk/list:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/acp/v3/achievement/perk/update` · to `url_template:-:/api/acp/v3/achievement/perk/update:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/acp/v3/achievement/strip` · to `url_template:-:/api/acp/v3/achievement/strip:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/acp/v3/achievement/update` · to `url_template:-:/api/acp/v3/achievement/update:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/acp/v3/agreement` · to `url_template:-:/api/acp/v3/agreement:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/acp/v3/agreement/create` · to `url_template:-:/api/acp/v3/agreement/create:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/acp/v3/agreement/list` · to `url_template:-:/api/acp/v3/agreement/list:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/acp/v3/agreement/update` · to `url_template:-:/api/acp/v3/agreement/update:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/acp/v3/blogPost` · to `url_template:-:/api/acp/v3/blogPost:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/acp/v3/blogPost/invalidateCache` · to `url_template:-:/api/acp/v3/blogPost/invalidateCache:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/acp/v3/blogPost/list` · to `url_template:-:/api/acp/v3/blogPost/list:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/acp/v3/blogPost/moveContent` · to `url_template:-:/api/acp/v3/blogPost/moveContent:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/acp/v3/blogPost/multi` · to `url_template:-:/api/acp/v3/blogPost/multi:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/acp/v3/channel` · to `url_template:-:/api/acp/v3/channel:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/acp/v3/channel/list` · to `url_template:-:/api/acp/v3/channel/list:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/acp/v3/channel/multi` · to `url_template:-:/api/acp/v3/channel/multi:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/acp/v3/chat/channel/list` · to `url_template:-:/api/acp/v3/chat/channel/list:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/acp/v3/chat/list` · to `url_template:-:/api/acp/v3/chat/list:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/acp/v3/content` · to `url_template:-:/api/acp/v3/content:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/acp/v3/content/invalidateCache` · to `url_template:-:/api/acp/v3/content/invalidateCache:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/acp/v3/content/list` · to `url_template:-:/api/acp/v3/content/list:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/acp/v3/content/multi` · to `url_template:-:/api/acp/v3/content/multi:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/acp/v3/creator` · to `url_template:-:/api/acp/v3/creator:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/acp/v3/creator/category` · to `url_template:-:/api/acp/v3/creator/category:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/acp/v3/creator/category/create` · to `url_template:-:/api/acp/v3/creator/category/create:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/acp/v3/creator/category/delete` · to `url_template:-:/api/acp/v3/creator/category/delete:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/acp/v3/creator/category/list` · to `url_template:-:/api/acp/v3/creator/category/list:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/acp/v3/creator/category/update` · to `url_template:-:/api/acp/v3/creator/category/update:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/acp/v3/creator/create` · to `url_template:-:/api/acp/v3/creator/create:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/acp/v3/creator/invalidateCache` · to `url_template:-:/api/acp/v3/creator/invalidateCache:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/acp/v3/creator/invite/create` · to `url_template:-:/api/acp/v3/creator/invite/create:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/acp/v3/creator/invite/list` · to `url_template:-:/api/acp/v3/creator/invite/list:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/acp/v3/creator/invite/update` · to `url_template:-:/api/acp/v3/creator/invite/update:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/acp/v3/creator/list` · to `url_template:-:/api/acp/v3/creator/list:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/acp/v3/creator/multi` · to `url_template:-:/api/acp/v3/creator/multi:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/acp/v3/creator/update` · to `url_template:-:/api/acp/v3/creator/update:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/acp/v3/creator/urlname/availability` · to `url_template:-:/api/acp/v3/creator/urlname/availability:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/acp/v3/faq` · to `url_template:-:/api/acp/v3/faq:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/acp/v3/faq/list` · to `url_template:-:/api/acp/v3/faq/list:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/acp/v3/ingest` · to `url_template:-:/api/acp/v3/ingest:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/acp/v3/ingest/delete` · to `url_template:-:/api/acp/v3/ingest/delete:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/acp/v3/ingest/list` · to `url_template:-:/api/acp/v3/ingest/list:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/acp/v3/ingest/multi` · to `url_template:-:/api/acp/v3/ingest/multi:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/acp/v3/ingest/start` · to `url_template:-:/api/acp/v3/ingest/start:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/acp/v3/ingest/stop` · to `url_template:-:/api/acp/v3/ingest/stop:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/acp/v3/ingest/update` · to `url_template:-:/api/acp/v3/ingest/update:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/acp/v3/invoice/mark-refunded` · to `url_template:-:/api/acp/v3/invoice/mark-refunded:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/acp/v3/invoice/user/list` · to `url_template:-:/api/acp/v3/invoice/user/list:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/acp/v3/invoice/user/processor` · to `url_template:-:/api/acp/v3/invoice/user/processor:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/acp/v3/job/start` · to `url_template:-:/api/acp/v3/job/start:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/acp/v3/job/status` · to `url_template:-:/api/acp/v3/job/status:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/acp/v3/job/stop` · to `url_template:-:/api/acp/v3/job/stop:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/acp/v3/moderator/create` · to `url_template:-:/api/acp/v3/moderator/create:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/acp/v3/moderator/creator/add` · to `url_template:-:/api/acp/v3/moderator/creator/add:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/acp/v3/moderator/creator/available` · to `url_template:-:/api/acp/v3/moderator/creator/available:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/acp/v3/moderator/creator/remove` · to `url_template:-:/api/acp/v3/moderator/creator/remove:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/acp/v3/moderator/list` · to `url_template:-:/api/acp/v3/moderator/list:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/acp/v3/moderator/update/global` · to `url_template:-:/api/acp/v3/moderator/update/global:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/acp/v3/plan` · to `url_template:-:/api/acp/v3/plan:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/acp/v3/plan/cost` · to `url_template:-:/api/acp/v3/plan/cost:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/acp/v3/plan/create` · to `url_template:-:/api/acp/v3/plan/create:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/acp/v3/plan/delete` · to `url_template:-:/api/acp/v3/plan/delete:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/acp/v3/plan/list` · to `url_template:-:/api/acp/v3/plan/list:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/acp/v3/plan/multi` · to `url_template:-:/api/acp/v3/plan/multi:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/acp/v3/plan/update` · to `url_template:-:/api/acp/v3/plan/update:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/acp/v3/promotion` · to `url_template:-:/api/acp/v3/promotion:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/acp/v3/promotion/delete` · to `url_template:-:/api/acp/v3/promotion/delete:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/acp/v3/promotion/list` · to `url_template:-:/api/acp/v3/promotion/list:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/acp/v3/promotion/multi` · to `url_template:-:/api/acp/v3/promotion/multi:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/acp/v3/promotion/types` · to `url_template:-:/api/acp/v3/promotion/types:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/acp/v3/promotion/unclaim` · to `url_template:-:/api/acp/v3/promotion/unclaim:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/acp/v3/promotion/update` · to `url_template:-:/api/acp/v3/promotion/update:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/acp/v3/service-message` · to `url_template:-:/api/acp/v3/service-message:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/acp/v3/service-message/create` · to `url_template:-:/api/acp/v3/service-message/create:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/acp/v3/service-message/delete` · to `url_template:-:/api/acp/v3/service-message/delete:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/acp/v3/service-message/list` · to `url_template:-:/api/acp/v3/service-message/list:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/acp/v3/service-message/update` · to `url_template:-:/api/acp/v3/service-message/update:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/acp/v3/survey/report` · to `url_template:-:/api/acp/v3/survey/report:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/acp/v3/transcode/start` · to `url_template:-:/api/acp/v3/transcode/start:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/acp/v3/transcode/update` · to `url_template:-:/api/acp/v3/transcode/update:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/acp/v3/upload` · to `url_template:-:/api/acp/v3/upload:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/acp/v3/upload/delete` · to `url_template:-:/api/acp/v3/upload/delete:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/acp/v3/upload/list` · to `url_template:-:/api/acp/v3/upload/list:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/acp/v3/user` · to `url_template:-:/api/acp/v3/user:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/acp/v3/user/achievement` · to `url_template:-:/api/acp/v3/user/achievement:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/acp/v3/user/administrator/update` · to `url_template:-:/api/acp/v3/user/administrator/update:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/acp/v3/user/avatar/upload` · to `url_template:-:/api/acp/v3/user/avatar/upload:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/acp/v3/user/comment/list` · to `url_template:-:/api/acp/v3/user/comment/list:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/acp/v3/user/create` · to `url_template:-:/api/acp/v3/user/create:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/acp/v3/user/delete` · to `url_template:-:/api/acp/v3/user/delete:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/acp/v3/user/email/availability` · to `url_template:-:/api/acp/v3/user/email/availability:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/acp/v3/user/export` · to `url_template:-:/api/acp/v3/user/export:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/acp/v3/user/list` · to `url_template:-:/api/acp/v3/user/list:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/acp/v3/user/password/reset/request` · to `url_template:-:/api/acp/v3/user/password/reset/request:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/acp/v3/user/subscription/create` · to `url_template:-:/api/acp/v3/user/subscription/create:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/acp/v3/user/subscription/delete` · to `url_template:-:/api/acp/v3/user/subscription/delete:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/acp/v3/user/undelete` · to `url_template:-:/api/acp/v3/user/undelete:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/acp/v3/user/update` · to `url_template:-:/api/acp/v3/user/update:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/acp/v3/user/username/availability` · to `url_template:-:/api/acp/v3/user/username/availability:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/authxml` · to `url_template:-:/api/authxml:template_literal` · @ js/Cb3DAr7Y.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/badges/download-on-the-app-store/black/en-us` · to `url_template:-:/api/badges/download-on-the-app-store/black/en-us:template_literal` · @ js/BOtyvcFW.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/cms/v3/achievement` · to `url_template:-:/api/cms/v3/achievement:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/cms/v3/achievement/award` · to `url_template:-:/api/cms/v3/achievement/award:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/cms/v3/achievement/create` · to `url_template:-:/api/cms/v3/achievement/create:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/cms/v3/achievement/create/progressive` · to `url_template:-:/api/cms/v3/achievement/create/progressive:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/cms/v3/achievement/delete` · to `url_template:-:/api/cms/v3/achievement/delete:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/cms/v3/achievement/list` · to `url_template:-:/api/cms/v3/achievement/list:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/cms/v3/achievement/perk` · to `url_template:-:/api/cms/v3/achievement/perk:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/cms/v3/achievement/perk/create` · to `url_template:-:/api/cms/v3/achievement/perk/create:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/cms/v3/achievement/perk/delete` · to `url_template:-:/api/cms/v3/achievement/perk/delete:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/cms/v3/achievement/perk/image/upload` · to `url_template:-:/api/cms/v3/achievement/perk/image/upload:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/cms/v3/achievement/perk/list` · to `url_template:-:/api/cms/v3/achievement/perk/list:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/cms/v3/achievement/perk/update` · to `url_template:-:/api/cms/v3/achievement/perk/update:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/cms/v3/achievement/strip` · to `url_template:-:/api/cms/v3/achievement/strip:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/cms/v3/achievement/update` · to `url_template:-:/api/cms/v3/achievement/update:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/cms/v3/blogPost` · to `url_template:-:/api/cms/v3/blogPost:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/cms/v3/blogPost/create` · to `url_template:-:/api/cms/v3/blogPost/create:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/cms/v3/blogPost/delete` · to `url_template:-:/api/cms/v3/blogPost/delete:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/cms/v3/blogPost/edit` · to `url_template:-:/api/cms/v3/blogPost/edit:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/cms/v3/blogPost/edit/bulk` · to `url_template:-:/api/cms/v3/blogPost/edit/bulk:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/cms/v3/blogPost/get` · to `url_template:-:/api/cms/v3/blogPost/get:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/cms/v3/blogPost/list` · to `url_template:-:/api/cms/v3/blogPost/list:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/cms/v3/blogPost/multi` · to `url_template:-:/api/cms/v3/blogPost/multi:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/cms/v3/chat/list` · to `url_template:-:/api/cms/v3/chat/list:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/cms/v3/comment/list` · to `url_template:-:/api/cms/v3/comment/list:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/cms/v3/content` · to `url_template:-:/api/cms/v3/content:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/cms/v3/content/audio` · to `url_template:-:/api/cms/v3/content/audio:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/cms/v3/content/audio/list` · to `url_template:-:/api/cms/v3/content/audio/list:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/cms/v3/content/bulk` · to `url_template:-:/api/cms/v3/content/bulk:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/cms/v3/content/delete` · to `url_template:-:/api/cms/v3/content/delete:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/cms/v3/content/delete/texttrack` · to `url_template:-:/api/cms/v3/content/delete/texttrack:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/cms/v3/content/edit` · to `url_template:-:/api/cms/v3/content/edit:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/cms/v3/content/move` · to `url_template:-:/api/cms/v3/content/move:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/cms/v3/content/picture` · to `url_template:-:/api/cms/v3/content/picture:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/cms/v3/content/picture/list` · to `url_template:-:/api/cms/v3/content/picture/list:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/cms/v3/content/upload/texttrack` · to `url_template:-:/api/cms/v3/content/upload/texttrack:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/cms/v3/content/video` · to `url_template:-:/api/cms/v3/content/video:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/cms/v3/content/video/list` · to `url_template:-:/api/cms/v3/content/video/list:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/cms/v3/creator` · to `url_template:-:/api/cms/v3/creator:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/cms/v3/creator/agreement` · to `url_template:-:/api/cms/v3/creator/agreement:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/cms/v3/creator/agreement/confirm` · to `url_template:-:/api/cms/v3/creator/agreement/confirm:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/cms/v3/creator/channel` · to `url_template:-:/api/cms/v3/creator/channel:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/cms/v3/creator/channels` · to `url_template:-:/api/cms/v3/creator/channels:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/cms/v3/creator/channels/default` · to `url_template:-:/api/cms/v3/creator/channels/default:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/cms/v3/creator/channels/delete` · to `url_template:-:/api/cms/v3/creator/channels/delete:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/cms/v3/creator/channels/image` · to `url_template:-:/api/cms/v3/creator/channels/image:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/cms/v3/creator/channels/list` · to `url_template:-:/api/cms/v3/creator/channels/list:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/cms/v3/creator/channels/reorder` · to `url_template:-:/api/cms/v3/creator/channels/reorder:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/cms/v3/creator/channels/social` · to `url_template:-:/api/cms/v3/creator/channels/social:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/cms/v3/creator/channels/update` · to `url_template:-:/api/cms/v3/creator/channels/update:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/cms/v3/creator/social` · to `url_template:-:/api/cms/v3/creator/social:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/cms/v3/creator/social/update` · to `url_template:-:/api/cms/v3/creator/social/update:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/cms/v3/creator/update` · to `url_template:-:/api/cms/v3/creator/update:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/cms/v3/creator/update/image` · to `url_template:-:/api/cms/v3/creator/update/image:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/cms/v3/creator/visibility/update` · to `url_template:-:/api/cms/v3/creator/visibility/update:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/cms/v3/live/info` · to `url_template:-:/api/cms/v3/live/info:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/cms/v3/live/thumbnail` · to `url_template:-:/api/cms/v3/live/thumbnail:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/cms/v3/live/update` · to `url_template:-:/api/cms/v3/live/update:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/cms/v3/plan` · to `url_template:-:/api/cms/v3/plan:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/cms/v3/plan/cost` · to `url_template:-:/api/cms/v3/plan/cost:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/cms/v3/plan/create` · to `url_template:-:/api/cms/v3/plan/create:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/cms/v3/plan/delete` · to `url_template:-:/api/cms/v3/plan/delete:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/cms/v3/plan/list` · to `url_template:-:/api/cms/v3/plan/list:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/cms/v3/plan/multi` · to `url_template:-:/api/cms/v3/plan/multi:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/cms/v3/plan/preview` · to `url_template:-:/api/cms/v3/plan/preview:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/cms/v3/plan/preview/stop` · to `url_template:-:/api/cms/v3/plan/preview/stop:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/cms/v3/plan/publish` · to `url_template:-:/api/cms/v3/plan/publish:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/cms/v3/plan/update` · to `url_template:-:/api/cms/v3/plan/update:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/cms/v3/poll/list` · to `url_template:-:/api/cms/v3/poll/list:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/cms/v3/processing/active` · to `url_template:-:/api/cms/v3/processing/active:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/cms/v3/subscribers/list` · to `url_template:-:/api/cms/v3/subscribers/list:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/cms/v3/survey/report` · to `url_template:-:/api/cms/v3/survey/report:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/cms/v3/survey/report/enabled` · to `url_template:-:/api/cms/v3/survey/report/enabled:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/cms/v3/transcode/subscribe` · to `url_template:-:/api/cms/v3/transcode/subscribe:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/cms/v3/transcode/unsubscribe` · to `url_template:-:/api/cms/v3/transcode/unsubscribe:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/v3/achievement/perks` · to `url_template:-:/api/v3/achievement/perks:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/v3/activation/email/confirm` · to `url_template:-:/api/v3/activation/email/confirm:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/v3/activation/email/request` · to `url_template:-:/api/v3/activation/email/request:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/v3/auth/captcha/info` · to `url_template:-:/api/v3/auth/captcha/info:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/v3/auth/checkFor2faLogin` · to `url_template:-:/api/v3/auth/checkFor2faLogin:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/v3/auth/keycloak/migration/login/{username_or_email_or_userid}` · to `url_template:-:/api/v3/auth/keycloak/migration/login/{username_or_email_or_userid}:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/v3/auth/keycloak/migration/login/{username_or_email}` · to `url_template:-:/api/v3/auth/keycloak/migration/login/{username_or_email}:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/v3/auth/login` · to `url_template:-:/api/v3/auth/login:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/v3/auth/logout` · to `url_template:-:/api/v3/auth/logout:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/v3/auth/signup` · to `url_template:-:/api/v3/auth/signup:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/v3/auth/spoof/begin` · to `url_template:-:/api/v3/auth/spoof/begin:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/v3/auth/spoof/end` · to `url_template:-:/api/v3/auth/spoof/end:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/v3/comment` · to `url_template:-:/api/v3/comment:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/v3/comment/delete` · to `url_template:-:/api/v3/comment/delete:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/v3/comment/dislike` · to `url_template:-:/api/v3/comment/dislike:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/v3/comment/edit` · to `url_template:-:/api/v3/comment/edit:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/v3/comment/history` · to `url_template:-:/api/v3/comment/history:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/v3/comment/like` · to `url_template:-:/api/v3/comment/like:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/v3/comment/pin` · to `url_template:-:/api/v3/comment/pin:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/v3/comment/replies` · to `url_template:-:/api/v3/comment/replies:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/v3/comment/reply` · to `url_template:-:/api/v3/comment/reply:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/v3/connect/{site}` · to `url_template:-:/api/v3/connect/{site}:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/v3/connect/{site}/callback` · to `url_template:-:/api/v3/connect/{site}/callback:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/v3/connect/complete` · to `url_template:-:/api/v3/connect/complete:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/v3/connect/dissociate` · to `url_template:-:/api/v3/connect/dissociate:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/v3/connect/list` · to `url_template:-:/api/v3/connect/list:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/v3/connect/refresh` · to `url_template:-:/api/v3/connect/refresh:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/v3/content/audio` · to `url_template:-:/api/v3/content/audio:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/v3/content/creator` · to `url_template:-:/api/v3/content/creator:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/v3/content/creator/list` · to `url_template:-:/api/v3/content/creator/list:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/v3/content/creator/list/paged` · to `url_template:-:/api/v3/content/creator/list/paged:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/v3/content/dislike` · to `url_template:-:/api/v3/content/dislike:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/v3/content/history` · to `url_template:-:/api/v3/content/history:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/v3/content/info` · to `url_template:-:/api/v3/content/info:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/v3/content/landing-page` · to `url_template:-:/api/v3/content/landing-page:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/v3/content/like` · to `url_template:-:/api/v3/content/like:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/v3/content/picture` · to `url_template:-:/api/v3/content/picture:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/v3/content/picture/url` · to `url_template:-:/api/v3/content/picture/url:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/v3/content/post` · to `url_template:-:/api/v3/content/post:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/v3/content/post/list` · to `url_template:-:/api/v3/content/post/list:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/v3/content/post/random` · to `url_template:-:/api/v3/content/post/random:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/v3/content/progress` · to `url_template:-:/api/v3/content/progress:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/v3/content/progress/clear` · to `url_template:-:/api/v3/content/progress/clear:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/v3/content/progress/delete` · to `url_template:-:/api/v3/content/progress/delete:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/v3/content/related` · to `url_template:-:/api/v3/content/related:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/v3/content/search` · to `url_template:-:/api/v3/content/search:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/v3/content/tags` · to `url_template:-:/api/v3/content/tags:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/v3/content/thumbnail/subscribe` · to `url_template:-:/api/v3/content/thumbnail/subscribe:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/v3/content/thumbnail/unsubscribe` · to `url_template:-:/api/v3/content/thumbnail/unsubscribe:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/v3/content/upload/s3/multipart` · to `url_template:-:/api/v3/content/upload/s3/multipart:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/v3/content/upload/s3/multipart/abort` · to `url_template:-:/api/v3/content/upload/s3/multipart/abort:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/v3/content/upload/s3/multipart/complete` · to `url_template:-:/api/v3/content/upload/s3/multipart/complete:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/v3/content/upload/s3/multipart/sign` · to `url_template:-:/api/v3/content/upload/s3/multipart/sign:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/v3/content/upload/thumbnail` · to `url_template:-:/api/v3/content/upload/thumbnail:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/v3/content/video` · to `url_template:-:/api/v3/content/video:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/v3/creator/category/list` · to `url_template:-:/api/v3/creator/category/list:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/v3/creator/channels/list` · to `url_template:-:/api/v3/creator/channels/list:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/v3/creator/discover` · to `url_template:-:/api/v3/creator/discover:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/v3/creator/info` · to `url_template:-:/api/v3/creator/info:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/v3/creator/invite/bind` · to `url_template:-:/api/v3/creator/invite/bind:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/v3/creator/invite/claim` · to `url_template:-:/api/v3/creator/invite/claim:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/v3/creator/invite/info` · to `url_template:-:/api/v3/creator/invite/info:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/v3/creator/list` · to `url_template:-:/api/v3/creator/list:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/v3/creator/named` · to `url_template:-:/api/v3/creator/named:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/v3/creator/stats` · to `url_template:-:/api/v3/creator/stats:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/v3/creator/subscribe` · to `url_template:-:/api/v3/creator/subscribe:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/v3/creator/unsubscribe` · to `url_template:-:/api/v3/creator/unsubscribe:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/v3/delivery/info` · to `url_template:-:/api/v3/delivery/info:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/v3/discord/bot/info` · to `url_template:-:/api/v3/discord/bot/info:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/v3/discord/bot/invite/generate` · to `url_template:-:/api/v3/discord/bot/invite/generate:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/v3/discord/bot/link` · to `url_template:-:/api/v3/discord/bot/link:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/v3/discord/bot/link/callback` · to `url_template:-:/api/v3/discord/bot/link/callback:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/v3/discord/bot/list` · to `url_template:-:/api/v3/discord/bot/list:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/v3/discord/bot/unlink` · to `url_template:-:/api/v3/discord/bot/unlink:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/v3/discord/bot/update` · to `url_template:-:/api/v3/discord/bot/update:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/v3/discord/server/join` · to `url_template:-:/api/v3/discord/server/join:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/v3/faq/list` · to `url_template:-:/api/v3/faq/list:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/v3/image/optimizations` · to `url_template:-:/api/v3/image/optimizations:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/v3/image/type` · to `url_template:-:/api/v3/image/type:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/v3/image/type/list` · to `url_template:-:/api/v3/image/type/list:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/v3/live/info` · to `url_template:-:/api/v3/live/info:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/v3/moderation/comment/hide` · to `url_template:-:/api/v3/moderation/comment/hide:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/v3/moderation/comment/unhide` · to `url_template:-:/api/v3/moderation/comment/unhide:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/v3/moderation/user/ban` · to `url_template:-:/api/v3/moderation/user/ban:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/v3/moderation/user/ban/list` · to `url_template:-:/api/v3/moderation/user/ban/list:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/v3/moderation/user/info` · to `url_template:-:/api/v3/moderation/user/info:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/v3/moderation/user/unban` · to `url_template:-:/api/v3/moderation/user/unban:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/v3/payment/address/add` · to `url_template:-:/api/v3/payment/address/add:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/v3/payment/address/delete` · to `url_template:-:/api/v3/payment/address/delete:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/v3/payment/address/list` · to `url_template:-:/api/v3/payment/address/list:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/v3/payment/address/set` · to `url_template:-:/api/v3/payment/address/set:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/v3/payment/address/update` · to `url_template:-:/api/v3/payment/address/update:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/v3/payment/braintree/token` · to `url_template:-:/api/v3/payment/braintree/token:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/v3/payment/invoice/list` · to `url_template:-:/api/v3/payment/invoice/list:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/v3/payment/method/add` · to `url_template:-:/api/v3/payment/method/add:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/v3/payment/method/delete` · to `url_template:-:/api/v3/payment/method/delete:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/v3/payment/method/list` · to `url_template:-:/api/v3/payment/method/list:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/v3/payment/method/set` · to `url_template:-:/api/v3/payment/method/set:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/v3/payment/setup-intents` · to `url_template:-:/api/v3/payment/setup-intents:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/v3/payment/stripe/checkout` · to `url_template:-:/api/v3/payment/stripe/checkout:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/v3/payment/stripe/manage` · to `url_template:-:/api/v3/payment/stripe/manage:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/v3/payment/stripe/pk` · to `url_template:-:/api/v3/payment/stripe/pk:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/v3/payment/stripe/products` · to `url_template:-:/api/v3/payment/stripe/products:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/v3/payment/stripe/subscription` · to `url_template:-:/api/v3/payment/stripe/subscription:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/v3/payment/stripe/webhook` · to `url_template:-:/api/v3/payment/stripe/webhook:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/v3/payment/subscription/cancel-renew-change` · to `url_template:-:/api/v3/payment/subscription/cancel-renew-change:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/v3/payment/subscription/cancel` · to `url_template:-:/api/v3/payment/subscription/cancel:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/v3/payment/subscription/change` · to `url_template:-:/api/v3/payment/subscription/change:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/v3/payment/subscription/purchase` · to `url_template:-:/api/v3/payment/subscription/purchase:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/v3/payment/subscription/uncancel` · to `url_template:-:/api/v3/payment/subscription/uncancel:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/v3/payment/tax/estimate` · to `url_template:-:/api/v3/payment/tax/estimate:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/v3/payment/webhook/{paymentProcessor}` · to `url_template:-:/api/v3/payment/webhook/{paymentProcessor}:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/v3/payment/webhook/{paymentProcessor}/{subPaymentProcessor}` · to `url_template:-:/api/v3/payment/webhook/{paymentProcessor}/{subPaymentProcessor}:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/v3/plan/content` · to `url_template:-:/api/v3/plan/content:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/v3/plan/info` · to `url_template:-:/api/v3/plan/info:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/v3/poll/close` · to `url_template:-:/api/v3/poll/close:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/v3/poll/cms/list` · to `url_template:-:/api/v3/poll/cms/list:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/v3/poll/live/create` · to `url_template:-:/api/v3/poll/live/create:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/v3/poll/live/joinroom` · to `url_template:-:/api/v3/poll/live/joinroom:template_literal` · @ js/C1rO4Kzx.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/v3/poll/live/joinroommoderator` · to `url_template:-:/api/v3/poll/live/joinroommoderator:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/v3/poll/live/leaveroom` · to `url_template:-:/api/v3/poll/live/leaveroom:template_literal` · @ js/C1rO4Kzx.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/v3/poll/live/leaveroommoderator` · to `url_template:-:/api/v3/poll/live/leaveroommoderator:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/v3/poll/tk/live/joinroom` · to `url_template:-:/api/v3/poll/tk/live/joinroom:template_literal` · @ js/C1rO4Kzx.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/v3/poll/tk/live/leaveroom` · to `url_template:-:/api/v3/poll/tk/live/leaveroom:template_literal` · @ js/C1rO4Kzx.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/v3/poll/vote` · to `url_template:-:/api/v3/poll/vote:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/v3/promotion/claim` · to `url_template:-:/api/v3/promotion/claim:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/v3/promotion/list` · to `url_template:-:/api/v3/promotion/list:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/v3/push/web/info` · to `url_template:-:/api/v3/push/web/info:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/v3/push/web/register` · to `url_template:-:/api/v3/push/web/register:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/v3/push/web/revoke` · to `url_template:-:/api/v3/push/web/revoke:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/v3/redirect-yt-latest/{channelKey}` · to `url_template:-:/api/v3/redirect-yt-latest/{channelKey}:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/v3/redirect/app` · to `url_template:-:/api/v3/redirect/app:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/v3/shopify/multipass` · to `url_template:-:/api/v3/shopify/multipass:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/v3/shopify/verify` · to `url_template:-:/api/v3/shopify/verify:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/v3/socket/connect` · to `url_template:-:/api/v3/socket/connect:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/v3/socket/disconnect` · to `url_template:-:/api/v3/socket/disconnect:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/v3/socket/tk/connect` · to `url_template:-:/api/v3/socket/tk/connect:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/v3/socket/tk/disconnect` · to `url_template:-:/api/v3/socket/tk/disconnect:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/v3/spec` · to `url_template:-:/api/v3/spec:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/v3/status` · to `url_template:-:/api/v3/status:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/v3/support` · to `url_template:-:/api/v3/support:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/v3/support/ticket/types` · to `url_template:-:/api/v3/support/ticket/types:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/v3/survey` · to `url_template:-:/api/v3/survey:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/v3/survey/questions` · to `url_template:-:/api/v3/survey/questions:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/v3/user` · to `url_template:-:/api/v3/user:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/v3/user/achievement` · to `url_template:-:/api/v3/user/achievement:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/v3/user/achievement/badges` · to `url_template:-:/api/v3/user/achievement/badges:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/v3/user/achievement/perks` · to `url_template:-:/api/v3/user/achievement/perks:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/v3/user/achievement/perks/list` · to `url_template:-:/api/v3/user/achievement/perks/list:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/v3/user/activity` · to `url_template:-:/api/v3/user/activity:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/v3/user/avatar` · to `url_template:-:/api/v3/user/avatar:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/v3/user/ban/status` · to `url_template:-:/api/v3/user/ban/status:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/v3/user/creator` · to `url_template:-:/api/v3/user/creator:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/v3/user/delete` · to `url_template:-:/api/v3/user/delete:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/v3/user/email/update` · to `url_template:-:/api/v3/user/email/update:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/v3/user/email/update/complete` · to `url_template:-:/api/v3/user/email/update/complete:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/v3/user/info` · to `url_template:-:/api/v3/user/info:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/v3/user/multi` · to `url_template:-:/api/v3/user/multi:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/v3/user/named` · to `url_template:-:/api/v3/user/named:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/v3/user/notification/channels` · to `url_template:-:/api/v3/user/notification/channels:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/v3/user/notification/channels/list` · to `url_template:-:/api/v3/user/notification/channels/list:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/v3/user/notification/digest` · to `url_template:-:/api/v3/user/notification/digest:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/v3/user/notification/email` · to `url_template:-:/api/v3/user/notification/email:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/v3/user/notification/list` · to `url_template:-:/api/v3/user/notification/list:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/v3/user/notification/update` · to `url_template:-:/api/v3/user/notification/update:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/v3/user/password/change` · to `url_template:-:/api/v3/user/password/change:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/v3/user/password/reset` · to `url_template:-:/api/v3/user/password/reset:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/v3/user/password/reset/request` · to `url_template:-:/api/v3/user/password/reset/request:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/v3/user/password/reset/validate` · to `url_template:-:/api/v3/user/password/reset/validate:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/v3/user/security` · to `url_template:-:/api/v3/user/security:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/v3/user/security/2fa` · to `url_template:-:/api/v3/user/security/2fa:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/v3/user/security/2fa/activate` · to `url_template:-:/api/v3/user/security/2fa/activate:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/v3/user/security/2fa/deactivate` · to `url_template:-:/api/v3/user/security/2fa/deactivate:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/v3/user/security/backupcode` · to `url_template:-:/api/v3/user/security/backupcode:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/v3/user/security/backupcode/activate` · to `url_template:-:/api/v3/user/security/backupcode/activate:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/v3/user/security/backupcode/deactivate` · to `url_template:-:/api/v3/user/security/backupcode/deactivate:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/v3/user/self` · to `url_template:-:/api/v3/user/self:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/v3/user/subscribed` · to `url_template:-:/api/v3/user/subscribed:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/v3/user/subscriptions` · to `url_template:-:/api/v3/user/subscriptions:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/v3/user/undelete` · to `url_template:-:/api/v3/user/undelete:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/v3/user/update` · to `url_template:-:/api/v3/user/update:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/v3/user/username/available` · to `url_template:-:/api/v3/user/username/available:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/v3/webhooks/ivs/livestream` · to `url_template:-:/api/v3/webhooks/ivs/livestream:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_added`** (atomic) — Weaker url_template evidence appeared in the frontend. Not a structured operation addition.
  * — `/api/v3/webhooks/livestream` · to `url_template:-:/api/v3/webhooks/livestream:template_literal` · @ js/index-Dxy9c0et.js
* **`weak_reference_disappeared`** (atomic) — Weaker ambiguous_reference evidence disappeared from the frontend. Not a structured operation disappearance.
  * — `/api/badges/download-on-the-app-store/black/en-us` · from `ambiguous_reference:-:/api/badges/download-on-the-app-store/black/en-us:absolute_api_url_unknown_host` · @ js/CD2cugro.js
* **`weak_reference_disappeared`** (atomic) — Weaker network_reference evidence disappeared from the frontend. Not a structured operation disappearance.
  * — `/api/authxml` · from `network_reference:-:/api/authxml:string_literal_api` · @ js/TfN8-Zm-.js
* **`weak_reference_disappeared`** (atomic) — Weaker network_reference evidence disappeared from the frontend. Not a structured operation disappearance.
  * — `/api/v3/auth/keycloak/migration/login/{username_or_email}` · from `network_reference:-:/api/v3/auth/keycloak/migration/login/{username_or_email}:string_literal_api` · @ js/index-DaEmRTqt.js
* **`weak_reference_disappeared`** (atomic) — Weaker network_reference evidence disappeared from the frontend. Not a structured operation disappearance.
  * — `/api/v3/connect/{site}` · from `network_reference:-:/api/v3/connect/{site}:string_literal_api` · @ js/index-DaEmRTqt.js
* **`weak_reference_disappeared`** (atomic) — Weaker network_reference evidence disappeared from the frontend. Not a structured operation disappearance.
  * — `/api/v3/connect/{site}/callback` · from `network_reference:-:/api/v3/connect/{site}/callback:string_literal_api` · @ js/index-DaEmRTqt.js
* **`weak_reference_disappeared`** (atomic) — Weaker network_reference evidence disappeared from the frontend. Not a structured operation disappearance.
  * — `/api/v3/payment/webhook/{paymentProcessor}` · from `network_reference:-:/api/v3/payment/webhook/{paymentProcessor}:string_literal_api` · @ js/index-DaEmRTqt.js
* **`weak_reference_disappeared`** (atomic) — Weaker network_reference evidence disappeared from the frontend. Not a structured operation disappearance.
  * — `/api/v3/payment/webhook/{paymentProcessor}/{subPaymentProcessor}` · from `network_reference:-:/api/v3/payment/webhook/{paymentProcessor}/{subPaymentProcessor}:string_literal_api` · @ js/index-DaEmRTqt.js
* **`weak_reference_disappeared`** (atomic) — Weaker network_reference evidence disappeared from the frontend. Not a structured operation disappearance.
  * — `/api/v3/poll/live/joinroom` · from `network_reference:-:/api/v3/poll/live/joinroom:string_literal_api` · @ js/2XaFvhNJ.js
* **`weak_reference_disappeared`** (atomic) — Weaker network_reference evidence disappeared from the frontend. Not a structured operation disappearance.
  * — `/api/v3/poll/live/leaveroom` · from `network_reference:-:/api/v3/poll/live/leaveroom:string_literal_api` · @ js/2XaFvhNJ.js
* **`weak_reference_disappeared`** (atomic) — Weaker network_reference evidence disappeared from the frontend. Not a structured operation disappearance.
  * — `/api/v3/poll/tk/live/joinroom` · from `network_reference:-:/api/v3/poll/tk/live/joinroom:string_literal_api` · @ js/2XaFvhNJ.js
* **`weak_reference_disappeared`** (atomic) — Weaker network_reference evidence disappeared from the frontend. Not a structured operation disappearance.
  * — `/api/v3/poll/tk/live/leaveroom` · from `network_reference:-:/api/v3/poll/tk/live/leaveroom:string_literal_api` · @ js/2XaFvhNJ.js
* **`weak_reference_disappeared`** (atomic) — Weaker network_reference evidence disappeared from the frontend. Not a structured operation disappearance.
  * — `/api/v3/redirect-yt-latest/{channelKey}` · from `network_reference:-:/api/v3/redirect-yt-latest/{channelKey}:string_literal_api` · @ js/index-DaEmRTqt.js

## Frontend-only movement

* **`provenance_moved`** (atomic) — Semantic evidence identity unchanged; source artifact/provenance moved. Informational / frontend-only — not an API change.
  * — `https://apm.floatplane.com` · from `network_reference:-:/:host:apm` · to `network_reference:-:/:host:apm` · @ js/aWszMqew.js
* **`provenance_moved`** (atomic) — Semantic evidence identity unchanged; source artifact/provenance moved. Informational / frontend-only — not an API change.
  * — `https://auth.floatplane.com` · from `network_reference:-:/:host:auth` · to `network_reference:-:/:host:auth` · @ js/index-Dxy9c0et.js
* **`provenance_moved`** (atomic) — Semantic evidence identity unchanged; source artifact/provenance moved. Informational / frontend-only — not an API change.
  * — `https://chat.floatplane.com` · from `network_reference:-:/:host:chat_socket` · to `network_reference:-:/:host:chat_socket` · @ js/aWszMqew.js
* **`provenance_moved`** (atomic) — Semantic evidence identity unchanged; source artifact/provenance moved. Informational / frontend-only — not an API change.
  * — `https://frontend.floatplane.com` · from `network_reference:-:/:host:frontend_cdn` · to `network_reference:-:/:host:frontend_cdn` · @ js/aWszMqew.js
* **`provenance_moved`** (atomic) — Semantic evidence identity unchanged; source artifact/provenance moved. Informational / frontend-only — not an API change.
  * — `https://status.floatplane.com` · from `network_reference:-:/:host:status` · to `network_reference:-:/:host:status` · @ js/aWszMqew.js
* **`provenance_moved`** (atomic) — Semantic evidence identity unchanged; source artifact/provenance moved. Informational / frontend-only — not an API change.
  * POST `—` · from `realtime_operation:POST:-:sails_socket_post_unresolved_path` · to `realtime_operation:POST:-:sails_socket_post_unresolved_path` · @ js/C1rO4Kzx.js
* **`provenance_moved`** (atomic) — Semantic evidence identity unchanged; source artifact/provenance moved. Informational / frontend-only — not an API change.
  * — `/api/cms/v3/subscribers/download` · from `url_template:-:/api/cms/v3/subscribers/download:template_literal` · to `url_template:-:/api/cms/v3/subscribers/download:template_literal` · @ js/BhuWOi-p.js
* **`provenance_moved`** (atomic) — Semantic evidence identity unchanged; source artifact/provenance moved. Informational / frontend-only — not an API change.
  * — `/api/connect/{param}` · from `url_template:-:/api/connect/{param}:template_literal` · to `url_template:-:/api/connect/{param}:template_literal` · @ js/CCc964-K.js
* **`provenance_moved`** (atomic) — Semantic evidence identity unchanged; source artifact/provenance moved. Informational / frontend-only — not an API change.
  * — `/api/v1/components/groups` · from `url_template:-:/api/v1/components/groups:template_literal` · to `url_template:-:/api/v1/components/groups:template_literal` · @ js/Cmv4GpKV.js
* **`provenance_moved`** (atomic) — Semantic evidence identity unchanged; source artifact/provenance moved. Informational / frontend-only — not an API change.
  * — `/api/v2/connect/discord` · from `url_template:-:/api/v2/connect/discord:template_literal` · to `url_template:-:/api/v2/connect/discord:template_literal` · @ js/Dq_ZZD-Q.js

## Suppressed / indeterminate

_None._

## Warnings / limitations

* (none)

* Comparator: `phase2.2-frontend-evidence-diff@2.2.1` (schema v2)
* Frontend-evidence change report only. Not an authoritative server API changelog. Do not treat structured_operation_disappeared as API removal without a later verification phase. method_set_changed is a derived grouping of atomic method+path facts — do not triple-count with add/disappear.

