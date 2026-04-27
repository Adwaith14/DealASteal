/** @vitest-environment node */
import { NextRequest } from 'next/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { POST } from './route';

describe('POST /api/contact', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it('returns 400 when JSON is invalid', async () => {
    const request = new NextRequest('http://localhost/api/contact', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: '{',
    });
    const response = await POST(request);
    expect(response.status).toBe(400);
  });

  it('returns 400 when validation fails', async () => {
    const request = new NextRequest('http://localhost/api/contact', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name: '', email: 'bad', subject: '', message: '' }),
    });
    const response = await POST(request);
    expect(response.status).toBe(400);
    const json = await response.json();
    expect(json.error).toBe('Validation failed');
  });

  it('returns 200 for a valid payload', async () => {
    const log = vi.spyOn(console, 'info').mockImplementation(() => {});
    vi.stubEnv('NODE_ENV', 'development');

    const request = new NextRequest('http://localhost/api/contact', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        name: 'Ada',
        email: 'ada@example.com',
        subject: 'Hello',
        message: 'Short message body.',
      }),
    });
    const response = await POST(request);
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true });
    expect(log).toHaveBeenCalled();

    log.mockRestore();
    vi.unstubAllEnvs();
  });
});
