import { NextResponse } from 'next/server';
import { dealSelectColumnsForPostgrest } from '@/lib/catalog/deals-db-schema';
import { CONSENT_COOKIE_NAME, parseConsentCookie } from '@/lib/consent/cookie-store';
import { cacheHeaders } from '@/lib/http/cache-headers';
import { createSupabaseServerClient } from '@/lib/supabase/ssr-server';
import type { Deal } from '@/types/database.types';
import { cookies } from 'next/headers';

export const runtime = 'nodejs';

/**
 * CCPA-style portability export (JSON). Authenticated only; never cached.
 */
export async function GET() {
  const headers = cacheHeaders('noStore');
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers });
  }

  const cookieStore = await cookies();
  const consentRaw = cookieStore.get(CONSENT_COOKIE_NAME)?.value;
  const consent = parseConsentCookie(consentRaw ?? undefined);

  const { data: profile } = await supabase
    .from('profiles')
    .select('preferences, updated_at')
    .eq('id', user.id)
    .maybeSingle();

  const { data: savedRows, error: savedErr } = await supabase
    .from('saved_deals')
    .select('deal_id, created_at')
    .order('created_at', { ascending: false });

  if (savedErr) {
    return NextResponse.json({ error: savedErr.message }, { status: 500, headers });
  }

  const ids = (savedRows ?? []).map((r) => r.deal_id as string);
  let dealById = new Map<string, Deal>();
  if (ids.length > 0) {
    const { data: dealRows, error: dealsErr } = await supabase
      .from('deals')
      .select(dealSelectColumnsForPostgrest())
      .in('id', ids);
    if (dealsErr) {
      return NextResponse.json({ error: dealsErr.message }, { status: 500, headers });
    }
    const rows = (dealRows ?? []) as unknown as Deal[];
    dealById = new Map(rows.map((d) => [d.id, d]));
  }

  const saved_deals = (savedRows ?? []).map((row) => ({
    deal_id: row.deal_id as string,
    saved_at: row.created_at as string,
    deal: dealById.get(row.deal_id as string) ?? null,
  }));

  return NextResponse.json(
    {
      exported_at: new Date().toISOString(),
      user: { id: user.id, email: user.email },
      profile: profile ?? null,
      saved_deals,
      consent,
    },
    { headers }
  );
}
