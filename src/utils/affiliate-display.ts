/**
 * Short store label for PDP badges, derived from the affiliate URL host.
 */
export function storeLabelFromAffiliateUrl(affiliateUrl: string): string {
  const raw = affiliateUrl?.trim() ?? '';
  if (!raw) {
    return 'Store';
  }
  try {
    const host = new URL(raw).hostname.replace(/^www\./i, '').toLowerCase();
    if (host.includes('amazon')) {
      return 'Amazon';
    }
    if (host.includes('walmart')) {
      return 'Walmart';
    }
    if (host.includes('target')) {
      return 'Target';
    }
    if (host.includes('bestbuy')) {
      return 'Best Buy';
    }
    const first = host.split('.')[0] ?? 'store';
    if (first.length === 0) {
      return 'Store';
    }
    return first.charAt(0).toUpperCase() + first.slice(1);
  } catch {
    return 'Store';
  }
}
