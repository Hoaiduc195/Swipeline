# First-party adapters

First-party source adapters live under [`packages/`](../packages/) (`packages/adapter-http-json` for the generic HTTP/JSON adapter, `packages/adapter-testkit` for conformance tests, and `packages/adapter-arxiv`, `packages/adapter-openlibrary`, `packages/adapter-themealdb`, and `packages/adapter-tmdb` for specific sources). This directory is kept as a compatibility pointer and summary of adapter rules.

Rules for first-party adapter packages:

- `fetch` respects rate limits, `Retry-After` and the abort signal.
- `normalize` returns `null` for records it cannot map, never throws for one bad
  row, and drops nothing silently without counting the drop.
- `attribution` is declared when the source requires credit.
- Fixtures are recorded, so tests never hit the network.
- The adapter passes `@swipeline/adapter-testkit` conformance.
- No scraping, no undocumented endpoints, no caching beyond what terms allow.

Community adapters live outside this repo and are listed in
[`registry/adapters.json`](../registry/adapters.json). Start one with the
template described in [`docs/guides/write-an-adapter.md`](../docs/guides/write-an-adapter.md).
