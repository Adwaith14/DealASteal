import { NextResponse } from 'next/server';
import { z } from 'zod';
import { cacheHeaders } from '@/lib/http/cache-headers';
import { createSupabaseServerClient } from '@/lib/supabase/ssr-server';

const subscriptionSchema = z.object({
  endpoint: z.string().url(),
  keys: z.object({
    p256dh: z.string().min(1),
    auth: z.string().min(1),
  }),
});

const deleteBodySchema = z.object({
  endpoint: z.string().url(),
});

export async function GET() {
  const headers = cacheHeaders('noStore');
  const key = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY?.trim() ?? '';
  return NextResponse.json({ vapidPublicKey: key.length > 0 ? key : null }, { headers });
}

export async function POST(request: Request) {
  const headers = cacheHeaders('noStore');
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400, headers });
  }

  const parsed = subscriptionSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400, headers });
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers });
  }

  const { endpoint, keys } = parsed.data;
  const { error } = await supabase.from('push_subscriptions').upsert(
    {
      user_id: user.id,
      endpoint,
      p256dh: keys.p256dh,
      auth: keys.auth,
    },
    { onConflict: 'user_id,endpoint' }
  );

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500, headers });
  }

  return NextResponse.json({ ok: true as const }, { headers });
}

export async function DELETE(request: Request) {
  const headers = cacheHeaders('noStore');
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400, headers });
  }

  const parsed = deleteBodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400, headers });
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers });
  }

  const { error } = await supabase
    .from('push_subscriptions')
    .delete()
    .eq('user_id', user.id)
    .eq('endpoint', parsed.data.endpoint);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500, headers });
  }

  return NextResponse.json({ ok: true as const }, { headers });
}
