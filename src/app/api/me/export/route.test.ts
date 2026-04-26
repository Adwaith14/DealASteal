/** @vitest-environment node */
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { GET } from './route';

const { consentCookieValue } = vi.hoisted(() => {
  const decision = {
    decidedAt: '2026-01-01T00:00:00.000Z',
    necessary: true as const,
    analytics: false,
    marketing: false,
    version: 1 as const,
  };
  return { consentCookieValue: encodeURIComponent(JSON.stringify(decision)) };
});

const getUser = vi.fn();
const fromMock = vi.fn();

vi.mock('@/lib/supabase/ssr-server', () => ({
  createSupabaseServerClient: vi.fn(() =>
    Promise.resolve({
      auth: { getUser },
      from: fromMock,
    })
  ),
}));

vi.mock('@/lib/catalog/deals-db-schema', () => ({
  dealSelectColumnsForPostgrest: () => 'id,title',
}));

vi.mock('next/headers', () => ({
  cookies: vi.fn(() =>
    Promise.resolve({
      get: (name: string) =>
        name === 'dealasteal_consent_v1' ? { value: consentCookieValue } : undefined,
    })
  ),
}));

describe('GET /api/me/export', () => {
  beforeEach(() => {
    getUser.mockReset();
    fromMock.mockReset();
  });

  it('returns 401 when not signed in', async () => {
    getUser.mockResolvedValue({ data: { user: null }, error: null });
    const res = await GET();
    expect(res.status).toBe(401);
  });

  it('returns JSON with profile, saved_deals, consent', async () => {
    getUser.mockResolvedValue({
      data: { user: { id: 'u1', email: 'a@b.c' } },
      error: null,
    });

    const selectProfiles = vi.fn(() => ({
      eq: vi.fn(() => ({
        maybeSingle: vi.fn(() => Promise.resolve({ data: { preferences: { x: 1 }, updated_at: 't' }, error: null })),
      })),
    }));

    const selectSaved = vi.fn(() => ({
      order: vi.fn(() =>
        Promise.resolve({
          data: [{ deal_id: 'd1', created_at: '2026-01-02' }],
          error: null,
        })
      ),
    }));

    const selectDeals = vi.fn(() => ({
      in: vi.fn(() =>
        Promise.resolve({
          data: [{ id: 'd1', title: 'Deal one' }],
          error: null,
        })
      ),
    }));

    fromMock.mockImplementation((table: string) => {
      if (table === 'profiles') return { select: selectProfiles };
      if (table === 'saved_deals') return { select: selectSaved };
      if (table === 'deals') return { select: selectDeals };
      return { select: vi.fn() };
    });

    const res = await GET();
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.user.email).toBe('a@b.c');
    expect(json.profile).toEqual({ preferences: { x: 1 }, updated_at: 't' });
    expect(json.saved_deals).toHaveLength(1);
    expect(json.saved_deals[0].deal_id).toBe('d1');
    expect(json.saved_deals[0].deal?.title).toBe('Deal one');
    expect(json.consent?.version).toBe(1);
    expect(json.consent?.analytics).toBe(false);
  });
});
