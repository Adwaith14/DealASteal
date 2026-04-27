# Phase 7: Merchants + Dedupe

Phase 7 extends affiliate ingest with merchant-aware routing and collision-safe dedupe.

## What is done

- Per-offer merchant resolution from feed fields:
  - `offer.merchant_slug` (preferred)
  - `offer.merchant_name` (fallback)
- Env-controlled merchant routing:
  - `AFFILIATE_MERCHANT_MAP=target=<uuid>,walmart=<uuid>`
  - fallback `AFFILIATE_DEFAULT_MERCHANT_ID` (or `INGEST_MERCHANT_ID`)
- Merchant-scoped dedupe key:
  - `ingest_external_id = <source>:<merchant_scope>:<external_id>`

This prevents clashes when two merchants share the same upstream `external_id`.
