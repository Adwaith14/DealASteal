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

## Phase 14 — Compliance & launch-readiness (USA)

**Goal:** be defensible the day we go live.

DoD:

- [ ] `/privacy`, `/terms`, `/affiliate-disclosure`, `/dmca` pages with real
  text reviewed by counsel (placeholder copy is fine pre-review).
- [ ] Cookie / consent banner: GDPR-style for EU traffic, "Do Not Sell or
  Share My Personal Information" link for CA / CCPA. Default to **deny
  non-essential cookies** until consent.
- [ ] Affiliate disclosure visible on every page that contains affiliate
  links (FTC requirement) — small footer line + dedicated page.
- [ ] Amazon Associates compliance: tag in every outbound URL, "As an
  Amazon Associate we earn from qualifying purchases" notice on PDP and
  in footer.
- [ ] Account deletion endpoint: user-initiated hard delete cascades to
  `saved_deals`, `profiles`, `click_events` (anonymise).
- [ ] Data export endpoint (CCPA "right to know"): JSON dump of profile +
  saved deals.

Files:

- `src/app/(legal)/privacy/page.tsx`
- `src/app/(legal)/terms/page.tsx`
- `src/app/(legal)/affiliate-disclosure/page.tsx`
- `src/app/(legal)/dmca/page.tsx`
- `src/components/consent/CookieBanner.tsx` (client)
- `src/lib/consent/cookie-store.ts`
- `src/app/api/me/delete/route.ts`
- `src/app/api/me/export/route.ts`
- `supabase/migrations/<date>_account_deletion.sql`

Tests:

- Banner state machine (accept / reject / region detection).
- `me/delete` hard-deletes and returns 204; subsequent reads 401.
- `me/export` returns JSON with `profile`, `saved_deals`, `consent`.

---

## Phase 15 — Real ingest workers (Amazon PA-API + Walmart Affiliate)

**Goal:** stop using stub feeds; pull real product data through
official APIs.

DoD:

- [ ] `scrapers/amazon_paapi.py` signs PA-API 5 requests, handles error
  codes (`InvalidParameterValue`, `RequestThrottled`), respects the 1
  TPS quota with a token bucket on the client side.
- [ ] `scrapers/walmart_affiliate.py` calls the Walmart Affiliate API
  (Impact-mediated), maps fields to `DealIngestSchema`.
- [ ] One worker can run as a cron container; idempotent re-runs use
  `ingest_external_id = "<network>:<sku>"`.
- [ ] Errors and 4xx/5xx propagated into structured logs (worker side
  uses Python `logging` JSON formatter).

Files:

- `scrapers/amazon_paapi.py`
- `scrapers/walmart_affiliate.py`
- `scrapers/networks/__init__.py`
- `scrapers/networks/normalize.py` (currency, GTIN, ASIN extraction)
- `scrapers/Dockerfile` (for the cron container)

Tests:

- Pytest unit tests on the request signer (golden vector).
- Pytest unit tests on the normaliser (currency casing, ASIN regex).
- Replay-based integration test using recorded HTTP fixtures (no live
  calls in CI).

---

## Phase 16 — Deal scoring job

**Goal:** keep `deals.score` fresh so the homepage's "best deal" is
real, not just whichever was inserted last.

DoD:

- [ ] Postgres function `refresh_deal_scores(window interval)` that uses
  `price_history` lows over the last 30d and `click_events` over the
  last 7d, calling logic equivalent to `computeDealScore`.
- [ ] Scheduled via `pg_cron` (Supabase) every 15 minutes.
- [ ] `best_deals_today` materialised view refreshed in the same job.
- [ ] Frontend "Best deal" section reads from
  `services/api/deals-sections.getBestDealOfDay()`.

Files:

- `supabase/migrations/<date>_deal_scoring_job.sql`
- `src/services/api/deals-sections.ts` — add `getBestDealOfDay`.
- `src/components/sections/BestDealHero.tsx` (client; just renders).

Tests:

- Unit tests on TS `computeDealScore` (already shipped — extend for
  edge cases: zero price, missing rating, future-dated `last_seen_at`).
- SQL test: insert two deals with different histories, run
  `refresh_deal_scores`, assert ordering.

---

## Phase 17 — Search v2 (Postgres FTS, then external)

**Goal:** real search instead of `ILIKE` substring.

DoD:

- [ ] `tsvector` generated column on `deals (title || description ||
  brand)`, GIN index.
- [ ] `services/api/deals.searchDeals` uses `websearch_to_tsquery`,
  ranks with `ts_rank_cd`, falls back to ILIKE for short queries.
- [ ] `/search?q=` page wired up; suggests categories from the same
  query.
