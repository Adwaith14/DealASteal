# Phase 8: Trust bundle

## Goal

Persist a small, **strict JSON** “trust bundle” on each deal so we can show **where listing data came from** (affiliate network / pipeline) and later extend with link checks without schema churn.

## Database

- Column: `deals.trust_bundle` (`jsonb`, `NOT NULL`, default `{}`).
- Migration: `supabase/migrations/20260423103000_deals_trust_bundle.sql`

## Ingest API

- Optional `trust_bundle` on `DealIngestSchema` (Zod `.strict()` object).
- Allowed keys today: `affiliate_network` (string), `link_verified_at` (ISO datetime).
- `buildDealInsertRow` passes `trust_bundle` through to PostgREST.

## Normalizers

- **DummyJSON** and **affiliate REST** normalizers attach a minimal bundle (`affiliate_network`, `pipeline`).

## UI

- **DealCard**: subtle “Source: …” when `affiliate_network` is set.
- **DealDetailView**: short provenance line in the hero column.

## Tests

- `src/types/schemas.test.ts` — valid / invalid `trust_bundle`
- `src/lib/ingest/build-deal-insert.test.ts` — passthrough
- `src/utils/deal-trust.test.ts` — label helpers
