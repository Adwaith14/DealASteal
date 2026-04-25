/**
 * Canonical base URL for sitemaps, RSS, and absolute Open Graph images when
 * request headers are unavailable (e.g. build-time ``sitemap.ts``).
 */
export function getPublicSiteBaseUrl(): string {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (fromEnv) {
    return fromEnv.replace(/\/$/, '');
  }
  const vercel = process.env.VERCEL_URL?.trim();
  if (vercel) {
    return `https://${vercel.replace(/\/$/, '')}`;
  }
  return 'http://localhost:3000';
}
