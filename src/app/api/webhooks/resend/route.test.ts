/** @vitest-environment node */
import { NextRequest } from 'next/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { POST } from './route';

const eqMock = vi.fn(() => Promise.resolve({ error: null }));
const updateMock = vi.fn(() => ({ eq: eqMock }));

vi.mock('@/lib/supabase/admin', () => ({
  getSupabaseAdmin: () => ({
    from: () => ({
      update: updateMock,
    }),
  }),
}));

describe('/api/webhooks/resend', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv('NODE_ENV', 'development');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('disables alert by price_alert_id tag (dev, no secret)', async () => {
    const body = JSON.stringify({
      type: 'email.bounced',
      data: { to: ['x@y.com'], tags: { price_alert_id: 'aa0e8400-e29b-41d4-a716-446655440001' } },
    });
    const req = new NextRequest('http://localhost/api/webhooks/resend', {
      method: 'POST',
      body,
    });
    const res = await POST(req);
    const json = (await res.json()) as { ok?: boolean; disabled?: string };
    expect(res.status).toBe(200);
    expect(json.ok).toBe(true);
    expect(json.disabled).toBe('by_id');
    expect(updateMock).toHaveBeenCalled();
  });
});
