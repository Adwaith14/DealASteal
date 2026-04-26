# DealASteal — Architecture & Layering Rules

**Status:** authoritative. Any change to system shape MUST update this doc.

This is a **read-it-before-you-touch-it** map of how the site is wired and the
hard rules that keep frontend, backend, and data-layer changes from breaking
each other. The rest of the codebase derives from this; the rules below are
not stylistic preferences — violating them creates real outages.

---

## 1. High-level shape

```
[Affiliate APIs]   →  [Python ingest workers]  →  POST /api/ingest/deals  →  Supabase Postgres
   (Amazon PA-API,                                       (server only,
    Walmart, eBay,                                        bearer auth,
    Impact, etc.)                                         rate-limited)
                                                                │
                                                                ▼
        Browser  ◀──  Next.js (App Router)  ──▶  PostgREST (Supabase)  ──▶  Postgres
                       RSC for reads,                  RLS-scoped reads
                       /api/click/[id] for redirects
```

Three runtime planes:

1. **Edge / browser** — React Server Components + a thin set of client
   components for interactivity (filters, save heart, search).
2. **Server** — Route Handlers under `src/app/api/**`, server-only utilities
   under `src/lib/**`, and data access under `src/services/api/**`.
3. **Database** — Postgres in Supabase, fronted by PostgREST. RLS is the
   primary authorisation barrier; the API layer **does not** add a second
   homemade authz on top of it.

---

## 2. Directory contract

| Path | Layer | Allowed to import |
|------|-------|-------------------|
| `src/app/(routes)/**` | UI (RSC + client) | `src/components`, `src/services/api`, `src/lib/**` (server-only modules only from server components/route handlers), `src/types`, `src/constants` |
| `src/app/api/**` | Server route handlers | everything except UI components |
| `src/components/**` | Pure UI | `src/lib/ui-*`, `src/types`, `src/constants` — **never** `src/services/api` or `src/lib/supabase` |
| `src/services/api/**` | Backend / data access | `src/lib/supabase`, `src/lib/observability`, `src/types`, `src/constants` |
| `src/lib/**` | Cross-cutting utilities | only its own siblings + `src/types` |
| `src/types/**` | Pure types & Zod schemas | nothing runtime-heavy |
| `supabase/migrations/**` | Schema-of-record | n/a (SQL) |
| `scrapers/**` | Python ingest workers | independent process; talks to the site only via the ingest HTTP API; PA-API SigV4 + Walmart RSA signing live under `scrapers/networks/` (see `npm run test:scrapers`) |

Reinforcement mechanisms:

- Any module that touches secrets, the service-role Supabase key, or
  PostgREST writes **must** start with `import 'server-only';`. Vitest is
  configured to no-op this import so tests still run.
- Tests live next to the code they cover and use `*.test.ts` /
  `*.test.tsx` Vitest naming. The shared rule is: **a behaviour change
  ships with the test that proves it.**

---

## 3. Frontend ↔ backend boundary rules

These are non-negotiable. PRs that violate them get rejected.

### F-1. Components never read the database directly

- Pages and route handlers call `src/services/api/*` functions.
- Service functions return `{ ok: true, ... }` / `{ ok: false, error, ... }`
  discriminated unions — components render the union, never throw across
  the wire.
- Side effect in render is forbidden; do data access in async server
  components or inside route handlers.

### F-2. Public Supabase URL/keys live behind helper functions

- Browser code calls `getSupabaseBrowser()` only. It never imports the
  service-role key, `getSupabaseAdmin`, or `getSupabaseServerAnon`.
- The admin client (`getSupabaseAdmin`) is for ingest workers, click
  logging, and admin-only flows. Anywhere else is a bug.

### F-3. All inputs are validated at the boundary

- Inbound HTTP body is parsed and validated with Zod (`DealIngestSchema`,
  contact form schema). Anything coming from a URL search param is parsed
  with the same constants used by `services/api/deals` so the UI and the
  query layer cannot drift.
- Any URL we will redirect to (`?next=`, login redirect targets, `/api/click`
  destinations) is sanitised with the helpers in
  `src/lib/auth/safe-redirect.ts` before use.

### F-4. Caching is explicit

- Public list/section endpoints set short shared cache headers via
  `cacheHeaders('shortFeed')`.
- Personalised endpoints (saved deals, account) MUST send
  `cacheHeaders('noStore')`. There is no "default" — every API route picks
  one.

### F-5. Logging goes through `logger`

