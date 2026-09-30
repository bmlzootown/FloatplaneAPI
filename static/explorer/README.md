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

1. Log in on floatplane.com in a normal browser.
2. Copy the `sails.sid` cookie value into the Explorer auth field (stored in `localStorage` only).
3. Prefer **Copy curl** and run it in a terminal — browsers cannot set `Cookie` on cross-origin requests, and Floatplane does not allow CORS from arbitrary origins.
4. Optional: point **Base URL** at a local reverse proxy that injects `Cookie: sails.sid=…` if you want live **Send request** from the page.

Never commit cookie values.
