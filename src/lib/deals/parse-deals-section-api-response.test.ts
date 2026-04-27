import { describe, expect, it } from 'vitest';
import { parseDealsSectionApiResponse } from './parse-deals-section-api-response';

describe('parseDealsSectionApiResponse', () => {
  it('returns ok:false when fetchError is present on 200', async () => {
    const res = new Response(
      JSON.stringify({ deals: [], total: 10, fetchError: 'column x does not exist' }),
      { status: 200 }
    );
    expect(await parseDealsSectionApiResponse(res)).toEqual({
      ok: false,
      message: 'column x does not exist',
    });
  });

  it('returns ok:true when deals and total are valid', async () => {
    const res = new Response(
      JSON.stringify({
        deals: [{ id: '550e8400-e29b-41d4-a716-446655440000' }],
        total: 1,
      }),
      { status: 200 }
    );
    const r = await parseDealsSectionApiResponse(res);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.data.total).toBe(1);
      expect(r.data.deals).toHaveLength(1);
    }
  });

  it('rejects malformed JSON body', async () => {
    const res = new Response('not json', { status: 500 });
    const r = await parseDealsSectionApiResponse(res);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.message).toContain('HTTP 500');
  });

  it('rejects object missing deals array', async () => {
    const res = new Response(JSON.stringify({ total: 3 }), { status: 200 });
    const r = await parseDealsSectionApiResponse(res);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.message).toBe('Invalid response from server.');
  });
});
