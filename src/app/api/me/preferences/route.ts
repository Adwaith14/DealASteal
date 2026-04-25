import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createSupabaseServerClient } from '@/lib/supabase/ssr-server';

const bodySchema = z.object({
  digestWeekly: z.boolean(),
});

export async function POST(request: Request) {
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
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

  const { data: existing } = await supabase.from('profiles').select('preferences').eq('id', user.id).maybeSingle();

  if (!existing) {
    const { error: insertErr } = await supabase.from('profiles').insert({
      id: user.id,
      preferences: { digestWeekly: parsed.data.digestWeekly },
    });
    if (insertErr) {
      return NextResponse.json({ error: insertErr.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true as const, preferences: { digestWeekly: parsed.data.digestWeekly } });
  }

  const prev =
    existing.preferences && typeof existing.preferences === 'object' && !Array.isArray(existing.preferences)
      ? (existing.preferences as Record<string, unknown>)
      : {};
  const next = { ...prev, digestWeekly: parsed.data.digestWeekly };

  const { error } = await supabase
    .from('profiles')
    .update({ preferences: next, updated_at: new Date().toISOString() })
    .eq('id', user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true as const, preferences: next });
}
