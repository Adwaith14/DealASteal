/** @vitest-environment node */
import { NextRequest } from 'next/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { POST } from './route';

const sendContactEmail = vi.fn();

vi.mock('@/lib/contact/send-contact-email', () => ({
  sendContactEmail: (...args: unknown[]) => sendContactEmail(...args),
}));

describe('POST /api/contact', () => {
  beforeEach(() => {
    sendContactEmail.mockReset();
    sendContactEmail.mockResolvedValue({ ok: true, delivered: true });
  });

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
      body: JSON.stringify({ name: '', email: 'bad', subject: '', message: '', company: '' }),
    });
    const response = await POST(request);
    expect(response.status).toBe(400);
    const json = await response.json();
    expect(json.error).toBe('Validation failed');
  });

  it('returns 400 when honeypot is filled', async () => {
    const request = new NextRequest('http://localhost/api/contact', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        name: 'Ada',
        email: 'ada@example.com',
        subject: 'Hi',
        message: 'Body',
        company: 'spam',
      }),
    });
    const response = await POST(request);
    expect(response.status).toBe(400);
  });

  it('returns 200 and calls sendContactEmail for a valid payload (no PII in logs)', async () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.stubEnv('NODE_ENV', 'development');
    vi.stubEnv('LOG_LEVEL', 'debug');

    const request = new NextRequest('http://localhost/api/contact', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        name: 'Ada',
        email: 'ada@example.com',
        subject: 'Hello',
        message: 'Short message body.',
        company: '',
      }),
    });
    const response = await POST(request);
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({ ok: true, delivered: true });
    expect(sendContactEmail).toHaveBeenCalledWith({
      name: 'Ada',
      email: 'ada@example.com',
      subject: 'Hello',
      message: 'Short message body.',
    });
    const lines = logSpy.mock.calls.map((c) => String(c[0]));
    expect(lines.length).toBeGreaterThan(0);
    // Logger must not leak the email or full message body.
    for (const line of lines) {
      expect(line).not.toContain('ada@example.com');
      expect(line).not.toContain('Short message body.');
    }
    logSpy.mockRestore();
    vi.unstubAllEnvs();
  });

  it('returns 503 when email is not configured in production', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    sendContactEmail.mockResolvedValue({
      ok: false,
      error: 'Email delivery is not configured. Set RESEND_API_KEY, RESEND_FROM_EMAIL, and CONTACT_INBOUND_EMAIL.',
    });

    const request = new NextRequest('http://localhost/api/contact', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        name: 'Ada',
        email: 'ada@example.com',
        subject: 'Hello',
        message: 'Body',
        company: '',
      }),
    });
    const response = await POST(request);
    expect(response.status).toBe(503);
  });

  it('returns 200 with notice when dev accepts without delivery', async () => {
    vi.stubEnv('NODE_ENV', 'development');
    sendContactEmail.mockResolvedValue({ ok: true, delivered: false, reason: 'not_configured' });

    const request = new NextRequest('http://localhost/api/contact', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        name: 'Ada',
        email: 'ada@example.com',
        subject: 'Hello',
        message: 'Body',
        company: '',
      }),
    });
    const response = await POST(request);
    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.delivered).toBe(false);
    expect(json.notice).toMatch(/not sent/i);
  });
});
