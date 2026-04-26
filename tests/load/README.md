# Load tests (Phase 22)

## deals-read (`deals-read.mjs`)

Baseline: **~500 RPS read** target is environment-dependent; tune `connections` and `duration`.

```bash
# against local dev
npm run load:deals

# against Vercel preview / prod
LOAD_TEST_BASE_URL=https://your-app.vercel.app LOAD_TEST_CONNECTIONS=50 LOAD_TEST_DURATION_SECONDS=15 npm run load:deals
```

Commit JSON output from a successful production-scale run in your ops notes if you need an audit trail.

## CDN (`x-vercel-cache`)

Vercel adds `x-vercel-cache` on edge-cached responses. After deployment, set `LOAD_TEST_BASE_URL` and run:

```bash
npm run test -- tests/load/vercel-cache.hit.test.ts
```

The test asserts the header is present on a second request and that `Cache-Control` includes `s-maxage` (from our `cacheHeaders('shortFeed')`).
