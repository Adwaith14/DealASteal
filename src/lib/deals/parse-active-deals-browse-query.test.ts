import { describe, expect, it } from 'vitest';
import { parseActiveDealsBrowseFromSearchParams } from './parse-active-deals-browse-query';

describe('parseActiveDealsBrowseFromSearchParams', () => {
  it('defaults page and pageSize', () => {
    const q = parseActiveDealsBrowseFromSearchParams({});
    expect(q.page).toBe(1);
    expect(q.pageSize).toBe(12);
  });

  it('parses facets and sort', () => {
    const q = parseActiveDealsBrowseFromSearchParams({
      page: '2',
      pageSize: '24',
      q: 'usb',
      category: 'tech',
      store: 'amazon',
      max_price: '100',
      min_disc: '25',
      loot: '1',
      sort: 'popular',
    });
    expect(q.page).toBe(2);
    expect(q.pageSize).toBe(24);
    expect(q.query).toBe('usb');
    expect(q.sort).toBe('popular');
    expect(q.lootOnly).toBe(true);
    expect(q.minDiscount).toBe(25);
    expect(q.maxPrice).toBe(100);
  });
});
