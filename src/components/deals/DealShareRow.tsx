'use client';

type DealShareRowProps = {
  dealPageUrl: string;
  title: string;
  /** When true, adds Pinterest (detail page layout). */
  includePinterest?: boolean;
  /** ``panel``: centered row without top divider (detail page share box). */
  variant?: 'default' | 'panel';
};

/**
 * Reference-style share icon row (opens native share targets in new tabs).
 */
export function DealShareRow({
  dealPageUrl,
  title,
  includePinterest = false,
  variant = 'default',
}: DealShareRowProps) {
  const u = encodeURIComponent(dealPageUrl);
  const t = encodeURIComponent(title);
  const wa = encodeURIComponent(`${title} ${dealPageUrl}`);

  const iconClass =
    'flex size-8 items-center justify-center rounded-md text-[#6B9BD1] transition hover:bg-gray-100 hover:text-[#1877F2]';

  const rowClass =
    variant === 'panel'
      ? 'flex items-center justify-center gap-1 border-0 pt-0'
      : 'flex items-center justify-center gap-1 border-t border-gray-100 pt-3 sm:justify-start';

  return (
    <div className={rowClass}>
      <a
        aria-label="Share on Facebook"
        className={iconClass}
        href={`https://www.facebook.com/sharer/sharer.php?u=${u}`}
        target="_blank"
        rel="noopener noreferrer"
      >
        <span className="text-sm font-black">f</span>
      </a>
      <a
        aria-label="Share on X"
        className={iconClass}
        href={`https://twitter.com/intent/tweet?url=${u}&text=${t}`}
        target="_blank"
        rel="noopener noreferrer"
      >
        <span className="text-xs font-black">𝕏</span>
      </a>
      <a
        aria-label="Share on WhatsApp"
        className={iconClass}
        href={`https://wa.me/?text=${wa}`}
        target="_blank"
        rel="noopener noreferrer"
      >
        <svg className="size-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
        </svg>
      </a>
      {includePinterest ? (
        <a
          aria-label="Share on Pinterest"
          className={iconClass}
          href={`https://pinterest.com/pin/create/button/?url=${u}&description=${t}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          <svg className="size-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
            <path d="M12 0C5.373 0 0 5.372 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.219-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.562-5.418 5.207 0 1.031.397 2.138.893 2.738a.36.36 0 01.038.365l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.631-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0z" />
          </svg>
        </a>
      ) : null}
      <a
        aria-label="Open deal page link"
        className={iconClass}
        href={dealPageUrl}
        target="_blank"
        rel="noopener noreferrer"
      >
        <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
          <path d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
        </svg>
      </a>
    </div>
  );
}
