import { describe, expect, it } from 'vitest';
import { buildHomeDealListHref } from './deal-feed-query';

describe('buildHomeDealListHref', () => {
  it('returns / when no params', () => {
    expect(buildHomeDealListHref({})).toBe('/');
  });

  it('builds page and query', () => {
    expect(buildHomeDealListHref({ page: 2, q: 'usb hub' })).toBe(
      '/?page=2&q=usb+hub'
    );
  });

  it('includes category and resets-style omit of page 1', () => {
    expect(buildHomeDealListHref({ category: 'tech', q: 'sale' })).toBe(
      '/?q=sale&category=tech'
    );
  });

  it('includes store and numeric facets', () => {
    expect(
      buildHomeDealListHref({
        q: 'hub',
        category: 'tech',
        store: 'amazon',
        minDiscount: 25,
        maxPrice: 100,
      })
    ).toBe('/?q=hub&category=tech&store=amazon&min_disc=25&max_price=100');
  });

  it('includes loot=1 when lootDeals is true', () => {
    expect(buildHomeDealListHref({ lootDeals: true })).toBe('/?loot=1');
  });

  it('includes sort when not newest', () => {
    expect(buildHomeDealListHref({ sort: 'discount_desc' })).toBe('/?sort=discount_desc');
  });

  it('omits sort for newest', () => {
    expect(buildHomeDealListHref({ sort: 'newest', q: 'hub' })).toBe('/?q=hub');
  });
});
