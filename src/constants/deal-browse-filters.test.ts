import { describe, expect, it } from 'vitest';
import { isDealSortKey, normalizeDealSortParam } from './deal-browse-filters';

describe('normalizeDealSortParam', () => {
  it('defaults empty and unknown to newest', () => {
    expect(normalizeDealSortParam('')).toBe('newest');
    expect(normalizeDealSortParam(null)).toBe('newest');
    expect(normalizeDealSortParam(undefined)).toBe('newest');
    expect(normalizeDealSortParam('  HOT  ')).toBe('newest');
  });

  it('accepts known keys case-insensitively', () => {
    expect(normalizeDealSortParam('DISCOUNT_DESC')).toBe('discount_desc');
    expect(normalizeDealSortParam('price_ASC')).toBe('price_asc');
  });
});

describe('isDealSortKey', () => {
  it('recognizes whitelist', () => {
    expect(isDealSortKey('newest')).toBe(true);
    expect(isDealSortKey('price_desc')).toBe(true);
    expect(isDealSortKey('random')).toBe(false);
  });
});
