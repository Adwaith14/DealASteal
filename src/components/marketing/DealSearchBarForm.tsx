export type DealSearchBarPreserveFilters = {
  category?: string | null;
  store?: string | null;
  maxPrice?: number | null;
  minDiscount?: number | null;
  lootDeals?: boolean;
};

export type DealSearchBarFormProps = {
  formAction?: string;
  defaultQuery?: string;
  inputId: string;
  preserve?: DealSearchBarPreserveFilters;
  className?: string;
};

/**
 * Hero-style deal search (GET form). Optional hidden fields keep list facets when used on `/search`.
 */
export function DealSearchBarForm({
  formAction = '/search',
  defaultQuery = '',
  inputId,
  preserve,
  className,
}: DealSearchBarFormProps) {
  const category = preserve?.category?.trim();
  const store = preserve?.store?.trim();
  const maxPrice = preserve?.maxPrice;
  const minDiscount = preserve?.minDiscount;
  const lootDeals = preserve?.lootDeals;

  return (
    <form action={formAction} method="get" role="search" className={className}>
      {category ? <input type="hidden" name="category" value={category} /> : null}
      {store ? <input type="hidden" name="store" value={store} /> : null}
      {maxPrice != null && maxPrice > 0 ? <input type="hidden" name="max_price" value={String(maxPrice)} /> : null}
      {minDiscount != null && minDiscount > 0 ? (
        <input type="hidden" name="min_disc" value={String(minDiscount)} />
      ) : null}
      {lootDeals ? <input type="hidden" name="loot" value="1" /> : null}

      <label htmlFor={inputId} className="sr-only">
        Search deals
      </label>
      <div className="flex w-full items-center gap-1 rounded-full border border-slate-200/90 bg-white/75 p-1.5 pl-3 shadow-sm shadow-slate-900/5 backdrop-blur-md sm:pl-4">
        <svg
          className="size-5 shrink-0 text-slate-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
          aria-hidden
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
          />
        </svg>
        <input
          id={inputId}
          name="q"
          type="search"
          placeholder="Search products, stores, or paste a product link"
          autoComplete="off"
          defaultValue={defaultQuery}
          className="min-w-0 flex-1 border-0 bg-transparent py-2.5 text-sm text-[#0B1340] outline-none ring-0 placeholder:text-slate-500 sm:text-base"
        />
        <button
          type="button"
          className="flex size-9 shrink-0 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
          aria-label="Voice search (coming soon)"
        >
          <svg
            className="size-5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            aria-hidden
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 14a3 3 0 003-3V5a3 3 0 10-6 0v6a3 3 0 003 3zm6-3a6 6 0 11-12 0M12 19v3"
            />
          </svg>
        </button>
        <button
          type="submit"
          className="inline-flex min-h-10 shrink-0 items-center justify-center rounded-full bg-linear-to-r from-blue-600 to-indigo-600 px-5 text-sm font-bold text-white shadow-md transition hover:from-blue-700 hover:to-indigo-700 sm:px-6"
        >
          Search
        </button>
      </div>
    </form>
  );
}
