/** @vitest-environment node */
import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { POST } from './route';

const { upsert } = vi.hoisted(() => ({
  upsert: vi.fn(() => Promise.resolve({ error: null })),
}));

vi.mock('@/lib/supabase/admin', () => ({
  getSupabaseAdmin: () => ({ from: () => ({ upsert }) }),
}));

describe('POST /api/ingest/network-status', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv('INGESTION_API_KEY', 'k');
  });

  it('returns 401 without bearer', async () => {
    const req = new NextRequest('http://localhost/api/ingest/network-status', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ network: 'amazon', ok: true }),
    });
    const res = await POST(req);
    expect(res.status).toBe(401);
    expect(upsert).not.toHaveBeenCalled();
  });

  it('upserts row with valid body', async () => {
    const req = new NextRequest('http://localhost/api/ingest/network-status', {
      method: 'POST',
      headers: {
        authorization: 'Bearer k',
        'content-type': 'application/json',
      },
      body: JSON.stringify({ network: 'walmart', ok: true, rows: 12 }),
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    expect(upsert).toHaveBeenCalledWith(
      expect.objectContaining({ network: 'walmart', last_ok: true, last_rows: 12 }),
      { onConflict: 'network' }
    );
  });
});
