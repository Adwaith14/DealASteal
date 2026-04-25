/**
 * Product analytics hooks. Intentionally decoupled from `@vercel/*` packages: Next/webpack on
 * Windows can emit broken server chunk paths for scoped vendor bundles (e.g. `@vercel.js` ENOENT).
 */
export function trackDealSaveToggle(_args: { dealId: string; save: boolean }) {
  if (typeof window === 'undefined') {
    return;
  }
  // Wire to your provider (GTM dataLayer, Plausible, etc.) when Phase 13+ instrumentation lands.
}
