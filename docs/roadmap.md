# DealASteal Roadmap

This is the **only** roadmap. Anything outside this file is reference / scratch
material. Each phase has a goal, a definition of done, the files that change,
and the tests that must exist before the phase can be called shipped.

> Hard rule: a phase is "shipped" when its DoD is checked, the tests are green
> in CI, and the architecture doc is in sync.

---

## Already shipped (phases 1-13)

| # | Name | Status | Notes |
|---|------|--------|-------|
| 1 | Foundation (Next.js App Router, Supabase clients, env, layout) | shipped | – |
| 2 | Data model (`merchants`, `deals`, `coupons`, RLS) | shipped | baseline migration: `20260424000000_baseline_schema.sql` |
| 3 | Deal API (list/search/pagination, PDP) | shipped | `src/services/api/deals.ts` |
| 4 | Homepage feed (sections, filters, rails) | shipped | `src/services/api/deals-sections.ts` |
| 5 | Ingest API (`POST /api/ingest/deals`, upsert, revalidate) | shipped | now rate-limited + body-capped |
| 6 | Affiliate REST ingest skeleton | shipped | replaced HTML scraper with API templates |
| 7 | Merchants + dedupe (`ingest_external_id`) | shipped | – |
| 8 | Trust bundle | shipped | `deals.trust_bundle` JSONB |
| 9 | Sort / discovery | shipped | URL `sort=`, browse grid |
| 10 | Auth (magic link, saved deals, account) | shipped | hardened against open-redirect |
| 11 | Contact email (Resend) | shipped | PII-redacted logs |
| 12 | Blog / CMS (Markdown, RSS, sitemap, JSON-LD) | shipped | – |
| 13 | Analytics stub | shipped | provider TBD; do not ship `@vercel/analytics` on Win/webpack |
| 14 | Compliance & launch-readiness (USA) | shipped | legal routes, consent banner, `/api/me/delete` + `/api/me/export`, Amazon tag on click redirect, footer/PDP disclosure |

**This audit pass also added:**

- `server-only` markers on every server module.
- HTTP security headers (CSP, HSTS, XFO, Permissions-Policy, etc.).
- Affiliate-CDN image-host allow-list in `next.config.ts`.
- Open-redirect-safe `next` parameter handling in auth flows.
- Structured logger with PII redaction (`src/lib/observability/logger.ts`).
- In-memory token-bucket rate limiter (`src/lib/security/rate-limit.ts`).
- `Cache-Control` headers on every public/private API route.
- `price_history`, `click_events`, `best_deals_today` materialised view.
- Deal scoring (`src/lib/deals/deal-score.ts`) and the `/api/click/[id]`
  outbound bouncer.
- Removed the Amazon HTML scraper (ToS violation).
- Architecture doc as the single source of truth for layering.

---

## Phase 14 — Compliance & launch-readiness (USA) — **SHIPPED**

**Goal:** be defensible the day we go live.

DoD:

- [x] `/privacy`, `/terms`, `/affiliate-disclosure`, `/dmca` pages with real
  text reviewed by counsel (placeholder copy is fine pre-review).
- [x] Cookie / consent banner: GDPR-style for EU traffic, "Do Not Sell or
  Share My Personal Information" link for CA / CCPA. Default to **deny
  non-essential cookies** until consent.
- [x] Affiliate disclosure visible on every page that contains affiliate
  links (FTC requirement) — small footer line + dedicated page.
- [x] Amazon Associates compliance: tag in every outbound URL, "As an
  Amazon Associate we earn from qualifying purchases" notice on PDP and
  in footer. **Implementation:** `Grab the Deal` uses `/api/click/[id]`;
  redirect applies `NEXT_PUBLIC_AMAZON_ASSOCIATE_TAG` / `AMAZON_ASSOCIATE_TAG`
  via `withAmazonAssociateTag`.
- [x] Account deletion endpoint: user-initiated hard delete cascades to
  `saved_deals`, `profiles`, `click_events` (anonymise).
- [x] Data export endpoint (CCPA "right to know"): JSON dump of profile +
  saved deals.

Files:

