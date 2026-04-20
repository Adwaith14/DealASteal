import { NextResponse, type NextRequest } from 'next/server';
import { ContactMessageSchema } from '@/lib/contact-message';

export const runtime = 'nodejs';

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

  if (process.env.NODE_ENV === 'development') {
    console.info('[DealASteal] contact message received:', {
      name: parsed.data.name,
      email: parsed.data.email,
      subject: parsed.data.subject,
      messageLength: parsed.data.message.length,
    });
  }

  return NextResponse.json({ ok: true }, { status: 200 });
}
