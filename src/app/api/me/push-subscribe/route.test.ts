/** @vitest-environment node */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DELETE, GET, POST } from './route';

const createSupabaseServerClient = vi.fn();

vi.mock('@/lib/supabase/ssr-server', () => ({
  createSupabaseServerClient: () => createSupabaseServerClient(),
}));

describe('/api/me/push-subscribe', () => {
  beforeEach(() => {
    createSupabaseServerClient.mockReset();
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY = 'test-public-key';
  });

  it('GET returns null vapid key when unset', async () => {
    const prev = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    delete process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    try {
      const res = await GET();
      expect(res.status).toBe(200);
      await expect(res.json()).resolves.toEqual({ vapidPublicKey: null });
    } finally {
      if (prev === undefined) {
        delete process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      } else {
        process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY = prev;
      }
    }
  });

  it('GET returns trimmed public key when set', async () => {
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY = '  pk  ';
    const res = await GET();
    await expect(res.json()).resolves.toEqual({ vapidPublicKey: 'pk' });
  });

  it('POST returns 401 when not signed in', async () => {
    createSupabaseServerClient.mockResolvedValue({
      auth: { getUser: async () => ({ data: { user: null } }) },
      from: vi.fn(),
    });
    const res = await POST(
      new Request('http://localhost/api/me/push-subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          endpoint: 'https://updates.push.services.mozilla.com/wpush/v2/gAAAA',
          keys: { p256dh: 'x', auth: 'y' },
        }),
      })
    );
    expect(res.status).toBe(401);
  });

  it('POST upserts subscription when signed in', async () => {
    const upsertMock = vi.fn(() => Promise.resolve({ error: null }));
    createSupabaseServerClient.mockResolvedValue({
      auth: { getUser: async () => ({ data: { user: { id: 'u1' } } }) },
      from: vi.fn(() => ({
        upsert: upsertMock,
      })),
    });
    const body = {
      endpoint: 'https://updates.push.services.mozilla.com/wpush/v2/gAAAA',
      keys: { p256dh: 'p256', auth: 'au' },
    };
    const res = await POST(
      new Request('http://localhost/api/me/push-subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
    );
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ ok: true });
    expect(upsertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: 'u1',
        endpoint: body.endpoint,
        p256dh: 'p256',
        auth: 'au',
      }),
      { onConflict: 'user_id,endpoint' }
    );
  });

  it('DELETE removes subscription for endpoint', async () => {
    const secondEq = vi.fn(() => Promise.resolve({ error: null }));
    const firstEq = vi.fn(() => ({ eq: secondEq }));
    createSupabaseServerClient.mockResolvedValue({
      auth: { getUser: async () => ({ data: { user: { id: 'u1' } } }) },
      from: vi.fn(() => ({
        delete: () => ({
          eq: firstEq,
        }),
      })),
    });
    const endpoint = 'https://example.com/ep';
    const res = await DELETE(
      new Request('http://localhost/api/me/push-subscribe', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endpoint }),
      })
    );
    expect(res.status).toBe(200);
    expect(firstEq).toHaveBeenCalledWith('user_id', 'u1');
    expect(secondEq).toHaveBeenCalledWith('endpoint', endpoint);
  });
});
