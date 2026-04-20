import { NextResponse, type NextRequest } from 'next/server';
import { buildDealInsertRow, type DealInsertRow } from '@/lib/ingest/build-deal-insert';
import { isValidIngestionAuth } from '@/lib/ingest/verify-ingestion-auth';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import type { Deal } from '@/types/database.types';
import { DealIngestSchema } from '@/types/schemas';

/** Uses `node:crypto` and Node buffers in auth + Supabase admin client — keep off the Edge runtime. */
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    if (!isValidIngestionAuth(request, process.env.INGESTION_API_KEY)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON body' },
        { status: 400 }
      );
    }

    const parsed = DealIngestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', issues: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const supabaseAdmin = getSupabaseAdmin();
    const validatedData = buildDealInsertRow(parsed.data);
    const { discount_percentage: _generatedPct, ...insertPayload } =
      validatedData as DealInsertRow;

    const { data, error } = await supabaseAdmin
      .from('deals')
      .insert(insertPayload)
      .select()
      .single();

    if (error) {
      console.error('[DealASteal] ingest deals insert failed:', error);
      const body: Record<string, unknown> = { error: 'Database insert failed' };
      if (process.env.NODE_ENV === 'development') {
        body.detail = error.message;
      }
      return NextResponse.json(body, { status: 500 });
    }

    try {
      return NextResponse.json(data as Deal, { status: 201 });
    } catch (serializeCause) {
      console.error('[DealASteal] ingest deals response serialization failed:', serializeCause);
      const body: Record<string, unknown> = { error: 'Internal Server Error' };
      if (process.env.NODE_ENV === 'development' && serializeCause instanceof Error) {
        body.detail = serializeCause.message;
      }
      return NextResponse.json(body, { status: 500 });
    }
  } catch (cause) {
    console.error('[DealASteal] POST /api/ingest/deals failed:', cause);
    const body: Record<string, unknown> = { error: 'Internal Server Error' };
    if (process.env.NODE_ENV === 'development' && cause instanceof Error) {
      body.detail = cause.message;
    }
    return NextResponse.json(body, { status: 500 });
  }
}
