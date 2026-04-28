import type { Deal } from '@/types/database.types';
import type { CuratedSortMode } from '@/services/api/deals-sections';
import { CuratedDealGridSection } from '@/components/marketing/CuratedDealGridSection';

export type CuratedBuckets = Record<CuratedSortMode, Deal[]>;

const SECTIONS: {
  id: string;
  headingId: string;
  label: string;
  mode: CuratedSortMode;
}[] = [
  { id: 'home-popular', headingId: 'home-popular-heading', label: 'Popular Deals', mode: 'popular' },
  { id: 'home-newest', headingId: 'home-newest-heading', label: 'Latest Deals', mode: 'newest' },
  {
    id: 'home-biggest-price-drop',
    headingId: 'home-biggest-price-drop-heading',
    label: 'Biggest Price Drop',
    mode: 'biggest_drop',
  },
];

type CuratedForYouSectionProps = {
  buckets: CuratedBuckets;
};

export function CuratedForYouSection({ buckets }: CuratedForYouSectionProps) {
  return (
    <div className="space-y-10 py-6">
      {SECTIONS.map(({ id, headingId, label, mode }) => (
        <CuratedDealGridSection
          key={mode}
          id={id}
          headingId={headingId}
          label={label}
          mode={mode}
          initialDeals={buckets[mode] ?? []}
        />
      ))}
    </div>
  );
}