- `src/app/(legal)/privacy/page.tsx`
- `src/app/(legal)/terms/page.tsx`
- `src/app/(legal)/affiliate-disclosure/page.tsx`
- `src/app/(legal)/dmca/page.tsx`
- `src/components/consent/CookieBanner.tsx` (client)
- `src/components/consent/CookieBannerWrapper.tsx` (server)
- `src/lib/consent/cookie-store.ts`
- `src/lib/consent/geo.ts`
- `src/lib/affiliate/amazon-associate-link.ts`
- `src/middleware.ts` (sets `das_country` cookie for consent UX)
- `src/app/api/me/delete/route.ts`
- `src/app/api/me/export/route.ts`
- `src/app/account/AccountDataControls.tsx`
- `supabase/migrations/20260426120000_phase14_account_deletion_notes.sql`

Tests:

- [x] Banner state machine (EEA dialog + Essential-only writes cookie).
- [x] `me/delete` returns 204 and calls `auth.admin.deleteUser` when signed in.
- [x] `me/export` returns JSON with `profile`, `saved_deals`, `consent`.

**Next default focus:** Phase **25** — Mobile / PWA.  
**Live data (operators):** purge DummyJSON + run affiliate ingest — see repo `README.md` section **Live catalog**.

---

## Phase 15 — Real ingest workers (Amazon PA-API + Walmart Affiliate) — **SHIPPED**

**Goal:** stop using stub feeds; pull real product data through
official APIs.

DoD:

- [x] `scrapers/amazon_paapi.py` signs PA-API 5 requests, handles error
  codes (`InvalidParameterValue`, `RequestThrottled`), respects the 1
  TPS quota with a token bucket on the client side.
- [x] `scrapers/walmart_affiliate.py` calls the Walmart Affiliate API
  (Impact-mediated), maps fields to `DealIngestSchema`.
- [x] One worker can run as a cron container; idempotent re-runs use
  `ingest_external_id = "<network>:<sku>"`.
- [x] Errors and 4xx/5xx propagated into structured logs (worker side
  uses Python `logging` JSON formatter).

Files:

- `scrapers/amazon_paapi.py`
- `scrapers/walmart_affiliate.py`
- `scrapers/networks/__init__.py`
- `scrapers/networks/normalize.py` (currency, GTIN, ASIN extraction)
- `scrapers/Dockerfile` (for the cron container)

Tests:

- [x] Pytest unit tests on the request signer (golden vector).
- [x] Pytest unit tests on the normaliser (currency casing, ASIN regex).
- [x] Replay-based integration test using recorded HTTP fixtures (no live
  calls in CI).

---

## Phase 16 — Deal scoring job — **SHIPPED**

**Goal:** keep `deals.score` fresh so the homepage's "best deal" is
real, not just whichever was inserted last.

DoD:

- [x] Postgres function `refresh_deal_scores(window interval)` that uses
  `price_history` lows over the last 30d and `click_events` over the
  last 7d, calling logic equivalent to `computeDealScore`.
- [x] Scheduled via `pg_cron` (Supabase) every 15 minutes.
  (Wrapped in a safe `DO` block when the `cron` schema exists.)
- [x] `best_deals_today` materialised view refreshed in the same job.
- [x] Frontend "Best deal" section reads from
  `services/api/deals-sections.getBestDealOfDay()`.

Files:

- `supabase/migrations/20260427153000_deal_scoring_job.sql`
- `supabase/tests/deal_scoring_ordering.sql` (manual / CI `psql` ordering check)
- `src/services/api/deals-sections.ts` — `getBestDealOfDay`
- `src/components/sections/BestDealHero.tsx`
- `src/app/page.tsx` — wires hero + section error aggregation

Tests:

- [x] Unit tests on TS `computeDealScore` (edge cases: non-positive
  discount vs history, null ratings, future `created_at`).
- [x] Vitest: `getBestDealOfDay` MV + hydrate path (`deals-sections.best-deal.test.ts`).
- [x] SQL script: `supabase/tests/deal_scoring_ordering.sql` (run with `psql`).

---

## Phase 17 — Search v2 (Postgres FTS, then external) — **SHIPPED**

**Goal:** real search instead of `ILIKE` substring.

DoD:

- [x] `tsvector` generated column on `deals (title || description ||
  brand)`, GIN index — `20260428100000_deals_fts_search.sql`.
- [x] `getActiveDeals` / `searchDeals` uses `websearch_to_tsquery` via
  `search_active_deals_fts`, ranks with `ts_rank_cd`, falls back to ILIKE
  for short queries or when `DEALS_SEARCH_FTS=0`.
- [x] `/search?q=` page; category hints from `suggestDealCategoriesFromQuery`.
- [ ] (Stretch) Plug Typesense or Meilisearch when product count >50k.

