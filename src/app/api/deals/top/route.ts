import { NextRequest, NextResponse } from 'next/server';
import { getTopDeals } from '@/services/api/deals-sections';

export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams;
  const limit = Math.min(Math.max(Number(sp.get('limit') ?? '48'), 1), 96);
  const offset = Math.max(Number(sp.get('offset') ?? '0'), 0);
  const result = await getTopDeals({ limit, offset });
  return NextResponse.json(result);
}
