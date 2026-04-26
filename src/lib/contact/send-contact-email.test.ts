/** @vitest-environment node */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn());
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('sendContactEmail', () => {
  it('returns skipped_dev when CONTACT_EMAIL_SKIP_SEND=1 in development', async () => {
    vi.stubEnv('NODE_ENV', 'development');
    vi.stubEnv('CONTACT_EMAIL_SKIP_SEND', '1');
    vi.resetModules();
    const { sendContactEmail } = await import('./send-contact-email');
    const result = await sendContactEmail({
      name: 'A',
      email: 'a@b.co',
      subject: 'S',
      message: 'M',
    });
    expect(result).toEqual({ ok: true, delivered: false, reason: 'skipped_dev' });
    expect(fetch).not.toHaveBeenCalled();
  });

  it('returns not_configured in development without Resend env', async () => {
    vi.stubEnv('NODE_ENV', 'development');
    vi.stubEnv('RESEND_API_KEY', '');
    vi.stubEnv('RESEND_FROM_EMAIL', '');
    vi.stubEnv('CONTACT_INBOUND_EMAIL', '');
    vi.resetModules();
    const { sendContactEmail } = await import('./send-contact-email');
    const result = await sendContactEmail({
      name: 'A',
      email: 'a@b.co',
      subject: 'S',
      message: 'M',
    });
    expect(result).toEqual({ ok: true, delivered: false, reason: 'not_configured' });
  });

  it('returns error in production without Resend env', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('RESEND_API_KEY', '');
    vi.resetModules();
    const { sendContactEmail } = await import('./send-contact-email');
    const result = await sendContactEmail({
      name: 'A',
      email: 'a@b.co',
      subject: 'S',
      message: 'M',
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toMatch(/not configured/i);
    }
  });

  it('calls Resend when configured', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('RESEND_API_KEY', 're_test');
    vi.stubEnv('RESEND_FROM_EMAIL', 'DealASteal <onboarding@resend.dev>');
    vi.stubEnv('CONTACT_INBOUND_EMAIL', 'inbox@example.com');
    vi.mocked(fetch).mockResolvedValue(new Response(JSON.stringify({ id: '1' }), { status: 200 }));
    vi.resetModules();
    const { sendContactEmail } = await import('./send-contact-email');
    const result = await sendContactEmail({
      name: 'Ada',
      email: 'ada@example.com',
      subject: 'Hello',
      message: 'Line1\nLine2',
    });
    expect(result).toEqual({ ok: true, delivered: true });
    expect(fetch).toHaveBeenCalledWith(
      'https://api.resend.com/emails',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer re_test',
        }),
      })
    );
    const body = JSON.parse((vi.mocked(fetch).mock.calls[0][1] as { body: string }).body);
    expect(body.to).toEqual(['inbox@example.com']);
    expect(body.reply_to).toBe('ada@example.com');
    expect(body.subject).toBe('[DealASteal contact] Hello');
    expect(body.html).toContain('Ada');
    expect(body.html).not.toContain('<script');
  });
});
