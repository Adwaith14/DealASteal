import { describe, expect, it } from 'vitest';
import { collectUniqueSectionFetchErrors } from './collect-unique-section-fetch-errors';

describe('collectUniqueSectionFetchErrors', () => {
  it('drops empties and duplicates, preserves order', () => {
    expect(
      collectUniqueSectionFetchErrors('a', '', '  ', 'a', undefined, null, 'b', 'a')
    ).toEqual(['a', 'b']);
  });

  it('returns empty array when nothing useful', () => {
    expect(collectUniqueSectionFetchErrors(undefined, null, '   ')).toEqual([]);
  });
});
