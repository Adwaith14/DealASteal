import { NextRequest, NextResponse } from 'next/server';
import { parseActiveDealsBrowseFromSearchParams } from '@/lib/deals/parse-active-deals-browse-query';
import { getActiveDeals } from '@/services/api/deals';

export async function GET(request: NextRequest) {
  const flat: Record<string, string | undefined> = {};
  for (const [k, v] of request.nextUrl.searchParams.entries()) {
    flat[k] = v;
  }
  const query = parseActiveDealsBrowseFromSearchParams(flat);
  const result = await getActiveDeals(query);
  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error }, { status: 502 });
  }
  return NextResponse.json({
    ok: true,
    deals: result.deals,
    page: result.page,
    pageSize: result.pageSize,
    totalPages: result.totalPages,
    totalCount: result.totalCount,
  });
}