Tests:

- [x] Unit tests: `deal-search-query`, `search-category-suggestions`,
  `getActiveDeals` FTS + ILIKE fallback (`deals.test.ts`).
- [ ] Integration test: insert deals, search, assert ordering (optional / SQL).

---

## Phase 18 — Coupons & promo codes — **SHIPPED**

**Goal:** the `coupons` table actually does something.

DoD:

- [x] Coupon CRUD via ingest API (`/api/ingest/coupons`, same auth +
  rate-limit pattern).
- [x] PDP shows applicable merchant coupons.
- [x] One-click "copy & go" flow records a `coupon_use` event.
- [x] Expired coupons hidden via RLS predicate, not application code.

Tests:

- [x] Service-layer test for "applicable coupons for deal".
- [x] API tests for ingest coupon CRUD + `coupon_use` telemetry route.
- [ ] E2E: copy code, verify clipboard, verify event row.

---

## Phase 19 — Personalisation — **SHIPPED**

**Goal:** logged-in users see something tailored.

DoD:

- [x] Track viewed categories / clicked deals per user (already wired
  via `click_events` if user_id is added → migration).
- [x] `services/api/recommendations.getForUser(userId)` returns top
  active deals, weighted by category affinity.
- [x] Homepage rail "For you" appears only when signed in.

Tests:

- [x] Service-layer test for recommendation ranking and clicked-id exclusion.
- [ ] RLS test: user A cannot read user B's affinity rows.

---

## Phase 20 — Notifications & price drops — **SHIPPED**

**Goal:** "Email me when this drops below $X".

DoD:

- [x] `price_alerts` table, RLS-scoped to owner.
- [x] Cron checks `price_history` against `price_alerts`, queues mail
  via Resend.
- [x] One-click unsubscribe link with HMAC token; no login required.
- [x] Bounce / complaint webhook from Resend disables the alert row.

Tests:

- [x] HMAC token round-trip.
- [x] Cron fires only once per (deal, threshold) crossing.

---

## Phase 21 — Observability & SLOs — **SHIPPED**

**Goal:** see the system without SSHing into a node.

DoD:

- [x] Vercel Analytics or PostHog for product analytics (decide; do not
  install `@vercel/analytics` until the Win/webpack issue is verified
  fixed). **Decision:** PostHog server (`posthog-node`) + key events; no
  `@vercel/analytics`.
- [x] OpenTelemetry traces from route handlers + ingest worker.
- [x] Sentry (or equivalent) for error tracking with PII scrubbed.
- [x] SLO dashboard: ingest latency, search latency, click bouncer
  latency, error rate. **Implementation:** structured `app:slo` JSON logs
  (`ingest.deals`, `catalog.deals.latest`, `click.bounce`) for Vercel/Datadog
  charts; OTLP traces optional.

Tests:

- [x] Smoke test that ingest emits a span with `service.name=ingest`.
- [x] Logger test stays green (no PII leakage).

---

## Phase 22 — Performance & scale — **SHIPPED**

**Goal:** survive a Slickdeals front-page link.

DoD:

- [x] Move rate-limit storage to Upstash Redis behind the same
  `RateLimiter` interface.
- [x] CDN cache (`s-maxage`) on `/api/deals/*` already shipped — verify
  hit ratio in production logs ≥ 80% on hot/list endpoints. **Note:** chart
  ``x-vercel-cache`` in Vercel Observability; warm-path test in
  ``tests/load/vercel-cache.hit.test.ts`` (requires ``LOAD_TEST_BASE_URL``).
- [x] N+1 audit: every list endpoint runs ≤ 2 queries.
- [x] Connection pool sizing reviewed against Supabase plan; PgBouncer
  in front of writes. **Note:** documented in ``docs/architecture.md`` —
  use Supabase pooler (6543) for serverless bursts.
- [x] Load test (k6 or autocannon) at 500 RPS read / 50 RPS write
  baseline; document the result. **Script:** ``npm run load:deals`` +
  ``tests/load/README.md``.

Tests:

- [x] Load script committed under `tests/load/`.
- [x] Synthetic test asserts cache hits via the `x-vercel-cache` header.

---

## Phase 23 — Admin console — **SHIPPED**

**Goal:** non-engineers can curate the homepage and review ingest
quality.

DoD:

- [x] `/admin` route, gated by `profiles.role = 'admin'` RLS check
  + middleware (login redirect when anonymous).
