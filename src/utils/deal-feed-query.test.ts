import { describe, expect, it } from 'vitest';
import { buildDealListHref, buildHomeDealListHref } from './deal-feed-query';

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

  it('includes sort=relevance in URL', () => {
    expect(buildHomeDealListHref({ sort: 'relevance', q: 'hub' })).toBe('/?q=hub&sort=relevance');
  });
});

describe('buildDealListHref', () => {
  it('uses /search base', () => {
    expect(buildDealListHref('/search', { q: 'laptop', page: 2 })).toBe(
      '/search?page=2&q=laptop'
    );
  });
});

describe('buildDealListHref', () => {
  it('uses custom pathname for list route', () => {
    expect(buildDealListHref('/deals', { page: 2, category: 'tech' })).toBe('/deals?page=2&category=tech');
  });

  it('includes sort for catalog', () => {
    expect(buildDealListHref('/deals', { sort: 'biggest_drop' })).toBe('/deals?sort=biggest_drop');
  });
});
