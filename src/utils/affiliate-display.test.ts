import { describe, expect, it } from 'vitest';
import { storeLabelFromAffiliateUrl } from './affiliate-display';

describe('storeLabelFromAffiliateUrl', () => {
  it('detects Amazon hosts', () => {
    expect(storeLabelFromAffiliateUrl('https://www.amazon.com/dp/B00')).toBe('Amazon');
    expect(storeLabelFromAffiliateUrl('https://smile.amazon.co.uk/x')).toBe('Amazon');
  });

  it('title-cases unknown hosts', () => {
    expect(storeLabelFromAffiliateUrl('https://www.example-shop.com/go')).toBe('Example-shop');
  });

  it('returns Store for empty or invalid input', () => {
    expect(storeLabelFromAffiliateUrl('')).toBe('Store');
    expect(storeLabelFromAffiliateUrl('not-a-url')).toBe('Store');
  });
});
