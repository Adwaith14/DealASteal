/**
 * Standard ``Cache-Control`` header presets for API routes.
 *
 * - ``s-maxage`` controls the **shared cache** (CDN / Vercel edge); the
 *   browser still re-validates within ``max-age`` (left implicit ⇒ 0).
 * - ``stale-while-revalidate`` lets the CDN serve a stale copy while it
 *   refreshes asynchronously — keeps the homepage feed snappy under load.
 *
 * Routes call ``cacheHeaders('shortFeed')`` and spread the return into
 * ``NextResponse.json(body, { headers: ... })``.
 */
const PRESETS = {
  /** Public read used on the homepage hot/top/latest carousels. */
  shortFeed: 'public, s-maxage=30, stale-while-revalidate=120',
  /** Lower-velocity reads (e.g. coupon list). */
  longFeed: 'public, s-maxage=300, stale-while-revalidate=600',
  /** Per-user data: do not share. */
  noStore: 'private, no-store',
} as const;

export type CachePreset = keyof typeof PRESETS;

export function cacheHeaders(preset: CachePreset): Record<string, string> {
  return { 'Cache-Control': PRESETS[preset] };
}
