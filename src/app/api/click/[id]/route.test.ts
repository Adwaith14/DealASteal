/** @vitest-environment node */
import { NextRequest } from 'next/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { GET } from './route';

const getActiveDealById = vi.fn();
const insertMock = vi.fn();
const fromMock = vi.fn(() => ({ insert: insertMock }));
const getUser = vi.fn();

vi.mock('@/services/api/deals', () => ({
  getActiveDealById: (...args: unknown[]) => getActiveDealById(...args),
}));

vi.mock('@/lib/supabase/admin', () => ({
  getSupabaseAdmin: () => ({ from: fromMock }),
}));

vi.mock('@/lib/supabase/ssr-server', () => ({
  createSupabaseServerClient: () =>
    Promise.resolve({
      auth: { getUser },
    }),
}));

const VALID_UUID = '660e8400-e29b-41d4-a716-446655440042';

function makeRequest(headers: Record<string, string> = {}): NextRequest {
  return new NextRequest(`http://localhost/api/click/${VALID_UUID}`, {
    method: 'GET',
    headers,
  });
}

describe('GET /api/click/[id]', () => {
  beforeEach(() => {
    getActiveDealById.mockReset();
    insertMock.mockReset();
    fromMock.mockClear();
    insertMock.mockResolvedValue({ data: null, error: null });
    getUser.mockResolvedValue({ data: { user: null }, error: null });
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('rejects malformed UUIDs with 400', async () => {
    const req = new NextRequest('http://localhost/api/click/not-a-uuid', { method: 'GET' });
    const res = await GET(req, { params: Promise.resolve({ id: 'not-a-uuid' }) });
    expect(res.status).toBe(400);
    expect(getActiveDealById).not.toHaveBeenCalled();
  });

  it('returns 404 when the deal is missing or inactive', async () => {
    getActiveDealById.mockResolvedValue({
      ok: false,
      error: 'not_found',
      message: 'Deal not found or inactive',
    });
    const res = await GET(makeRequest({ 'x-forwarded-for': '127.0.0.1' }), {
      params: Promise.resolve({ id: VALID_UUID }),
    });
    expect(res.status).toBe(404);
    expect(insertMock).not.toHaveBeenCalled();
  });

  it('redirects (302) to the affiliate url and best-effort logs the click', async () => {
    getActiveDealById.mockResolvedValue({
      ok: true,
      deal: {
        id: VALID_UUID,
        affiliate_url: 'https://www.amazon.com/dp/B0EXAMPLE?tag=dealasteal-20',
      },
    });

    const res = await GET(
      makeRequest({
        'x-forwarded-for': '203.0.113.5, 198.51.100.7',
        'user-agent': 'Mozilla/5.0 (Test)',
        referer: 'https://dealasteal.example/deals/' + VALID_UUID,
      }),
      { params: Promise.resolve({ id: VALID_UUID }) }
    );

    expect(res.status).toBe(302);
    expect(res.headers.get('location')).toBe(
      'https://www.amazon.com/dp/B0EXAMPLE?tag=dealasteal-20'
    );

    // ``recordClick`` is fire-and-forget; let the microtask flush.
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(fromMock).toHaveBeenCalledWith('click_events');
    expect(insertMock).toHaveBeenCalledTimes(1);
    const inserted = insertMock.mock.calls[0]?.[0] as Record<string, unknown>;
    expect(inserted.deal_id).toBe(VALID_UUID);
    expect(inserted.user_id).toBeNull();
    expect(typeof inserted.ip_hash).toBe('string');
    expect(typeof inserted.ua_hash).toBe('string');
    // Hashes must NOT be the raw values.
    expect(inserted.ip_hash).not.toBe('203.0.113.5');
    expect(inserted.ua_hash).not.toBe('Mozilla/5.0 (Test)');
  });

  it('appends Amazon associate tag when env set and URL lacks tag', async () => {
    vi.stubEnv('NEXT_PUBLIC_AMAZON_ASSOCIATE_TAG', 'dealasteal-20');
    getActiveDealById.mockResolvedValue({
      ok: true,
      deal: {
        id: VALID_UUID,
        affiliate_url: 'https://www.amazon.com/dp/B0EXAMPLE',
      },
    });
    const res = await GET(makeRequest(), { params: Promise.resolve({ id: VALID_UUID }) });
    expect(res.status).toBe(302);
    expect(res.headers.get('location')).toContain('tag=dealasteal-20');
  });

  it('records user_id when signed in', async () => {
    getUser.mockResolvedValue({
      data: { user: { id: '550e8400-e29b-41d4-a716-446655440000' } },
      error: null,
    });
    getActiveDealById.mockResolvedValue({
      ok: true,
      deal: { id: VALID_UUID, affiliate_url: 'https://example.com/item' },
    });
    const res = await GET(makeRequest(), { params: Promise.resolve({ id: VALID_UUID }) });
    expect(res.status).toBe(302);
    await new Promise((resolve) => setTimeout(resolve, 0));
    const inserted = insertMock.mock.calls[0]?.[0] as Record<string, unknown>;
    expect(inserted.user_id).toBe('550e8400-e29b-41d4-a716-446655440000');
  });

  it('refuses non-http(s) affiliate URLs with 422', async () => {
    getActiveDealById.mockResolvedValue({
      ok: true,
      deal: { id: VALID_UUID, affiliate_url: 'javascript:alert(1)' },
    });
    const res = await GET(makeRequest(), { params: Promise.resolve({ id: VALID_UUID }) });
    expect(res.status).toBe(422);
    expect(insertMock).not.toHaveBeenCalled();
  });
});
