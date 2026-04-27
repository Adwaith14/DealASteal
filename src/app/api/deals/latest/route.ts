import { NextRequest, NextResponse } from 'next/server';
import { parseLatestDealsQuery } from '@/lib/deals/deals-api-query-params';
import { getLatestDeals } from '@/services/api/deals-sections';

export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams;
  const { page, pageSize } = parseLatestDealsQuery(sp);
  const result = await getLatestDeals({ page, pageSize });
  return NextResponse.json(result);
}
