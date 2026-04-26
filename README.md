# DealASteal

## Supabase database migrations (operators)

Schema lives in `supabase/migrations/`. **The hosted project does not pick up new SQL until you apply it.**

### 1. Install the Supabase CLI (Windows)

`supabase` must be on your PATH (or run via `npx` from this repo).

**Option A — Scoop (recommended by Supabase)**

```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
iwr -useb get.scoop.sh | iex
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase
supabase --version
```

**Option B — `npx` (no global install)**

From the repo root, use the npm scripts below; they call `npx supabase …`.  
If `npx` fails with download errors, use Scoop or download **`supabase_windows_amd64.tar.gz`** from [Supabase CLI releases](https://github.com/supabase/cli/releases), extract `supabase.exe`, and put the folder on your PATH.

> `npm install -g supabase` is **not** supported by Supabase.

### 2. Link the remote project (once per machine / clone)

```powershell
cd C:\Users\kulka\DealASteal
npm run db:link
```

Use the **project ref** from Supabase Dashboard → **Project Settings → General** (looks like `abcdxyz`).

### 3. Push pending migrations to Supabase

```powershell
npm run db:push
```

Check what the CLI thinks is applied:

```powershell
npm run db:migration:list
```

### 4. If you cannot use the CLI

Open **Supabase Dashboard → SQL Editor** and run each file in `supabase/migrations/` **in filename order** (oldest timestamp first).

After **`20260425000000_v2_catalog_evolution.sql`**, set `DEALS_DB_V2=1` in `.env.local` and restart Next.js (see `docs/architecture.md`).

After **`20260428100000_deals_fts_search.sql`**, text search uses Postgres FTS by default. Set **`DEALS_SEARCH_FTS=0`** only if you need to force legacy title `ILIKE` without rolling back that migration.

## Live catalog (replace DummyJSON demo deals)

The homepage reads **only** from Supabase. Demo stock comes from DummyJSON (`ingest_external_id` like `dummyjson:%`). Real stock comes from your ingest pipeline (e.g. affiliate REST → `POST /api/ingest/deals`).

1. **Env** — In `.env.local`: `DEALS_DB_V2=1`, `NEXT_PUBLIC_SUPABASE_*`, anon + service role keys as already set for dev.
2. **Remove demo deals** (keeps non-DummyJSON rows):

   ```powershell
   npm run catalog:purge-dummyjson -- --yes-i-know --refresh-scores
   ```

   Omit `--refresh-scores` if the RPC is unavailable; you can run `select public.refresh_deal_scores();` in the SQL editor instead.

3. **Load real offers** — Point `AFFILIATE_REST_OFFERS_URL` at your network’s REST feed (not a placeholder). With the dev server running (e.g. port **3010**), set `INGEST_SITE_URL=http://localhost:3010`, `INGESTION_API_KEY` (same secret the ingest route expects), and optional `AFFILIATE_DEFAULT_MERCHANT_ID` / `INGEST_MERCHANT_ID` (UUID of a row in `merchants`). Then:

   ```powershell
   npm run ingest:affiliate
   ```

   Dry-run against the bundled fixture: `npm run ingest:affiliate:dry` (no writes).

4. **Full wipe + re-demo** (destructive, all deals/coupons) — `npm run demo:reset-deals` with `--yes-i-know` (see `scripts/reset-and-seed-demo-deals.ts`).
