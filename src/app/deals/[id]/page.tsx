import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { DealDetailView } from '@/components/deals/DealDetailView';
import { FloatingContact } from '@/components/layout/FloatingContact';
import { SiteFooter } from '@/components/layout/SiteFooter';
import { SiteHeader } from '@/components/layout/SiteHeader';
import { getActiveDealById } from '@/services/api/deals';
import { getSiteOrigin } from '@/utils/site-origin';

type PageProps = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const result = await getActiveDealById(id);
  if (!result.ok) {
    return { title: 'Deal | DealASteal' };
  }
  return {
    title: `${result.deal.title} | DealASteal`,
    description: result.deal.description ?? `Save on ${result.deal.title}`,
    openGraph: {
      title: result.deal.title,
      type: 'website',
    },
  };
}

export default async function DealDetailPage({ params }: PageProps) {
  const { id } = await params;
  const [result, origin] = await Promise.all([getActiveDealById(id), getSiteOrigin()]);

  if (!result.ok) {
    if (result.error === 'invalid_id' || result.error === 'not_found') {
      notFound();
    }
    return (
      <div className="min-h-dvh bg-[#f5f5f5]">
        <SiteHeader initialSearchQuery="" />
        <div className="mx-auto max-w-2xl px-4 py-20 text-center text-gray-900">
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

  return (
    <div className="flex min-h-dvh flex-col bg-[#f5f5f5] text-gray-900">
      <SiteHeader initialSearchQuery="" />
      <DealDetailView deal={result.deal} dealPageUrl={dealPageUrl} />
      <SiteFooter />
      <FloatingContact />
    </div>
  );
}