- `console.*` is reserved for genuinely interactive scripts (CLI tools,
  one-off ingest workers). Server runtime code uses `logger.child(scope)`
  so output is structured JSON with PII redaction.

---

## 4. Data layer

- `merchants`, `deals`, `coupons` form the catalog core. `price_alerts`
  stores per-user max-price targets and drives Resend price-drop email (Phase
  20).
- `ingest_network_settings` (Phase 24) stores per-slug **`ingest_enabled`** and
  compliance text; workers optionally read **`GET /api/ingest/network-config`**.
- `price_history` records the time series of `(deal_id, observed_at,
  discount_price)`. The deal-score helper consults the rolling minimum
  to decide if "this is the lowest we've seen it".
- `click_events` records bouncer hits (`/api/click/[id]`) and powers the
  demand-momentum signal in the score. Stored values are hashed
  (IP/user-agent), never raw.
- `coupon_use_events` records PDP coupon copy-and-go usage (`/api/coupon-use`)
  with the same hashed IP/user-agent pattern.
- `deals.score` is a denormalised number in [0, 100] computed by
  `computeDealScore`. It is written by `public.refresh_deal_scores(interval, interval)`
  (migration `20260427153000_deal_scoring_job.sql`), scheduled with `pg_cron`
  when available; no read path mutates it.

The homepage "best deal" reads the top row of the `best_deals_today`
materialised view (refreshed in the same job), hydrated via
`getBestDealOfDay()` in `src/services/api/deals-sections.ts`. The scoring
formula is duplicated in SQL to match `src/lib/deals/deal-score.ts` — change
both together when tuning weights.

Phase 19 personalisation uses `click_events.user_id` (from `/api/click/[id]`)
to build category affinity and rank recommendations in
`src/services/api/recommendations.ts`. The homepage shows a "For you" rail only
when a signed-in user exists.

Phase 20 price alerts: `public.price_alerts` (one row per user + deal) stores
`threshold_price` and `is_below_threshold` for edge detection. A scheduled
`GET /api/cron/price-alerts` (Bearer `CRON_SECRET`, `vercel.json` every 15m)
compares the latest `price_history.price` (else `deals.discount_price`) to the
threshold, sends email via Resend with tags for webhooks, and includes an HMAC
unsubscribe link (`PRICE_ALERT_UNSUBSCRIBE_SECRET`). `POST /api/webhooks/resend`
(verify with `RESEND_WEBHOOK_SECRET` + Svix) disables alerts on
`email.bounced` / `email.complained` when a `price_alert_id` tag is present.
Phase 25 adds optional **Web Push** to the same cron path after a successful send
(see `push_subscriptions` and `sendPriceAlertWebPushes`).

Phase 21 observability: **Sentry** (`SENTRY_DSN`, optional `VERCEL_ENV`) via
`sentry.server.config.ts` / `sentry.edge.config.ts`, `withSentryConfig` in
`next.config.ts`, `src/instrumentation.ts`, and `src/app/global-error.tsx`
(`beforeSend` strips cookies / sensitive headers / user email). **OpenTelemetry**
optional OTLP export when `OTEL_EXPORTER_OTLP_ENDPOINT` (or
`OTEL_EXPORTER_OTLP_TRACES_ENDPOINT`) is set — `registerNodeTelemetry()` wires a
`BasicTracerProvider`; ingest uses tracer scope **`ingest`** (`withIngestRootSpan`
in `POST /api/ingest/deals` and `npm run ingest:affiliate`). **SLO logs**: JSON
lines from `logger` scope `app:slo` with `msg: metric`, `ctx.kind=slo`, and
`op` + `durationMs` + `httpStatus` for `ingest.deals`, `click.bounce`, and
`catalog.deals.latest` (chart in Vercel / Datadog from raw logs). **PostHog**
server capture (`posthog-node`) when `POSTHOG_API_KEY` is set — event
`ingest_deal_success` on successful deal writes (no `@vercel/analytics`).

