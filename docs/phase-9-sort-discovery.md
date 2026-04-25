# Phase 9 — Sort / discovery

## Shipped behavior

- **URL:** `sort=newest` | `discount_desc` | `price_asc` | `price_desc`. Omitted or invalid values behave as **newest** (default).
- **Browse mode:** Any non-default sort enters the same paginated grid as search/facets (`/?sort=discount_desc` shows all active deals sorted by discount).
- **PostgREST:** `getActiveDeals` applies `order()` on `deals` — newest = `created_at desc`; discount = `discount_percentage desc`, `created_at desc`; price modes = `discount_price` asc/desc then `created_at desc`.
- **UI:** `HomeFilterBar` sort dropdown; `DealsPagination` and `buildHomeDealListHref` keep `sort` stable across pages.

## Follow-ups (not in this slice)

- Trending / engagement-based ranking (needs signals + storage).
- Preserve `sort` on nav links from category chips / PDP “more in category” if desired.
