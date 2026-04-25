import { NextResponse } from 'next/server';
import { z } from 'zod';
import { cacheHeaders } from '@/lib/http/cache-headers';
import { createSupabaseServerClient } from '@/lib/supabase/ssr-server';

const dealIdSchema = z.string().uuid();

const postBodySchema = z.object({
  dealId: dealIdSchema,
  save: z.boolean(),
});

export async function GET() {
  const headers = cacheHeaders('noStore');
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ dealIds: [] satisfies string[] }, { headers });
  }

  const { data, error } = await supabase.from('saved_deals').select('deal_id');
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500, headers });
  }

  const dealIds = (data ?? []).map((r) => r.deal_id as string);
  return NextResponse.json({ dealIds }, { headers });
}

export async function POST(request: Request) {
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = postBodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { dealId, save } = parsed.data;

  if (save) {
    const { error } = await supabase
      .from('saved_deals')
      .upsert({ user_id: user.id, deal_id: dealId }, { onConflict: 'user_id,deal_id' });
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true as const, saved: true as const });
  }

  const { error } = await supabase.from('saved_deals').delete().eq('user_id', user.id).eq('deal_id', dealId);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true as const, saved: false as const });
}
