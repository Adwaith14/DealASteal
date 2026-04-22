import { DummyJsonProductsPageSchema } from './types';

export type FetchDummyJsonProductsPageArgs = {
  limit: number;
  skip: number;
  /** Override for tests or private mirrors; default is public DummyJSON. */
  baseUrl?: string;
  fetchImpl?: typeof fetch;
};

/**
 * Fetches one page of products from DummyJSON.
 * Vendor-specific: swap this function when you integrate a real affiliate catalog API.
 */
export async function fetchDummyJsonProductsPage(
  args: FetchDummyJsonProductsPageArgs
): Promise<ReturnType<typeof DummyJsonProductsPageSchema.parse>> {
  const { limit, skip, baseUrl = 'https://dummyjson.com', fetchImpl = fetch } = args;
  const url = new URL('/products', baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`);
  url.searchParams.set('limit', String(limit));
  url.searchParams.set('skip', String(skip));

  const res = await fetchImpl(url.toString(), {
    headers: { accept: 'application/json' },
  });

  if (!res.ok) {
    throw new Error(`DummyJSON products request failed: HTTP ${res.status} ${res.statusText}`);
  }

  const json: unknown = await res.json();
  const parsed = DummyJsonProductsPageSchema.safeParse(json);
  if (!parsed.success) {
    throw new Error(
      `DummyJSON response shape unexpected: ${parsed.error.message}`
    );
  }
  return parsed.data;
}
