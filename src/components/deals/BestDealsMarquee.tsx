import Link from 'next/link';
import Image from 'next/image';
import type { Deal } from '@/types/database.types';

type BestDealsMarqueeProps = {
  deals: Deal[];
  origin: string;
};

export function BestDealsMarquee({ deals, origin }: BestDealsMarqueeProps) {
  if (!deals || deals.length === 0) return null;

  // Duplicate deals to ensure the marquee can loop seamlessly
  const marqueeDeals = [...deals, ...deals, ...deals];

  return (
    <div className="w-full bg-[#FFFBEB] border-y border-[#FDE68A] py-3 overflow-hidden relative group">
      <div className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-[#FFFBEB] to-transparent z-10 pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-[#FFFBEB] to-transparent z-10 pointer-events-none" />
      
      <div className="flex w-max animate-marquee group-hover:[animation-play-state:paused]">
        {marqueeDeals.map((deal, idx) => {
          const dealUrl = `/deals/${deal.id}`;
          return (
            <Link 
              key={`${deal.id}-${idx}`} 
              href={dealUrl}
              className="flex items-center gap-3 px-6 border-r border-[#FDE68A]/50 last:border-none hover:bg-white/50 transition-colors rounded-lg mx-2 min-w-[280px] max-w-[320px]"
            >
              <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-md bg-white border border-gray-100">
                {deal.image_url ? (
                  <Image
                    src={deal.image_url}
                    alt={deal.title}
                    fill
                    className="object-contain p-1"
                    sizes="48px"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-gray-50 text-xs text-gray-400">
                    No img
                  </div>
                )}
              </div>
              <div className="flex flex-col flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#FF4747] text-white whitespace-nowrap">
                    ⭐ BEST DEAL
                  </span>
                  {deal.discount_percentage ? (
                    <span className="text-xs font-bold text-[#FF4747] whitespace-nowrap">
                      {deal.discount_percentage}% OFF
                    </span>
                  ) : null}
                </div>
                <p className="truncate text-sm font-semibold text-gray-900 mt-0.5">
                  {deal.title}
                </p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  {typeof deal.price === 'number' && (
                    <span className="text-sm font-black text-[#FF4747]">
                      ${deal.price.toFixed(2)}
                    </span>
                  )}
                  {typeof deal.original_price === 'number' && typeof deal.price === 'number' && deal.original_price > deal.price && (
                    <span className="text-xs text-gray-400 line-through">
                      ${deal.original_price.toFixed(2)}
                    </span>
                  )}
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
