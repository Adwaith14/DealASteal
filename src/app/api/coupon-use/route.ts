import { createHash } from 'node:crypto';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createSupabaseServerClient } from '@/lib/supabase/ssr-server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

export const runtime = 'nodejs';

const schema = z
  .object({
    couponId: z.string().uuid(),
    dealId: z.string().uuid(),
  })
  .strict();

function sha256(value: string | null | undefined): string | null {
  if (!value) return null;
  return createHash('sha256').update(value).digest('hex');
}

export async function POST(request: Request) {
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }
  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const headers = request.headers;
  const ip =
    headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    headers.get('x-real-ip') ||
    null;
  const ua = headers.get('user-agent');
  const referrer = headers.get('referer');
  const country = headers.get('x-vercel-ip-country') || headers.get('cf-ipcountry') || null;

  const { error } = await getSupabaseAdmin().from('coupon_use_events').insert({
    coupon_id: parsed.data.couponId,
    deal_id: parsed.data.dealId,
    user_id: user?.id ?? null,
    ip_hash: sha256(ip),
    ua_hash: sha256(ua),
    referrer: referrer?.slice(0, 500) ?? null,
    country,
  });
  if (error) {
    return NextResponse.json({ error: 'Database insert failed' }, { status: 500 });
  }
  return new NextResponse(null, { status: 204 });
}