Phase 22 scale: **Rate limits** use `createRateLimiterFromEnv` in
`src/lib/security/rate-limit.ts` — when `UPSTASH_REDIS_REST_URL` and
`UPSTASH_REDIS_REST_TOKEN` are set, ingest + click limits go through Upstash
(`@upstash/ratelimit` sliding window); otherwise the in-memory limiter is used.
Redis failures **fail open** so outages do not brick public routes. **CDN:**
`/api/deals/*` list routes attach `cacheHeaders('shortFeed')` (`s-maxage=30`,
`stale-while-revalidate=120`); verify hit ratio with Vercel ``x-vercel-cache`` on
preview/prod (see `tests/load/vercel-cache.hit.test.ts`). **N+1:** carousel
loaders in `deals-sections.ts` use a single PostgREST select (or two only when a
strict query returns empty and a fallback query runs — still ≤ 2). **Supabase
pooling:** use the **pooler** host / port **6543** (transaction mode) for
serverless / high fan-out writers; direct **5432** is for long-lived sessions.

### Phase 23 — Admin console (shipped)

- **Schema:** `supabase/migrations/20260501100000_phase23_admin_console.sql` adds
  `profiles.role` (`user` \| `admin`, mutable only by `service_role` via trigger),
  `deals.admin_hidden`, `deals.admin_pinned_at`, `admin_actions`, `ingest_network_status`.
  Public deal **SELECT** RLS requires `is_active` and **not** `admin_hidden`; extra
  `deals_admin_select_all` / `deals_admin_update` policies apply when `is_profile_admin()`.
- **App:** `/admin` (layout checks `requireAdminSupabase`); middleware sends anonymous
  users to `/login?next=`. **`DEALS_ADMIN_SCHEMA=1`** gates `dealSelectColumnsForPostgrest()`
  admin columns and pin-first ordering in `deals.ts` / `deals-sections.ts`.
- **API:** `PATCH /api/admin/deals/[id]` (session + admin), `GET /api/admin/deals`,
  `GET /api/admin/ingest-status`; workers **`POST /api/ingest/network-status`** with
  `INGESTION_API_KEY` (service-role upsert, no user RLS).

### Phase 24 — Multi-network expansion (shipped)

- **Schema:** `ingest_network_settings` (`network_slug`, `ingest_enabled`, `tos_url`,
  `disclosure_note`, `attribution_note`) — RLS admin select/update; workers read via
  **`GET /api/ingest/network-config`** (ingestion bearer, service-role read).
- **Workers:** `ebay_partner.py` (OAuth + Browse API), `bestbuy_impact.py` /
  `target_impact.py` (JSON catalog URL or local fixture path). All major workers
  call `networks/ingest_gate.check_ingest_enabled_or_exit` when **`DEALASTEAL_BASE_URL`**
  is set (opt-out: **`INGEST_SKIP_NETWORK_GATE=1`**).
- **Admin:** `/admin` includes ingest enable/disable; **`PATCH /api/admin/network-settings`**.

### Phase 25 — PWA / Web Push (shipped)

- **Serwist:** `withSerwistInit` composes **inside** `withSentryConfig` in `next.config.ts`
  (Sentry remains the outer wrapper). `src/app/sw.ts` precaches `public/**` plus
  `/~offline` (see `build-serwist-precache-entries.ts`); runtime cache prepends
  `createLatestDealsListRuntimeCaching()` for **`GET /api/deals/latest`** before
  `@serwist/next/worker` `defaultCache`. Dev disables the worker (`disable: NODE_ENV === 'development'`);
  `AppSerwistProvider` mirrors that on the client.
- **Manifest / UX:** `src/app/manifest.ts`, icons under `public/pwa/`, `viewport.themeColor`
  + `appleWebApp` in `layout.tsx`. Offline shell: `src/app/~offline/page.tsx`.
- **Web Push:** `public.push_subscriptions` (user + endpoint + keys, RLS owner-only).
  **`GET/POST/DELETE /api/me/push-subscribe`** (session, `cacheHeaders('noStore')`).
  Account page: `PushNotifyOptIn` (production only — dev skips Serwist registration).
  Cron (`runPriceAlertCron`) calls `sendPriceAlertWebPushes` after a successful price-drop
  email when `NEXT_PUBLIC_VAPID_PUBLIC_KEY` + `VAPID_PRIVATE_KEY` are set. CSP
  `connect-src` allows common browser push subscription hosts.
- **CI:** `.github/workflows/lighthouse.yml` + `lighthouserc.json`; repo secrets must
  supply `NEXT_PUBLIC_SUPABASE_*` for `next build` on GitHub.

### Phase 14 — Compliance (shipped)

