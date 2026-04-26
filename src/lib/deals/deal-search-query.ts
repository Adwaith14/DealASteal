/** Minimum trimmed query length before we attempt Postgres ``websearch_to_tsquery``. */
export const DEAL_SEARCH_FTS_MIN_LEN = 2;

/** When ``DEALS_SEARCH_FTS=0``, the app skips the FTS RPC and uses legacy title ``ILIKE``. */
export function isDealSearchFtsEnabled(): boolean {
  return process.env.DEALS_SEARCH_FTS !== '0';
}

export function shouldAttemptWebsearchFts(query: string): boolean {
  return query.trim().length >= DEAL_SEARCH_FTS_MIN_LEN;
}
