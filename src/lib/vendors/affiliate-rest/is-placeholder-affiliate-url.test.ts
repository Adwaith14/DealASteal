import { describe, expect, it } from 'vitest';
import { isPlaceholderAffiliateRestUrl } from './is-placeholder-affiliate-url';

describe('isPlaceholderAffiliateRestUrl', () => {
  it('treats empty as placeholder', () => {
    expect(isPlaceholderAffiliateRestUrl(undefined)).toBe(true);
    expect(isPlaceholderAffiliateRestUrl('')).toBe(true);
    expect(isPlaceholderAffiliateRestUrl('   ')).toBe(true);
  });

  it('flags common doc hosts', () => {
    expect(isPlaceholderAffiliateRestUrl('https://your-affiliate-api.example/offers')).toBe(true);
    expect(isPlaceholderAffiliateRestUrl('https://api.example.com/v1')).toBe(true);
  });

  it('allows normal production-looking URLs', () => {
    expect(isPlaceholderAffiliateRestUrl('https://api.impact.com/foo')).toBe(false);
    expect(isPlaceholderAffiliateRestUrl('https://feed.partner.net/offers')).toBe(false);
  });
});
