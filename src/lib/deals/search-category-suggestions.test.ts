import { describe, expect, it } from 'vitest';
import { suggestDealCategoriesFromQuery } from './search-category-suggestions';

describe('suggestDealCategoriesFromQuery', () => {
  it('returns empty for blank', () => {
    expect(suggestDealCategoriesFromQuery('')).toEqual([]);
    expect(suggestDealCategoriesFromQuery('   ')).toEqual([]);
  });

  it('matches slug substring', () => {
    expect(suggestDealCategoriesFromQuery('best tech deals')).toContain('tech');
  });

  it('matches label text', () => {
    expect(suggestDealCategoriesFromQuery('Fashion sale')).toContain('fashion');
  });
});
