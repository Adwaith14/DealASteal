/** @vitest-environment node */
import { describe, expect, it, vi } from 'vitest';
import { GET, PATCH } from './route';

const requireAdminSupabase = vi.fn();

vi.mock('@/lib/admin/require-admin', () => ({
  requireAdminSupabase: (...args: unknown[]) => requireAdminSupabase(...args),
}));

describe('/api/admin/network-settings', () => {
  it('GET returns 403 when not admin', async () => {
    requireAdminSupabase.mockResolvedValue({ ok: false, status: 403 });
    const res = await GET();
    expect(res.status).toBe(403);
  });

  it('PATCH updates when admin', async () => {
    const eq = vi.fn(() => Promise.resolve({ error: null }));
    const update = vi.fn(() => ({ eq }));
    const from = vi.fn((t: string) => {
      if (t === 'ingest_network_settings') return { update };
      return {};
    });
    requireAdminSupabase.mockResolvedValue({
      ok: true,
      userId: 'u1',
      supabase: { from } as never,
    });

    const req = new Request('http://localhost/api/admin/network-settings', {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ network_slug: 'ebay', ingest_enabled: true }),
    });
    const res = await PATCH(req);
    expect(res.status).toBe(200);
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({ ingest_enabled: true, updated_at: expect.any(String) })
    );
  });
});
