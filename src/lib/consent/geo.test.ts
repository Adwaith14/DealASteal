import { describe, expect, it } from 'vitest';
import { isEeaLikeCountry, isUnitedStates, normalizeCountryCode } from './geo';

describe('normalizeCountryCode', () => {
  it('uppercases two-letter codes', () => {
    expect(normalizeCountryCode('de')).toBe('DE');
  });
});

describe('isEeaLikeCountry', () => {
  it('is true for Germany', () => {
    expect(isEeaLikeCountry('DE')).toBe(true);
  });

  it('is false for unknown', () => {
    expect(isEeaLikeCountry('')).toBe(false);
    expect(isEeaLikeCountry('ZZ')).toBe(false);
  });
});

describe('isUnitedStates', () => {
  it('detects US', () => {
    expect(isUnitedStates('US')).toBe(true);
    expect(isUnitedStates('us')).toBe(true);
  });
});
