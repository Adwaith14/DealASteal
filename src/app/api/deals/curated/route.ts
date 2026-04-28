import { NextRequest, NextResponse } from 'next/server';
import { parseCuratedExpandLimit } from '@/lib/deals/deals-api-query-params';
import { getCuratedDeals, type CuratedSortMode } from '@/services/api/deals-sections';

export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams;
  const rawSort = sp.get('sort')?.trim().toLowerCase() || 'newest';
  const sort: CuratedSortMode = ['popular', 'newest', 'biggest_drop'].includes(rawSort)
    ? (rawSort as CuratedSortMode)
    : 'newest';
  const limit = parseCuratedExpandLimit(sp);
  const result = await getCuratedDeals(sort, limit);
  if (result.fetchError) {
    return NextResponse.json({ ok: false, error: result.fetchError }, { status: 503 });
  }
  return NextResponse.json({ ok: true, deals: result.deals });
}
