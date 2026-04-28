import { NextRequest, NextResponse } from 'next/server';
import { normalizeDealSortParam } from '@/constants/deal-browse-filters';
import { parseCuratedExpandLimit } from '@/lib/deals/deals-api-query-params';
import { getCuratedDeals } from '@/services/api/deals-sections';

export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams;
  const sort = normalizeDealSortParam(sp.get('sort'));
  if (sort == null) {
    return NextResponse.json({ ok: false, error: 'Invalid or missing sort.' }, { status: 400 });
  }
  const limit = parseCuratedExpandLimit(sp);
  const result = await getCuratedDeals(sort, limit);
  if (result.fetchError) {
    return NextResponse.json({ ok: false, error: result.fetchError }, { status: 503 });
  }
  return NextResponse.json({ ok: true, deals: result.deals });
}
