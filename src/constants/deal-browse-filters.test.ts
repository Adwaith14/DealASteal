import { describe, expect, it } from 'vitest';
import {
  normalizeLootDealsParam,
  normalizeMaxPriceParam,
  normalizeMinDiscountParam,
  normalizeStoreParam,
} from './deal-browse-filters';

describe('deal-browse-filters', () => {
  it('normalizes store keys', () => {
    expect(normalizeStoreParam('amazon')).toBe('amazon');
    expect(normalizeStoreParam('  AMAZON  ')).toBe('amazon');
    expect(normalizeStoreParam('evil')).toBeNull();
  });

  it('normalizes min discount', () => {
    expect(normalizeMinDiscountParam('25')).toBe(25);
    expect(normalizeMinDiscountParam('99')).toBeNull();
  });

  it('normalizes max price', () => {
    expect(normalizeMaxPriceParam('100')).toBe(100);
    expect(normalizeMaxPriceParam('77')).toBeNull();
  });

  it('normalizes loot deals flag', () => {
    expect(normalizeLootDealsParam('1')).toBe(true);
    expect(normalizeLootDealsParam('TRUE')).toBe(true);
    expect(normalizeLootDealsParam('yes')).toBe(true);
    expect(normalizeLootDealsParam('0')).toBe(false);
    expect(normalizeLootDealsParam('')).toBe(false);
  });
});
