# DealASteal — affiliate ingest workers

This folder contains **server-side ingest workers** that pull product data
from official affiliate APIs and POST cleaned `DealIngestPayload` rows to
`POST /api/ingest/deals` (Bearer-authenticated by `INGESTION_API_KEY`).

## Hard rules

- **Do not scrape merchant HTML** (Amazon, Walmart, Target, etc.) for
  the production catalog. Their Terms of Service forbid programmatic
  HTML access without explicit permission, and Amazon in particular will
  blackhole the IP. Always use the **official affiliate API** for the
  network you have an account with.
- One worker per network. Pure functions for normalization (already
  unit-testable); HTTP/auth code lives in `base_scraper.py`.
- Workers run **out-of-process** (cron / GitHub Actions / Vercel Cron).
  They do not share memory with the Next.js app.

## Supported networks (templates)

| File                     | Network / API                                   | Auth                                           |
|--------------------------|--------------------------------------------------|-------------------------------------------------|
| `amazon_paapi.py`        | Amazon **PA-API 5.0** (`webservices.amazon.com`) | AWS SigV4 with `Access Key`, `Secret`, `Tag`    |
| `walmart_affiliate.py`   | Walmart **Affiliate / Open API**                 | `WM_CONSUMER.ID` + RSA-SHA256 signature header  |
| `ebay_partner.py`        | eBay **Partner Network / Browse API**            | OAuth 2.0 client-credentials                    |

Each template is a thin skeleton: it documents required env vars, returns
**no data** without real credentials, and shows where to map raw vendor
fields onto the `DealIngestPayload` schema in
`src/types/schemas.ts`. Fill in real signing/fetch logic before running
in production.

## Local run

1. From repo root: `npm run dev` (serves the ingest API on `:3000`).
2. From this folder:
   ```bash
   pip install -r requirements.txt
   python amazon_paapi.py            # dry-run; will exit early until creds are set
   ```
3. Set the relevant network credentials in repo root `.env.local`
   (never commit them — `.env*` is git-ignored).

## Required env vars

`INGESTION_API_KEY` — shared secret for the ingest API.

Per-network:

- Amazon PA-API: `AMAZON_PAAPI_ACCESS_KEY`, `AMAZON_PAAPI_SECRET_KEY`,
  `AMAZON_PAAPI_PARTNER_TAG`, `AMAZON_PAAPI_HOST`,
  `AMAZON_PAAPI_REGION`, `AMAZON_PAAPI_MARKETPLACE`,
  `AMAZON_MERCHANT_ID` (UUID of `merchants` row for Amazon).
- Walmart: `WALMART_CONSUMER_ID`, `WALMART_PRIVATE_KEY_PATH`,
  `WALMART_KEY_VERSION`, `WALMART_MERCHANT_ID`.
- eBay: `EBAY_CLIENT_ID`, `EBAY_CLIENT_SECRET`, `EBAY_CAMPAIGN_ID`,
  `EBAY_MERCHANT_ID`.

## Where the data lands

Each template's `_normalize_*` function produces a dict matching
`DealIngestSchema`. After the migration `20260425000000_v2_catalog_evolution.sql`
runs, the schema accepts: `currency`, `merchant_sku`, `asin`, `gtin`,
`brand`, `rating`, `rating_count`, `availability`, `last_seen_at` in the
**ingest body** as well as the existing fields. The Next.js API records
each ingest row, upserts on `(merchant_id, ingest_external_id)`, and
appends a `price_history` snapshot when the price changed.
