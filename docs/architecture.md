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
| `scrapers/**` | Python ingest workers | independent process; talks to the site only via the ingest HTTP API |

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

- `merchants`, `deals`, `coupons` form the catalog core.
- `price_history` records the time series of `(deal_id, observed_at,
  discount_price)`. The deal-score helper consults the rolling minimum
  to decide if "this is the lowest we've seen it".
- `click_events` records bouncer hits (`/api/click/[id]`) and powers the
  demand-momentum signal in the score. Stored values are hashed
  (IP/user-agent), never raw.
- `deals.score` is a denormalised number in [0, 100] computed by
  `computeDealScore`. It is recomputed by a scheduled Postgres job /
  worker; no code path on the read path mutates it.

The "best deal of the day" is a **product** of score, not a special
column — the homepage selects the top-scoring active deal in the last 24h.
This is intentionally swappable; the business rule lives in
`src/lib/deals/deal-score.ts`, not in SQL.

### `DEALS_DB_V2` (catalog column set)

- Until `supabase/migrations/20260425000000_v2_catalog_evolution.sql` is applied on your Supabase project, leave **`DEALS_DB_V2` unset** (legacy mode): PostgREST selects and ingest payloads omit `currency`, `asin`, `score`, etc., so the homepage never hits `42703`.
- After the migration succeeds, set **`DEALS_DB_V2=1`** in `.env.local` and restart `next dev` so reads/inserts include the extended columns.

### Migrations

- Every schema change ships as a new file under `supabase/migrations/`.
- Migrations are idempotent (`IF NOT EXISTS`, `ALTER TABLE … ADD COLUMN
  IF NOT EXISTS`) so reapplying against partially-migrated environments
  doesn't break.
- RLS policies for new tables are part of the same migration — you do
  not get to add a table without specifying who can read/write it.

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
