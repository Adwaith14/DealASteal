/** @vitest-environment node */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GET, POST } from './route';

const createSupabaseServerClient = vi.fn();

vi.mock('@/lib/supabase/ssr-server', () => ({
  createSupabaseServerClient: () => createSupabaseServerClient(),
}));

describe('/api/me/saved-deals', () => {
  beforeEach(() => {
    createSupabaseServerClient.mockReset();
  });

  it('GET returns empty dealIds when not signed in', async () => {
    createSupabaseServerClient.mockResolvedValue({
      auth: {
        getUser: async () => ({ data: { user: null } }),
      },
      from: vi.fn(),
    });
    const res = await GET();
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ dealIds: [] });
  });

  it('GET returns deal ids for signed-in user', async () => {
    const selectMock = vi.fn(() =>
      Promise.resolve({
        data: [{ deal_id: 'd1' }, { deal_id: 'd2' }],
        error: null,
      })
    );
    createSupabaseServerClient.mockResolvedValue({
      auth: {
        getUser: async () => ({ data: { user: { id: 'u1' } } }),
      },
      from: vi.fn(() => ({
        select: selectMock,
      })),
    });
    const res = await GET();
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ dealIds: ['d1', 'd2'] });
    expect(selectMock).toHaveBeenCalledWith('deal_id');
  });

  it('POST returns 401 when not signed in', async () => {
    createSupabaseServerClient.mockResolvedValue({
      auth: {
        getUser: async () => ({ data: { user: null } }),
      },
      from: vi.fn(),
    });
    const res = await POST(
      new Request('http://localhost/api/me/saved-deals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dealId: '550e8400-e29b-41d4-a716-446655440000', save: true }),
      })
    );
    expect(res.status).toBe(401);
  });

  it('POST returns 400 for invalid dealId', async () => {
    createSupabaseServerClient.mockResolvedValue({
      auth: {
        getUser: async () => ({ data: { user: { id: 'u1' } } }),
      },
      from: vi.fn(),
    });
    const res = await POST(
      new Request('http://localhost/api/me/saved-deals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dealId: 'not-uuid', save: true }),
      })
    );
    expect(res.status).toBe(400);
  });

  it('POST upserts when save is true', async () => {
    const upsertMock = vi.fn(() => Promise.resolve({ error: null }));
    createSupabaseServerClient.mockResolvedValue({
      auth: {
        getUser: async () => ({ data: { user: { id: 'u1' } } }),
      },
      from: vi.fn(() => ({
        upsert: upsertMock,
      })),
    });
    const dealId = '550e8400-e29b-41d4-a716-446655440000';
    const res = await POST(
      new Request('http://localhost/api/me/saved-deals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dealId, save: true }),
      })
    );
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ ok: true, saved: true });
    expect(upsertMock).toHaveBeenCalledWith(
      { user_id: 'u1', deal_id: dealId },
      { onConflict: 'user_id,deal_id' }
    );
  });

  it('POST deletes when save is false', async () => {
    const eqInner = vi.fn(() => Promise.resolve({ error: null }));
    const eqOuter = vi.fn(() => ({ eq: eqInner }));
    const deleteMock = vi.fn(() => ({ eq: eqOuter }));
    createSupabaseServerClient.mockResolvedValue({
      auth: {
        getUser: async () => ({ data: { user: { id: 'u1' } } }),
      },
      from: vi.fn(() => ({
        delete: deleteMock,
      })),
    });
    const dealId = '550e8400-e29b-41d4-a716-446655440000';
    const res = await POST(
      new Request('http://localhost/api/me/saved-deals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dealId, save: false }),
      })
    );
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ ok: true, saved: false });
    expect(deleteMock).toHaveBeenCalled();
    expect(eqOuter).toHaveBeenCalledWith('user_id', 'u1');
    expect(eqInner).toHaveBeenCalledWith('deal_id', dealId);
  });
});
