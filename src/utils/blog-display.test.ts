import { describe, expect, it } from 'vitest';
import { formatBlogListDate } from './blog-display';

describe('formatBlogListDate', () => {
  it('formats an ISO calendar date in US long form', () => {
    expect(formatBlogListDate('2026-03-24')).toBe('March 24, 2026');
  });

  it('returns the input when the date is invalid', () => {
    expect(formatBlogListDate('not-a-date')).toBe('not-a-date');
  });
});
