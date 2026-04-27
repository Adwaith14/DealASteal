import { describe, expect, it } from 'vitest';
import { summarizePartnerStoresFromDeals } from './partner-stores';

describe('summarizePartnerStoresFromDeals', () => {
  it('aggregates active rows by affiliate domain', () => {
    const result = summarizePartnerStoresFromDeals([
      {
        affiliate_url: 'https://www.amazon.com/deal/a',
        discount_percentage: 20,
        created_at: '2026-04-25T10:00:00.000Z',
      },
      {
        affiliate_url: 'https://amazon.com/deal/b',
        discount_percentage: 40,
        created_at: '2026-04-25T12:00:00.000Z',
      },
      {
        affiliate_url: 'https://www.bestbuy.com/deal/c',
        discount_percentage: 30,
        created_at: '2026-04-24T12:00:00.000Z',
      },
    ]);

    expect(result).toHaveLength(2);
    expect(result[0]?.label).toBe('Amazon');
    expect(result[0]?.dealCount).toBe(2);
    expect(result[0]?.avgDiscountPct).toBe(30);
    expect(result[1]?.label).toBe('Best Buy');
  });
});
