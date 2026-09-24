# fp-frontend-watch (Phase 1)

Detect and archive Floatplane frontend deployments from observable `floatplane.com` behavior.

```sh
node tools/fp-frontend-watch/cli.mjs discover
node tools/fp-frontend-watch/cli.mjs check
node --test tests/frontend-watch/frontend-watch.test.mjs
```

See the repository README section **Frontend deployment watch (Phase 1)** for discovery rationale, state/artifact layout, exit codes, and what is out of scope.

Legacy Angular fetch/diff scripts (`fp-frontend-fetch-2.sh`, etc.) remain for manual use; this tool replaces the “know the version first” workflow for monitoring.
