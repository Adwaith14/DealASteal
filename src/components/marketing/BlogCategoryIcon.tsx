import type { BlogCategoryKey } from '@/lib/blog-posts';

type BlogCategoryIconProps = {
  categoryKey: BlogCategoryKey;
  className?: string;
};

export function BlogCategoryIcon({ categoryKey, className }: BlogCategoryIconProps) {
  const box = `flex size-10 shrink-0 items-center justify-center rounded-lg bg-red-50 text-red-600 ${className ?? ''}`;

  switch (categoryKey) {
    case 'comparisons':
      return (
        <span className={box} aria-hidden>
          <svg className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75}>
            <rect x="4" y="4" width="8" height="14" rx="1" />
            <rect x="14" y="8" width="6" height="10" rx="1" />
          </svg>
        </span>
      );
    case 'tips':
      return (
        <span className={box} aria-hidden>
          <svg className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75}>
            <path d="M12 3v3M5.6 5.6l2.1 2.1M3 12h3M5.6 18.4l2.1-2.1M12 21v-3M18.4 18.4l-2.1-2.1M21 12h-3M18.4 5.6l-2.1 2.1" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        </span>
      );
    default:
      return (
        <span className={box} aria-hidden>
          <svg className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75}>
            <path d="M4 19.5A2.5 2.5 0 016.5 17H20" />
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
          </svg>
        </span>
      );
  }
}
