import { describe, expect, it } from 'vitest';
import { mapDealsPostgrestError } from './map-deals-postgrest-user-message';

describe('mapDealsPostgrestError', () => {
  it('returns migration hint for missing category_slug', () => {
    const msg = mapDealsPostgrestError('fallback', {
      code: '42703',
      message: 'column deals.category_slug does not exist',
    });
    expect(msg).toContain('category_slug');
    expect(msg).toContain('20260415190000_add_category_slug_to_deals.sql');
  });

  it('returns migration hint for missing ingest_external_id', () => {
    const msg = mapDealsPostgrestError('fallback', {
      code: '42703',
      message: 'column deals.ingest_external_id does not exist',
    });
    expect(msg).toContain('ingest_external_id');
    expect(msg).toContain('20260422150000_deals_ingest_external_id.sql');
  });

  it('uses raw message when no known pattern matches', () => {
    expect(mapDealsPostgrestError('fallback', { message: 'timeout', code: '57014' })).toBe(
      'timeout'
    );
  });

  it('uses fallback when message empty', () => {
    expect(mapDealsPostgrestError('fallback', { code: 'XX000' })).toBe('fallback');
  });
});
