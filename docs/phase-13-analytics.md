# Phase 13 — Analytics (baseline)

## Shipped in repo

- **Hook only:** `trackDealSaveToggle` in `src/lib/analytics/product-events.ts` (no-op stub for now). Called after a successful save/unsave via `/api/me/saved-deals`.

## Why not `@vercel/analytics` in-app

Next.js webpack on **Windows** can fail at runtime with **ENOENT** on server chunks named like `.next/server/vendor-chunks/@vercel.js` (scoped package path). That breaks RSC pages and `/_vercel/insights/script.js`. Instrumentation should use a **script-tag or provider** that does not pull `@vercel/analytics` into the server bundle, or wait for upstream fixes.

## Follow-ups

- Add GTM / GA4 / Plausible via `next/script` + env flag (after Phase 14 consent if needed).
- Optional: Vercel Analytics via **inline script** from dashboard snippet only (no npm package).
