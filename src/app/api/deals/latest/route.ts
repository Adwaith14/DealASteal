import { NextRequest, NextResponse } from 'next/server';
import { parseLatestDealsQuery } from '@/lib/deals/deals-api-query-params';
import { cacheHeaders } from '@/lib/http/cache-headers';
import { measureSlo } from '@/lib/observability/slo-emit';
import { withWebSpan } from '@/lib/observability/web-tracing';
import { getLatestDeals } from '@/services/api/deals-sections';

export async function GET(request: NextRequest) {
  return measureSlo('catalog.deals.latest', () =>
    withWebSpan('catalog.deals.latest', async () => {
      const sp = request.nextUrl.searchParams;
      const { page, pageSize } = parseLatestDealsQuery(sp);
      const result = await getLatestDeals({ page, pageSize });
      return NextResponse.json(result, { headers: cacheHeaders('shortFeed') });
    })
  );
}
