/** @vitest-environment node */
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { DELETE } from './route';

const getUser = vi.fn();
const deleteUser = vi.fn();

vi.mock('@/lib/supabase/ssr-server', () => ({
  createSupabaseServerClient: vi.fn(() =>
    Promise.resolve({
      auth: { getUser },
    })
  ),
}));

vi.mock('@/lib/supabase/admin', () => ({
  getSupabaseAdmin: vi.fn(() => ({
    auth: {
      admin: { deleteUser },
    },
  })),
}));

describe('DELETE /api/me/delete', () => {
  beforeEach(() => {
    getUser.mockReset();
    deleteUser.mockReset();
    deleteUser.mockResolvedValue({ error: null });
  });

  it('returns 401 when not signed in', async () => {
    getUser.mockResolvedValue({ data: { user: null }, error: null });
    const res = await DELETE();
    expect(res.status).toBe(401);
    expect(deleteUser).not.toHaveBeenCalled();
  });

  it('returns 204 and calls admin deleteUser', async () => {
    getUser.mockResolvedValue({
      data: { user: { id: '550e8400-e29b-41d4-a716-446655440099' } },
      error: null,
    });
    const res = await DELETE();
    expect(res.status).toBe(204);
    expect(deleteUser).toHaveBeenCalledWith('550e8400-e29b-41d4-a716-446655440099');
  });
});
