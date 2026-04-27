import type { Metadata } from 'next';
import type { Deal } from '@/types/database.types';

function absoluteImageUrl(origin: string, imageUrl: string | null): string | undefined {
  if (!imageUrl || !imageUrl.trim()) return undefined;
  const t = imageUrl.trim();
  if (/^https?:\/\//i.test(t)) return t;
  try {
    return new URL(t, origin.endsWith('/') ? origin : `${origin}/`).toString();
  } catch {
    return undefined;
  }
}

/** Open Graph / Twitter / canonical for a deal PDP (``origin`` from ``getSiteOrigin()``). */
export function buildDealPdpMetadata(opts: { origin: string; deal: Deal }): Metadata {
  const { origin, deal } = opts;
  const base = origin.replace(/\/$/, '');
  const pageUrl = `${base}/deals/${deal.id}`;
  const image = absoluteImageUrl(base, deal.image_url);

  return {
    metadataBase: new URL(base),
    title: `${deal.title} | DealASteal`,
    description: deal.description?.trim() || `Save on ${deal.title}`,
    alternates: { canonical: pageUrl },
    openGraph: {
      title: deal.title,
      description: deal.description?.trim() || `Save on ${deal.title}`,
      type: 'website',
      url: pageUrl,
      ...(image ? { images: [{ url: image, alt: deal.title }] } : {}),
    },
    twitter: {
      card: image ? 'summary_large_image' : 'summary',
      title: deal.title,
      description: deal.description?.trim() || `Save on ${deal.title}`,
      ...(image ? { images: [image] } : {}),
    },
  };
}
