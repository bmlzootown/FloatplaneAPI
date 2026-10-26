# Frontend API evidence inventory

**Observation:** `8cb81ec3d78e7025ca3787339bbc744b0d42e4daf8a94cbba40e934cf3cb8963`
**Build:** `4.5.25-340-92712da`
**Extractor:** `phase2.1-frontend-evidence@2.1.1`
**Evidence schema:** `v2`
**Extracted at:** 2026-10-07T00:31:14.734Z

> Frontend client evidence from archived JS for this observation only.
> This is **not** a complete server API catalog and **not** an inter-observation change report.

## Counts

| Metric | Value |
|--------|------:|
| Structured operations (unique method+path) | 0 |
| Evidence items (all categories) | 27 |
| Category `ambiguous_reference` | 1 |
| Category `network_reference` | 16 |
| Category `realtime_operation` | 6 |
| Category `url_template` | 4 |
| Rejected signals | 8 |
| Reachable JS modules | 273 |
| Lazy JS (excl. entry) | 272 |
| JS bytes archived (phase2 chunks) | 3649640 |
| Collection status | complete_with_external_rejects |
| Deterministic closure | true |
| External rejects | 8 |

## Structured operations by method

| Method | Count |
|--------|------:|
| — | 0 |

## Structured operations (METHOD PATH SOURCE)

| Method | Path | Source |
|--------|------|--------|
| — | — | — |

## Realtime

- `POST` `—` (sails_socket_post_unresolved_path) — `js/2XaFvhNJ.js`
- `—` `/` (chat_socket_uri) — `js/index-DaEmRTqt.js`
- `POST` `/api/v3/socket/connect` (sails_socket_post) — `js/index-DaEmRTqt.js`
- `POST` `/api/v3/socket/disconnect` (sails_socket_post) — `js/index-DaEmRTqt.js`
- `POST` `/api/v3/socket/tk/connect` (sails_socket_post) — `js/index-DaEmRTqt.js`
- `POST` `/api/v3/socket/tk/disconnect` (sails_socket_post) — `js/index-DaEmRTqt.js`

## URL templates

- `/api/cms/v3/subscribers/download` — `js/BV0d5Y1o.js`
- `/api/connect/{param}` — `js/ljJPxNpq.js`
- `/api/v1/components/groups` — `js/C02NyVxO.js`
- `/api/v2/connect/discord` — `js/CWZoCrqS.js`

## Warnings

- socket.post without resolvable path at js/2XaFvhNJ.js:14576
- socket.post without resolvable path at js/2XaFvhNJ.js:15272

## Rejected signals

- `external_vendor_url`: `https://fairplay.twitch.keyos.com` (`js/TfN8-Zm-.js`)
- `external_vendor_url`: `https://playready.twitch.keyos.com` (`js/TfN8-Zm-.js`)
- `external_vendor_url`: `https://widevine.twitch.keyos.com` (`js/TfN8-Zm-.js`)
- `external_vendor_url`: `https://fairplay.twitch.keyos.com/api/v4/getCertificate?certHash=a17fd33d3843df9b17679ccf50a419b2` (`js/TfN8-Zm-.js`)
- `external_vendor_url`: `https://fairplay.twitch.keyos.com/api/v4/getCertificate?certHash=a17fd33d3843df9b17679ccf50a419b2` (`js/TfN8-Zm-.js`)
- `external_vendor_url`: `https://fairplay.twitch.keyos.com/api/v4/getLicense` (`js/TfN8-Zm-.js`)
- `external_vendor_url`: `https://playready.twitch.keyos.com/api/v4/getLicense` (`js/TfN8-Zm-.js`)
- `external_vendor_url`: `https://widevine.twitch.keyos.com/api/v4/getLicense` (`js/TfN8-Zm-.js`)

## Disclaimer

Paths and methods above are evidenced in frontend client bundles for this observation.
Presence in the client does not confirm public availability, authorization, or server behavior.

