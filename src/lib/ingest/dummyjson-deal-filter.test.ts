import { describe, expect, it } from 'vitest';
import { isDummyJsonIngestExternalId } from './dummyjson-deal-filter';

describe('isDummyJsonIngestExternalId', () => {
  it('returns true for dummyjson ids (case-insensitive prefix)', () => {
    expect(isDummyJsonIngestExternalId('dummyjson:1')).toBe(true);
    expect(isDummyJsonIngestExternalId('DummyJSON:42')).toBe(true);
  });

  it('returns false for other sources, empty, or null', () => {
    expect(isDummyJsonIngestExternalId(null)).toBe(false);
    expect(isDummyJsonIngestExternalId(undefined)).toBe(false);
    expect(isDummyJsonIngestExternalId('')).toBe(false);
    expect(isDummyJsonIngestExternalId('   ')).toBe(false);
    expect(isDummyJsonIngestExternalId('affiliate:sku-1')).toBe(false);
    expect(isDummyJsonIngestExternalId('amazon:B00FOO')).toBe(false);
  });
});
