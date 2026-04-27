/**
 * Safe integers for /api/deals/* query strings — bad values must not become NaN
 * (PostgREST ``.range`` with NaN breaks or misbehaves).
 */
function parseIntInRange(
  raw: string | null,
  opts: { default: number; min: number; max: number }
): number {
  const n = Number.parseInt(String(raw ?? '').trim(), 10);
  if (!Number.isFinite(n)) return opts.default;
  return Math.min(Math.max(n, opts.min), opts.max);
}

export function parseLatestDealsQuery(sp: URLSearchParams): { page: number; pageSize: number } {
  return {
    page: parseIntInRange(sp.get('page'), { default: 1, min: 1, max: 10_000 }),
    pageSize: parseIntInRange(sp.get('pageSize'), { default: 36, min: 1, max: 96 }),
  };
}

export function parseOffsetLimitQuery(
  sp: URLSearchParams,
  defaultLimit: number
): { limit: number; offset: number } {
  return {
    limit: parseIntInRange(sp.get('limit'), { default: defaultLimit, min: 1, max: 96 }),
    offset: parseIntInRange(sp.get('offset'), { default: 0, min: 0, max: 50_000 }),
  };
}

/** ``limit`` for home curated expand (GET ``/api/deals/curated``). */
export function parseCuratedExpandLimit(sp: URLSearchParams): number {
  return parseIntInRange(sp.get('limit'), { default: 24, min: 6, max: 48 });
}
