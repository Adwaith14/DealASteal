/** @vitest-environment node */
import { NextRequest } from 'next/server';
import { describe, expect, it, vi } from 'vitest';
import { GET } from './route';

const order = vi.fn(() =>
  Promise.resolve({
    data: [
      {
        network_slug: 'ebay',
        ingest_enabled: false,
        tos_url: 'https://www.ebay.com/help/policies/',
        disclosure_note: null,
        attribution_note: null,
        updated_at: '2026-01-01T00:00:00.000Z',
      },
    ],
    error: null,
  })
);
const select = vi.fn(() => ({ order }));

vi.mock('@/lib/supabase/admin', () => ({
  getSupabaseAdmin: () => ({ from: () => ({ select }) }),
}));

describe('GET /api/ingest/network-config', () => {
  it('returns 401 without bearer', async () => {
    const req = new NextRequest('http://localhost/api/ingest/network-config');
    const res = await GET(req);
    expect(res.status).toBe(401);
  });

  it('returns network map with bearer', async () => {
    vi.stubEnv('INGESTION_API_KEY', 'secret');
    const req = new NextRequest('http://localhost/api/ingest/network-config', {
      headers: { authorization: 'Bearer secret' },
    });
    const res = await GET(req);
    expect(res.status).toBe(200);
    const j = (await res.json()) as { networks: Record<string, { ingestEnabled: boolean }> };
    expect(j.networks.ebay.ingestEnabled).toBe(false);
  });
});
