import { AffiliateRestPageSchema, type AffiliateRestPage } from './types';

export type FetchAffiliateRestOffersArgs = {
  endpoint: string;
  limit: number;
  cursor?: string;
  bearerToken?: string;
  apiKey?: string;
  fetchImpl?: typeof fetch;
};

function withQuery(urlLike: string, limit: number, cursor?: string): string {
  const url = new URL(urlLike);
  url.searchParams.set('limit', String(limit));
  if (cursor) {
    url.searchParams.set('cursor', cursor);
  }
  return url.toString();
}

export async function fetchAffiliateRestOffersPage(
  args: FetchAffiliateRestOffersArgs
): Promise<AffiliateRestPage> {
  const { endpoint, limit, cursor, bearerToken, apiKey, fetchImpl = fetch } = args;
  const url = withQuery(endpoint, limit, cursor);
  const headers: Record<string, string> = { accept: 'application/json' };
  if (bearerToken) {
    headers.authorization = `Bearer ${bearerToken}`;
  }
  if (apiKey) {
    headers['x-api-key'] = apiKey;
  }

  let res: Response;
  try {
    res = await fetchImpl(url, { headers });
  } catch (cause) {
    const detail = cause instanceof Error ? cause.message : String(cause);
    throw new Error(`Affiliate REST fetch failed (${url}): ${detail}`, { cause });
  }
  if (!res.ok) {
    throw new Error(`Affiliate REST request failed: HTTP ${res.status} ${res.statusText}`);
  }

  const json: unknown = await res.json();
  const parsed = AffiliateRestPageSchema.safeParse(json);
  if (!parsed.success) {
    throw new Error(`Affiliate REST response shape unexpected: ${parsed.error.message}`);
  }
  return parsed.data;
}
