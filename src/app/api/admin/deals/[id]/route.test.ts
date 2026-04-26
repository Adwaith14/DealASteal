/** @vitest-environment node */
import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PATCH } from './route';

const requireAdminSupabase = vi.fn();

vi.mock('@/lib/admin/require-admin', () => ({
  requireAdminSupabase: (...args: unknown[]) => requireAdminSupabase(...args),
}));

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

describe('PATCH /api/admin/deals/[id]', () => {
  const dealId = '660e8400-e29b-41d4-a716-446655440001';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 when not signed in', async () => {
    requireAdminSupabase.mockResolvedValue({ ok: false, status: 401 });
    const req = new NextRequest(`http://localhost/api/admin/deals/${dealId}`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ pinned: true }),
    });
    const res = await PATCH(req, { params: Promise.resolve({ id: dealId }) });
    expect(res.status).toBe(401);
  });

  it('returns 403 when signed in but not admin', async () => {
    requireAdminSupabase.mockResolvedValue({ ok: false, status: 403 });
    const req = new NextRequest(`http://localhost/api/admin/deals/${dealId}`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ pinned: true }),
    });
    const res = await PATCH(req, { params: Promise.resolve({ id: dealId }) });
    expect(res.status).toBe(403);
  });

  it('returns 200 and writes audit when admin patch succeeds', async () => {
    const maybeSingle = vi.fn(() => Promise.resolve({ data: { id: dealId }, error: null }));
    const select = vi.fn(() => ({ maybeSingle }));
    const eq = vi.fn(() => ({ select }));
    const update = vi.fn(() => ({ eq }));
    const insert = vi.fn(() => Promise.resolve({ error: null }));
    const from = vi.fn((table: string) => {
      if (table === 'deals') return { update };
      if (table === 'admin_actions') return { insert };
      throw new Error(`unexpected table ${table}`);
    });

    requireAdminSupabase.mockResolvedValue({
      ok: true,
      userId: '550e8400-e29b-41d4-a716-446655440099',
      supabase: { from } as never,
    });

    const req = new NextRequest(`http://localhost/api/admin/deals/${dealId}`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ pinned: false }),
    });
    const res = await PATCH(req, { params: Promise.resolve({ id: dealId }) });
    expect(res.status).toBe(200);
    expect(update).toHaveBeenCalledWith({ admin_pinned_at: null });
    expect(insert).toHaveBeenCalledWith(
      expect.objectContaining({
        actor_id: '550e8400-e29b-41d4-a716-446655440099',
        action: 'deal_patch',
        entity_type: 'deal',
        entity_id: dealId,
      })
    );
  });
});
