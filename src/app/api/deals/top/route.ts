import { NextRequest, NextResponse } from 'next/server';
import { parseOffsetLimitQuery } from '@/lib/deals/deals-api-query-params';
import { getTopDeals } from '@/services/api/deals-sections';

export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams;
  const { limit, offset } = parseOffsetLimitQuery(sp, 48);
  const result = await getTopDeals({ limit, offset });
  return NextResponse.json(result);
}
