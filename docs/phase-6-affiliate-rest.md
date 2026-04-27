# Phase 6: Affiliate REST Ingest

Run a real affiliate network REST feed through the same secure ingest API:

1. Set env vars in `.env.local`:
   - `AFFILIATE_REST_OFFERS_URL` (full endpoint URL that returns `{ offers: [...], next_cursor?: string }` — **omit when using a local fixture file**. Placeholder URLs like `your-affiliate-api.example` trigger **automatic bundled fixture** on `--dry-run` only.)
   - `AFFILIATE_REST_FIXTURE_PATH` (optional; path to JSON file relative to repo root — same shape as REST body; skips network). Or pass `--fixture=relative/path.json` on the CLI.
   - `AFFILIATE_REST_SOURCE` (id prefix for dedupe keys, e.g. `impact`)
   - `AFFILIATE_DEFAULT_MERCHANT_ID` (default merchant UUID if no per-offer match; falls back to `INGEST_MERCHANT_ID`)
   - `AFFILIATE_MERCHANT_MAP` (optional per-merchant routing, format: `target=<uuid>,walmart=<uuid>`)
   - `AFFILIATE_REST_BEARER_TOKEN` and/or `AFFILIATE_REST_API_KEY` (if your network requires auth)
   - `AFFILIATE_LOOT_THRESHOLD_PCT` (optional, default `30`)
   - existing ingest vars: `INGESTION_API_KEY`, `INGEST_MERCHANT_ID`, `INGEST_SITE_URL`
2. Dry run:
   - Network: `npm run ingest:affiliate:dry` (needs reachable `AFFILIATE_REST_OFFERS_URL`)
   - Offline sample: `npm run ingest:affiliate:dry:fixture` (uses `fixtures/affiliate-rest-sample.json`; no fetch)
3. Real ingest:
   - `npm run ingest:affiliate`

Each imported offer becomes an idempotent key (merchant-scoped):

- `ingest_external_id = <AFFILIATE_REST_SOURCE>:<merchant_scope>:<external_id>`

So reruns update existing deals instead of duplicating rows.