- Legal: `/privacy`, `/terms`, `/affiliate-disclosure`, `/dmca` (placeholder copy until counsel review).
- Consent: `CookieBanner` + `dealasteal_consent_v1` cookie; EEA full interstitial; US strip with CCPA link to `/privacy#ccpa`; default non-essential off until accept.
- Portability: `GET /api/me/export` (JSON: user, profile, saved_deals, consent); `DELETE /api/me/delete` (Auth Admin `deleteUser`).
- Outbound: deal CTAs use `/api/click/[id]`; Amazon URLs get `tag=` from env on redirect.

### `DEALS_DB_V2` (catalog column set)

- Until `supabase/migrations/20260425000000_v2_catalog_evolution.sql` is applied on your Supabase project, leave **`DEALS_DB_V2` unset** (legacy mode): PostgREST selects and ingest payloads omit `currency`, `asin`, `score`, etc., so the homepage never hits `42703`.
- After the migration succeeds, set **`DEALS_DB_V2=1`** in `.env.local` and restart `next dev` so reads/inserts include the extended columns.

### `DEALS_SEARCH_FTS` (Postgres full-text search)

- After `supabase/migrations/20260428100000_deals_fts_search.sql`, `getActiveDeals` / `searchDeals` call `search_active_deals_fts` for queries with **≥ 2** non-whitespace characters (``websearch_to_tsquery`` + ``ts_rank_cd``), and fall back to title ``ILIKE`` when the RPC is missing or returns an error, or when ``DEALS_SEARCH_FTS=0``.
- Set **`DEALS_SEARCH_FTS=0`** only if you need to disable FTS without rolling back the migration (e.g. emergency).
- Canonical browse URL for text search: **`/search?q=`** (home ``/?q=`` remains supported).

### Migrations

- Every schema change ships as a new file under `supabase/migrations/`.
- Migrations are idempotent (`IF NOT EXISTS`, `ALTER TABLE … ADD COLUMN
  IF NOT EXISTS`) so reapplying against partially-migrated environments
  doesn't break.
- RLS policies for new tables are part of the same migration — you do
  not get to add a table without specifying who can read/write it.
- **Do not edit** a migration file after it has been applied remotely (checksum /
  history drift). **`DROP … IF EXISTS`** on a first apply often prints Postgres
  `NOTICE: … does not exist, skipping` — that is normal; `db push` still finished
  successfully.

---

## 5. Affiliate ingest contract

The site never scrapes HTML. The accepted input shape is exactly the Zod
`DealIngestSchema`:

- Required: `merchant_id` (UUID), `title`, `original_price`,
  `discount_price`, `affiliate_url` (https), `is_loot_deal` (boolean).
- Optional: `description`, `image_url` (CDN whitelisted in
  `next.config.ts`), `expires_at` (ISO), `category_slug` (known slug),
  `ingest_external_id` (network-scoped key for upsert), `trust_bundle`,
  `currency`, `merchant_sku`, `asin`, `gtin`, `brand`, `rating`,
  `rating_count`, `availability`, `last_seen_at`.

Workers post to `POST /api/ingest/deals` with the bearer token in
`INGESTION_API_KEY`. The route enforces:

- `Authorization: Bearer <key>` constant-time match.
- 64KB max body cap (413 on overflow).
- Token-bucket rate limit per caller identity (429 on overflow).
- Insert vs. upsert depending on `ingest_external_id`.
- `revalidatePath('/')` and `/deals/<id>` on success.

This is the **only** legal write path into `deals`.

---

## 6. Operational guardrails

- **Secrets:** every secret read via `process.env` is gated by a helper
  that throws a clear error when missing. `.env*` is ignored by git.
- **CSP / HSTS / XFO / Permissions-Policy** are set in
  `next.config.ts`. New third-party scripts MUST be added to the CSP
  allow-lists in the same PR.
- **Image hosts:** new affiliate CDNs go in `AFFILIATE_IMAGE_HOSTS` and
  in the CSP `img-src` together; both lists are kept in sync.
- **Rate limits** today are in-memory (`createInMemoryRateLimiter`).
  The interface `RateLimiter` is the contract — moving to Upstash/Redis
  is mechanical and does not require any caller changes.

---

## 7. What's deliberately NOT here

- We do not run a separate REST/GraphQL service. PostgREST + a small set
  of Next.js route handlers are the API surface.
- We do not have a queue (yet). Ingest is synchronous HTTP. When volume
  warrants it, the worker → ingest hop is the place to add a queue,
  not somewhere upstream.
- We do not maintain a global Redux/Zustand store. Server data flows
  via RSC; client state is local to the components that need it.

If a feature needs to break any of these constraints, the architecture
doc gets updated **before** the code does.
