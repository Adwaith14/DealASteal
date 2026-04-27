import { describe, expect, it } from 'vitest';
import { normalizeCatalogSortParam } from './deal-browse-filters';

describe('normalizeCatalogSortParam', () => {
  it('accepts known sort keys', () => {
    expect(normalizeCatalogSortParam('popular')).toBe('popular');
    expect(normalizeCatalogSortParam('NEWEST')).toBe('newest');
    expect(normalizeCatalogSortParam('biggest_drop')).toBe('biggest_drop');
  });

  it('returns null for unknown or empty', () => {
    expect(normalizeCatalogSortParam('relevance')).toBeNull();
    expect(normalizeCatalogSortParam('')).toBeNull();
    expect(normalizeCatalogSortParam(null)).toBeNull();
  });
});
