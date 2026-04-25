import Link from 'next/link';
import { redirect } from 'next/navigation';
import { DealCard } from '@/components/deals/DealCard';
import { SiteFooter } from '@/components/layout/SiteFooter';
import { SiteHeader } from '@/components/layout/SiteHeader';
import { createSupabaseServerClient } from '@/lib/supabase/ssr-server';
import { getSiteOrigin } from '@/utils/site-origin';
import type { Deal } from '@/types/database.types';
import { DigestPreferenceForm } from './DigestPreferenceForm';
import { signOutAction } from './actions';

const DEAL_FIELDS =
  'id, merchant_id, title, description, original_price, discount_price, discount_percentage, affiliate_url, image_url, is_loot_deal, is_active, expires_at, created_at, category_slug, ingest_external_id, trust_bundle' as const;

export default async function AccountPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) {
    redirect('/login?next=/account');
  }

  let { data: profile } = await supabase.from('profiles').select('preferences').eq('id', user.id).maybeSingle();
  if (!profile) {
    await supabase.from('profiles').insert({ id: user.id });
    ({ data: profile } = await supabase.from('profiles').select('preferences').eq('id', user.id).maybeSingle());
  }

  const prefs =
    profile?.preferences &&
    typeof profile.preferences === 'object' &&
    !Array.isArray(profile.preferences)
      ? (profile.preferences as Record<string, unknown>)
      : {};
  const digestWeekly = Boolean(prefs.digestWeekly);

  const { data: savedRows } = await supabase
    .from('saved_deals')
    .select('deal_id, created_at')
    .order('created_at', { ascending: false });

  const ids = (savedRows ?? []).map((r) => r.deal_id as string);
  let orderedDeals: Deal[] = [];
  if (ids.length > 0) {
    const { data: dealRows } = await supabase
      .from('deals')
      .select(DEAL_FIELDS)
      .in('id', ids)
      .eq('is_active', true);
    const byId = new Map((dealRows ?? []).map((d) => [d.id as string, d as Deal]));
    orderedDeals = ids.map((id) => byId.get(id)).filter((d): d is Deal => d != null);
  }

  const origin = await getSiteOrigin();

  return (
    <div className="flex min-h-dvh flex-col bg-[#f5f5f5] text-gray-900">
      <SiteHeader initialSearchQuery="" />
      <main id="main-content" className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-6">
        <div className="flex flex-col gap-4 border-b border-gray-200 pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900">Account</h1>
            <p className="mt-1 text-sm text-gray-600">{user.email}</p>
          </div>
          <form action={signOutAction}>
            <button
              type="submit"
              className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-bold text-gray-800 shadow-sm transition hover:bg-gray-50"
            >
              Sign out
            </button>
          </form>
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_280px]">
          <section>
            <h2 className="text-lg font-extrabold text-gray-900">Saved deals</h2>
            {orderedDeals.length === 0 ? (
              <p className="mt-3 text-sm text-gray-600">
                No saves yet. Use the heart on a deal card or product page.
              </p>
            ) : (
              <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-3 lg:grid-cols-4">
                {orderedDeals.map((deal, i) => (
                  <DealCard
                    key={deal.id}
                    deal={deal}
                    priority={i < 4}
                    dealPageUrl={`${origin}/deals/${deal.id}`}
                  />
                ))}
              </div>
            )}
          </section>
          <aside className="space-y-6">
            <DigestPreferenceForm initialDigestWeekly={digestWeekly} />
            <p className="text-xs text-gray-500">
              <Link href="/" className="font-semibold text-[#D32F2F] underline hover:text-red-800">
                ← Back to deals
              </Link>
            </p>
          </aside>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
