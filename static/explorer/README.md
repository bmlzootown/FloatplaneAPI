# Floatplane API Explorer

Human-friendly static browser for the **trimmed** OpenAPI surface (documented ops only; TODO stubs removed by `make trim`).

## Quick start

From the repository root:

```sh
make docs-explorer
# then serve Docs/ (required — browsers block fetch() from file://)
python3 -m http.server 8080 --directory Docs
```

Open [http://127.0.0.1:8080/Explorer/](http://127.0.0.1:8080/Explorer/).

Or open the committed source after generating a local spec copy:

```sh
make trim
cp src/floatplane-openapi-specification-trimmed.json static/explorer/spec.json
python3 -m http.server 8080 --directory static/explorer
```

Then open [http://127.0.0.1:8080/](http://127.0.0.1:8080/).

`make docs-trimmed` / `make docs-all` also include the Explorer under `Docs/Explorer/`.

## Auth & try-it

**REST (primary):** paste a Keycloak **access token**. Explorer attaches `Authorization: Bearer …` on Copy curl and Send. This is the modern third-party REST path (current Floatplane clients send Bearer tokens).

**Chat / Socket.IO only:** `sails.sid` remains relevant for livestream chat AsyncAPI connections. It is demoted in the UI and is **not** attached to REST try-it.

**OpenAPI gap:** the checked-in OpenAPI still documents only `CookieAuth` (`sails.sid`). The explorer surfaces Bearer for REST anyway; aligning the OpenAPI security scheme is a separate documentation task (not inventing endpoint behavior here).

Prefer **Copy curl** in a terminal. Live browser **Send** to `www.floatplane.com` may still fail on CORS. Optional: point **Base URL** at a local reverse proxy.

Never commit tokens or cookie values.
