import { NextRequest, NextResponse } from 'next/server';
import { getLatestDeals } from '@/services/api/deals-sections';

export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams;
  const page = Math.max(Number(sp.get('page') ?? '1'), 1);
  const pageSize = Math.min(Math.max(Number(sp.get('pageSize') ?? '36'), 1), 96);
  const result = await getLatestDeals({ page, pageSize });
  return NextResponse.json(result);
}
