import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { DealDetailView } from '@/components/deals/DealDetailView';
import { FloatingContact } from '@/components/layout/FloatingContact';
import { SiteFooter } from '@/components/layout/SiteFooter';
import { SiteHeader } from '@/components/layout/SiteHeader';
import { buildDealPdpMetadata } from '@/lib/deals/build-deal-pdp-metadata';
import { getSiteOrigin } from '@/utils/site-origin';
import { createSupabaseServerClient } from '@/lib/supabase/ssr-server';
import { getActiveDealForPdp } from './get-active-deal-for-pdp';

type PageProps = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const [result, origin] = await Promise.all([getActiveDealForPdp(id), getSiteOrigin()]);
  if (!result.ok) {
    if (result.error === 'database_error') {
      return { title: 'Deal | DealASteal', robots: { index: false, follow: true } };
    }
    return { title: 'Deal | DealASteal' };
  }
  return buildDealPdpMetadata({ origin, deal: result.deal });
}

export default async function DealDetailPage({ params }: PageProps) {
  const { id } = await params;
  const [result, origin] = await Promise.all([getActiveDealForPdp(id), getSiteOrigin()]);

  if (!result.ok) {
    if (result.error === 'invalid_id' || result.error === 'not_found') {
      notFound();
    }
    return (
      <div className="min-h-dvh bg-[#f5f5f5]">
        <SiteHeader initialSearchQuery="" />
        <div
          role="alert"
          className="mx-auto max-w-2xl px-4 py-20 text-center text-gray-900"
        >
          <h1 className="text-xl font-bold">Something went wrong</h1>
          <p className="mt-2 text-gray-600">{result.message}</p>
          <Link
            href="/"
            className="mt-6 inline-block rounded-md bg-orange-500 px-5 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-orange-600"
          >
            Back to deals
          </Link>
        </div>
        <SiteFooter />
        <FloatingContact />
      </div>
    );
  }

  const dealPageUrl = `${origin}/deals/${result.deal.id}`;

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  let initialSaved: boolean | undefined;
  if (user) {
    const { data: row } = await supabase
      .from('saved_deals')
      .select('deal_id')
      .eq('user_id', user.id)
      .eq('deal_id', result.deal.id)
      .maybeSingle();
    initialSaved = row != null;
  }

  return (
    <div className="flex min-h-dvh flex-col bg-[#f5f5f5] text-gray-900">
      <SiteHeader initialSearchQuery="" />
      <DealDetailView deal={result.deal} dealPageUrl={dealPageUrl} initialSaved={initialSaved} />
      <SiteFooter />
      <FloatingContact />
    </div>
  );
}
