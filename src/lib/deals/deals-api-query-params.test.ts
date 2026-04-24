import { describe, expect, it } from 'vitest';
import { parseLatestDealsQuery, parseOffsetLimitQuery } from './deals-api-query-params';

describe('parseLatestDealsQuery', () => {
  it('defaults when page or pageSize are garbage', () => {
    const sp = new URLSearchParams('page=abc&pageSize=xyz');
    expect(parseLatestDealsQuery(sp)).toEqual({ page: 1, pageSize: 36 });
  });

  it('clamps page and pageSize to sane bounds', () => {
    const sp = new URLSearchParams('page=999999&pageSize=500');
    expect(parseLatestDealsQuery(sp)).toEqual({ page: 10_000, pageSize: 96 });
  });
});

describe('parseOffsetLimitQuery', () => {
  it('defaults limit and tolerates bad offset', () => {
    const sp = new URLSearchParams('limit=not-a-number&offset=bad');
    expect(parseOffsetLimitQuery(sp, 48)).toEqual({ limit: 48, offset: 0 });
  });

  it('clamps offset upper bound', () => {
    const sp = new URLSearchParams('limit=10&offset=99999999');
    expect(parseOffsetLimitQuery(sp, 48)).toEqual({ limit: 10, offset: 50_000 });
  });
});
