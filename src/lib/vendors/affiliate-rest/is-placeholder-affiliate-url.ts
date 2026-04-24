/**
 * True when the URL is missing, unparsable, or clearly a docs/placeholder host
 * (not a real affiliate REST endpoint).
 */
export function isPlaceholderAffiliateRestUrl(raw: string | undefined): boolean {
  const trimmed = raw?.trim() ?? '';
  if (!trimmed) return true;

  try {
    const u = new URL(trimmed);
    const host = u.hostname.toLowerCase();

    if (host === 'example.com' || host === 'www.example.com') return true;
    if (host.endsWith('.example.com')) return true;
    if (host.endsWith('.example')) return true;
    if (host.includes('your-affiliate-api')) return true;

    return false;
  } catch {
    return true;
  }
}
