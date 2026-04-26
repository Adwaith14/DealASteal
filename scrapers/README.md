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
- One worker per network. Normalization lives in `networks/normalize.py`;
  signing and HTTP clients live in `networks/*_client.py` and
  `networks/*_sign.py`.
- Workers run **out-of-process** (cron / GitHub Actions / Vercel Cron).
  They do not share memory with the Next.js app.

## Supported networks

| File                   | Network / API                                      | Auth |
|------------------------|----------------------------------------------------|------|
| `amazon_paapi.py`      | Amazon **PA-API 5.0** (`/paapi5/searchitems`)    | AWS SigV4 (`botocore`), ~1 TPS client pacing |
| `walmart_affiliate.py` | Walmart **Affiliate / Open API** (product feeds) | `WM_CONSUMER.ID` + RSA-SHA256 (`cryptography`) |
| `ebay_partner.py`      | eBay **Browse API** (item summary search)        | OAuth 2.0 client-credentials + `EBAY_CAMPAIGN_ID` |
| `bestbuy_impact.py`    | Best Buy–shaped **JSON catalog** (Impact-style)  | Optional bearer; fixture path or HTTPS URL |
| `target_impact.py`     | Target–shaped **JSON catalog** (Impact-style)    | Optional bearer; fixture path or HTTPS URL |

## Docker

From the **repository root** (so `.env.local` can be mounted if desired):

```bash
docker build -f scrapers/Dockerfile -t dealasteal-workers ./scrapers
docker run --rm -e INGESTION_API_KEY=... -e AMAZON_MERCHANT_ID=... \
  -e AMAZON_PAAPI_ACCESS_KEY=... -e AMAZON_PAAPI_SECRET_KEY=... \
  -e AMAZON_PAAPI_PARTNER_TAG=... \
  dealasteal-workers
```

Override the default command, e.g. `docker run ... dealasteal-workers python walmart_affiliate.py`.

## Local run

1. Repo root: `npm run dev` (ingest API on `:3000`).
2. `pip install -r scrapers/requirements.txt`
3. `python scrapers/amazon_paapi.py` (or `cd scrapers` then `python amazon_paapi.py`)
4. Credentials in repo root `.env.local` (never commit — `.env*` is ignored).

## Tests (no live network)

From repo root:

```bash
npm run test:scrapers
```

## Required env vars

**All workers:** `INGESTION_API_KEY`, optional `DEALASTEAL_INGEST_URL` (defaults to `http://localhost:3000/api/ingest/deals`).

**Kill switch (optional):** set **`DEALASTEAL_BASE_URL`** to your site origin (e.g. `https://dealasteal.example`) so workers call `GET /api/ingest/network-config` before running. Disable a network from `/admin` without redeploying. **`INGEST_SKIP_NETWORK_GATE=1`** skips the check (local dev).

### Amazon PA-API

- `AMAZON_PAAPI_ACCESS_KEY`, `AMAZON_PAAPI_SECRET_KEY`, `AMAZON_PAAPI_PARTNER_TAG`
- `AMAZON_MERCHANT_ID` — UUID of the `merchants` row for Amazon
- Optional: `AMAZON_PAAPI_HOST` (default `webservices.amazon.com`), `AMAZON_PAAPI_REGION` (default `us-east-1`), `AMAZON_PAAPI_MARKETPLACE` (default `www.amazon.com`), `AMAZON_PAAPI_MIN_INTERVAL` (default `1.0` seconds between calls)

### Walmart Affiliate

- `WALMART_CONSUMER_ID`, `WALMART_PRIVATE_KEY_PATH` (PEM PKCS#8), `WALMART_KEY_VERSION`, `WALMART_MERCHANT_ID`
- Optional: `WALMART_API_BASE` (default `https://developer.api.walmart.com`), `WALMART_FEED_PATH` (default special-buys feed path)

### eBay Partner Network

- `EBAY_CLIENT_ID`, `EBAY_CLIENT_SECRET`, `EBAY_CAMPAIGN_ID`, `EBAY_MERCHANT_ID`
- Optional: `EBAY_SEARCH_QUERY` (default `electronics deals`), `EBAY_SEARCH_LIMIT`, `EBAY_MARKETPLACE_ID` (default `EBAY_US`), `EBAY_MIN_INTERVAL`

### Best Buy (Impact-shaped catalog)

- `BESTBUY_MERCHANT_ID`, `INGESTION_API_KEY`
- **One of:** `BESTBUY_IMPACT_FIXTURE_PATH` (JSON array on disk) **or** `BESTBUY_IMPACT_CATALOG_URL` (HTTPS JSON array)
- Optional: `BESTBUY_IMPACT_BEARER` when the catalog URL needs `Authorization: Bearer`

### Target (Impact-shaped catalog)

- `TARGET_MERCHANT_ID`, `INGESTION_API_KEY`
- **One of:** `TARGET_IMPACT_FIXTURE_PATH` **or** `TARGET_IMPACT_CATALOG_URL`
- Optional: `TARGET_IMPACT_BEARER`

## Where the data lands

Each worker maps vendor JSON to `DealIngestSchema` (`src/types/schemas.ts`).
Upserts use `ingest_external_id` (`amazon:<ASIN>`, `walmart:<itemId>`, `ebay:<itemId>`,
`bestbuy:<sku>`, `target:<tcin>`). The
Next.js API records each ingest row and appends `price_history` when the
price changes.