- [ ] (Stretch) Plug Typesense or Meilisearch when product count >50k.

Tests:

- Unit tests on query builder (escapes wildcards, splits operators).
- Integration test: insert deals, search, assert ordering.

---

## Phase 18 — Coupons & promo codes

**Goal:** the `coupons` table actually does something.

DoD:

- [ ] Coupon CRUD via ingest API (`/api/ingest/coupons`, same auth +
  rate-limit pattern).
- [ ] PDP shows applicable merchant coupons.
- [ ] One-click "copy & go" flow records a `coupon_use` event.
- [ ] Expired coupons hidden via RLS predicate, not application code.

Tests:

- Service-layer test for "applicable coupons for deal".
- E2E: copy code, verify clipboard, verify event row.

---

## Phase 19 — Personalisation

**Goal:** logged-in users see something tailored.

DoD:

- [ ] Track viewed categories / clicked deals per user (already wired
  via `click_events` if user_id is added → migration).
- [ ] `services/api/recommendations.getForUser(userId)` returns top
  active deals, weighted by category affinity.
- [ ] Homepage rail "For you" appears only when signed in.

Tests:

- Service-layer test with seeded fixtures.
- RLS test: user A cannot read user B's affinity rows.

---

## Phase 20 — Notifications & price drops

**Goal:** "Email me when this drops below $X".

DoD:

- [ ] `price_alerts` table, RLS-scoped to owner.
- [ ] Cron checks `price_history` against `price_alerts`, queues mail
  via Resend.
- [ ] One-click unsubscribe link with HMAC token; no login required.
- [ ] Bounce / complaint webhook from Resend disables the alert row.

Tests:

- HMAC token round-trip.
- Cron fires only once per (deal, threshold) crossing.

---

## Phase 21 — Observability & SLOs

**Goal:** see the system without SSHing into a node.

DoD:

- [ ] Vercel Analytics or PostHog for product analytics (decide; do not
  install `@vercel/analytics` until the Win/webpack issue is verified
  fixed).
- [ ] OpenTelemetry traces from route handlers + ingest worker.
- [ ] Sentry (or equivalent) for error tracking with PII scrubbed.
- [ ] SLO dashboard: ingest latency, search latency, click bouncer
  latency, error rate.

Tests:

- Smoke test that ingest emits a span with `service.name=ingest`.
- Logger test stays green (no PII leakage).

---

## Phase 22 — Performance & scale

**Goal:** survive a Slickdeals front-page link.

DoD:

- [ ] Move rate-limit storage to Upstash Redis behind the same
  `RateLimiter` interface.
- [ ] CDN cache (`s-maxage`) on `/api/deals/*` already shipped — verify
  hit ratio in production logs ≥ 80% on hot/list endpoints.
- [ ] N+1 audit: every list endpoint runs ≤ 2 queries.
- [ ] Connection pool sizing reviewed against Supabase plan; PgBouncer
  in front of writes.
- [ ] Load test (k6 or autocannon) at 500 RPS read / 50 RPS write
  baseline; document the result.

Tests:

- Load script committed under `tests/load/`.
- Synthetic test asserts cache hits via the `x-vercel-cache` header.

---

## Phase 23 — Admin console

**Goal:** non-engineers can curate the homepage and review ingest
quality.

DoD:

- [ ] `/admin` route, gated by `profiles.role = 'admin'` RLS check
  + middleware.
- [ ] Manual override: pin a deal, hide a deal, edit `category_slug`.
- [ ] Ingest job runs visible (status, last error, last successful pull
  per network).
- [ ] Audit log of admin actions (separate `admin_actions` table).

Tests:

- RLS test: non-admin gets 403.
- Pin / unpin round-trips through the UI.

---

## Phase 24 — Multi-network expansion

**Goal:** depth, not just breadth, of catalog.

DoD:

- [ ] eBay Partner Network worker.
- [ ] Best Buy Affiliate (Impact) worker.
- [ ] Target Affiliates (Impact) worker.
- [ ] Per-network kill switch (admin toggle) without a deploy.
- [ ] Per-network compliance check (ToS link, disclosure, attribution).

Tests:

- Per-worker normaliser unit tests.
- Replay fixtures committed.

---

## Phase 25 — Mobile / PWA

**Goal:** be installable, fast, and usable offline for viewing already-loaded
deals.

DoD:

- [ ] PWA manifest, icons, splash, theme.
- [ ] Service worker (Workbox) caching the shell + last list.
- [ ] App-launch performance budget enforced in CI (Lighthouse on
  preview).
- [ ] Push notifications for price alerts (Phase 20 reuse).

Tests:

- Lighthouse CI threshold (perf, PWA, a11y, SEO).
- Service-worker integration test (cache strategy).

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
