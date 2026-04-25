import 'server-only';
import type { ContactMessage } from '@/lib/contact-message';
import { escapeHtml } from '@/lib/contact/escape-html';

export type SendContactEmailResult =
  | { ok: true; delivered: true }
  | { ok: true; delivered: false; reason: 'not_configured' | 'skipped_dev' }
  | { ok: false; error: string; status?: number };

function readEnv(name: string): string {
  const v = process.env[name];
  return typeof v === 'string' ? v.trim() : '';
}

/**
 * Sends the contact form to the team inbox via [Resend](https://resend.com/docs/api-reference/emails/send-email).
 * Env: ``RESEND_API_KEY``, ``RESEND_FROM_EMAIL`` (verified sender), ``CONTACT_INBOUND_EMAIL`` (your inbox).
 * Optional: ``CONTACT_EMAIL_SKIP_SEND=1`` in **development** only — accepts without calling Resend.
 */
export async function sendContactEmail(message: ContactMessage): Promise<SendContactEmailResult> {
  const apiKey = readEnv('RESEND_API_KEY');
  const from = readEnv('RESEND_FROM_EMAIL');
  const to = readEnv('CONTACT_INBOUND_EMAIL');
  const skip =
    process.env.NODE_ENV === 'development' && readEnv('CONTACT_EMAIL_SKIP_SEND') === '1';

  if (skip) {
    return { ok: true, delivered: false, reason: 'skipped_dev' };
  }

  if (!apiKey || !from || !to) {
    if (process.env.NODE_ENV === 'development') {
      return { ok: true, delivered: false, reason: 'not_configured' };
    }
    return {
      ok: false,
      error: 'Email delivery is not configured. Set RESEND_API_KEY, RESEND_FROM_EMAIL, and CONTACT_INBOUND_EMAIL.',
    };
  }

  const safeName = escapeHtml(message.name);
  const safeSubject = escapeHtml(message.subject);
  const safeBody = escapeHtml(message.message).replace(/\r?\n/g, '<br/>');

  const html = [
    `<p><strong>From:</strong> ${safeName} &lt;${escapeHtml(message.email)}&gt;</p>`,
    `<p><strong>Subject:</strong> ${safeSubject}</p>`,
    `<hr style="border:none;border-top:1px solid #eee;margin:16px 0"/>`,
    `<p style="white-space:pre-wrap">${safeBody}</p>`,
  ].join('');

  const text = [
    `From: ${message.name} <${message.email}>`,
    `Subject: ${message.subject}`,
    '',
    message.message,
  ].join('\n');

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to: [to],
      subject: `[DealASteal contact] ${message.subject}`,
      html,
      text,
      reply_to: message.email,
    }),
  });

  if (!res.ok) {
    const raw = await res.text();
    let detail = raw;
    try {
      const j = JSON.parse(raw) as { message?: string };
      if (typeof j.message === 'string') {
        detail = j.message;
      }
    } catch {
      /* keep raw */
    }
    return { ok: false, error: detail || 'Resend request failed', status: res.status };
  }

  return { ok: true, delivered: true };
}
