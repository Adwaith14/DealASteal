import { NextResponse, type NextRequest } from 'next/server';
import { ContactMessageSchema } from '@/lib/contact-message';
import { sendContactEmail } from '@/lib/contact/send-contact-email';
import { logger } from '@/lib/observability/logger';

export const runtime = 'nodejs';

const log = logger.child('api/contact');

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = ContactMessageSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', issues: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { company: _company, ...message } = parsed.data;

  // PII redaction is enforced by the logger; only safe metrics are passed.
  log.info('contact message received', {
    subjectLength: message.subject.length,
    messageLength: message.message.length,
  });

  const sent = await sendContactEmail(message);
  if (!sent.ok) {
    const fallback = sent.error.toLowerCase().includes('not configured') ? 503 : 502;
    const status =
      sent.status != null && sent.status >= 400 && sent.status < 600 ? sent.status : fallback;
    return NextResponse.json({ error: sent.error }, { status });
  }

  return NextResponse.json(
    {
      ok: true as const,
      delivered: sent.delivered,
      ...(sent.delivered ? {} : { notice: 'Message accepted; email was not sent (dev / missing provider).' }),
    },
    { status: 200 }
  );
}
