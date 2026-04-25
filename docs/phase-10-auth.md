# Phase 10 — Auth, saved deals, preferences

## Apply database changes

Run migration `20260423140000_saved_deals_profiles.sql` on your Supabase project (CLI `db push` / SQL editor).

## Supabase Auth (dashboard)

1. **Authentication → Providers → Email** — enable Magic link / OTP (passwordless).
2. **Authentication → URL configuration** — add your site URL and redirect allow list, including:
   - `https://<your-domain>/auth/callback`
   - `http://localhost:3000/auth/callback` (local)

## App behavior

- **`@supabase/ssr`**: cookie-backed session; **`middleware.ts`** refreshes the user; **`/auth/callback`** exchanges the OTP `code` for a session.
- **Browser client** (`getSupabaseBrowserClient` / `src/lib/supabase/client.ts`) uses `createBrowserClient` so auth matches server RLS.
- **Server-only anon singleton** (`getSupabaseServerAnon`) stays **sessionless** for public catalog queries.
- **`saved_deals`**: authenticated users save/remove via **`POST /api/me/saved-deals`**; **`GET /api/me/saved-deals`** lists ids (used by card heart + cache).
- **`profiles.preferences`**: JSON blob; **`POST /api/me/preferences`** accepts `{ digestWeekly: boolean }` (weekly digest flag for future email).
- **Pages**: `/login` (magic link), `/account` (saved grid + preferences + sign out).

## Follow-ups

- Email sending for digest (Phase 11+).
- OAuth providers, password flow, email change.