- [x] Manual override: pin a deal, hide a deal, edit `category_slug`.
- [x] Ingest job runs visible (status, last error, last successful pull
  per network) via `ingest_network_status` + `POST /api/ingest/network-status`.
- [x] Audit log of admin actions (`admin_actions` table).

Tests:

- [x] Non-admin gets 403 on `PATCH /api/admin/deals/[id]`.
- [x] Pin / unpin round-trip via `AdminDealsPanel` (client PATCH).

**Env:** after migration ``20260501100000_phase23_admin_console.sql``, set
``DEALS_ADMIN_SCHEMA=1`` so catalog selects include ``admin_*`` columns and
pinned ordering applies. Promote a user with SQL (service role):
``update public.profiles set role = 'admin' where id = '<auth user uuid>';``.

---

## Phase 24 — Multi-network expansion — **SHIPPED**

**Goal:** depth, not just breadth, of catalog.

DoD:

- [x] eBay Partner Network worker (`scrapers/ebay_partner.py` + `networks/ebay_client.py` OAuth + Browse search).
- [x] Best Buy Affiliate / Impact-shaped worker (`scrapers/bestbuy_impact.py` — fixture or HTTPS JSON array).
- [x] Target Affiliates / Impact-shaped worker (`scrapers/target_impact.py` — fixture or HTTPS JSON array).
- [x] Per-network kill switch: `ingest_network_settings.ingest_enabled` + `GET /api/ingest/network-config` (ingestion bearer); workers use `DEALASTEAL_BASE_URL` + `networks/ingest_gate.py` (skip with `INGEST_SKIP_NETWORK_GATE=1`).
- [x] Compliance fields on `ingest_network_settings` (`tos_url`, `disclosure_note`, `attribution_note`); admin toggles on `/admin`.

Tests:

- [x] Per-worker normalisers + eBay OAuth/search replay (`scrapers/tests`).
- [x] Fixtures under `scrapers/tests/fixtures/` (`ebay_browse_search.json`, `bestbuy_impact_catalog.json`, `target_impact_catalog.json`).

**Migration:** `supabase/migrations/20260502120000_phase24_multi_network.sql`.

---

## Phase 25 — Mobile / PWA — **SHIPPED**

**Goal:** be installable, fast, and usable offline for viewing already-loaded
deals.

DoD:

- [x] PWA manifest, icons, splash, theme.
- [x] Service worker (Serwist / Workbox-style) caching the shell + last list
  (`StaleWhileRevalidate` for `GET /api/deals/latest` ahead of default API routes).
- [x] App-launch / quality signals enforced in CI (Lighthouse: PWA installability +
  service worker; category scores as warnings).
- [x] Push notifications for price alerts (cron after successful Resend send;
  `push_subscriptions` + `POST/DELETE /api/me/push-subscribe`).

Tests:

- [x] Lighthouse CI (`lighthouserc.json`, `.github/workflows/lighthouse.yml`,
  `npm run ci:lighthouse` locally after build).
- [x] Cache strategy: `latest-deals-api-runtime-cache.test.ts` (matcher for latest
  deals API).
- [x] Web push: `price-alert-web-push.test.ts`, `push-subscribe/route.test.ts`.

**Env:** `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, optional
`VAPID_MAILTO` (`mailto:…` for Web Push). Generate keys: `npx web-push generate-vapid-keys`.

**Migration:** `supabase/migrations/20260527120000_phase25_push_subscriptions.sql`.

---

## Cross-cutting backlog (no phase yet)

Items that don't yet have an owning phase but have to land before
1.0 GA:

- A11y audit (WCAG 2.1 AA) — all images alt-text, focus states, ARIA
  labels on icon-only buttons.
- SEO: structured data per category, breadcrumbs, canonical URLs across
  filter combos.
- i18n scaffolding (no translations yet, but routes ready).
- Browser-side error boundary with friendly fallback + retry.
- Visual regression tests (Chromatic / Percy) for the homepage and PDP.
- Postgres backup verification: scheduled restore-from-backup drill.

---

## Working agreement

1. New work creates an entry under the right phase before the first
   commit.
2. Schema changes ship as migrations; no live `psql` mutations.
3. Tests live next to the code and ship in the same PR.
4. The architecture doc is the contract — break it knowingly, update it
   in the same PR.
5. Public API responses are versioned by route, not by header. Breaking
   changes get a new path (`/api/v2/...`).
