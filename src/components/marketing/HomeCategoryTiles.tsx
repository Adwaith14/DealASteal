import Link from 'next/link';

const TILES: { href: string; label: string; icon: 'chip' | 'laptop' | 'shirt' | 'home' | 'flame' | 'grid' }[] = [
  { href: '/deals?category=tech', label: 'Electronics', icon: 'chip' },
  { href: '/deals?category=laptops', label: 'Laptops', icon: 'laptop' },
  { href: '/deals?category=fashion', label: 'Fashion', icon: 'shirt' },
  { href: '/deals?category=home', label: 'Home', icon: 'home' },
  { href: '/deals?loot=1', label: 'Hot Deals', icon: 'flame' },
  { href: '/deals', label: 'More', icon: 'grid' },
];

function TileIcon({ kind }: { kind: (typeof TILES)[number]['icon'] }) {
  const stroke = 'currentColor';
  const common = { fill: 'none' as const, stroke, strokeWidth: 1.75, className: 'size-7 text-[#26BBA4]' };
  switch (kind) {
    case 'chip':
      return (
        <svg viewBox="0 0 24 24" aria-hidden {...common}>
          <rect x="7" y="7" width="10" height="10" rx="1.5" />
          <path d="M9 7V5M15 7V5M9 17v2M15 17v2M7 9H5M7 15H5M17 9h2M17 15h2" strokeLinecap="round" />
        </svg>
      );
    case 'laptop':
      return (
        <svg viewBox="0 0 24 24" aria-hidden {...common}>
          <rect x="4" y="5" width="16" height="10" rx="1" />
          <path d="M2 19h20" strokeLinecap="round" />
        </svg>
      );
    case 'shirt':
      return (
        <svg viewBox="0 0 24 24" aria-hidden {...common}>
          <path d="M6 8l3-3h6l3 3v14H6V8z" strokeLinejoin="round" />
          <path d="M9 5l1.5-2h3L15 5" strokeLinecap="round" />
        </svg>
      );
    case 'home':
      return (
        <svg viewBox="0 0 24 24" aria-hidden {...common}>
          <path d="M4 10l8-6 8 6v10H4V10z" strokeLinejoin="round" />
          <path d="M9 20v-6h6v6" strokeLinejoin="round" />
        </svg>
      );
    case 'flame':
      return (
        <svg viewBox="0 0 24 24" aria-hidden {...common}>
          <path
            d="M12 3s4 4.5 4 9c0 2.5-1.5 4-4 4s-4-1.5-4-4c0-3 2-6 4-9z"
            strokeLinejoin="round"
          />
        </svg>
      );
    default:
      return (
        <svg viewBox="0 0 24 24" aria-hidden {...common}>
          <rect x="4" y="4" width="6" height="6" rx="1" />
          <rect x="14" y="4" width="6" height="6" rx="1" />
          <rect x="4" y="14" width="6" height="6" rx="1" />
          <rect x="14" y="14" width="6" height="6" rx="1" />
        </svg>
      );
  }
}

export function HomeCategoryTiles() {
  return (
    <section className="py-6" aria-labelledby="shop-category-heading">
      <h2 id="shop-category-heading" className="mb-4 text-xl font-extrabold text-[#0B1340]">
        Shop by Category
      </h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {TILES.map((t) => (
          <Link
            key={t.label}
            href={t.href}
            className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-gray-200 bg-white px-3 py-5 text-center shadow-sm transition hover:border-[#26BBA4]/40 hover:shadow-md"
          >
            <TileIcon kind={t.icon} />
            <span className="text-sm font-semibold text-[#0B1340]">{t.label}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
