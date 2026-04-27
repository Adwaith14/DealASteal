import { revalidatePath } from 'next/cache';
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

    const useUpsert = Boolean(parsed.data.ingest_external_id?.trim());

    const query = useUpsert
      ? supabaseAdmin
          .from('deals')
          .upsert(insertPayload, { onConflict: 'ingest_external_id' })
          .select()
          .single()
      : supabaseAdmin.from('deals').insert(insertPayload).select().single();

    const { data, error } = await query;

    if (error) {
      console.error('[DealASteal] ingest deals insert failed:', error);
      const body: Record<string, unknown> = { error: 'Database insert failed' };
      if (process.env.NODE_ENV === 'development') {
        body.detail = error.message;
      }
      return NextResponse.json(body, { status: 500 });
    }

    const deal = data as Deal | null;
    if (deal?.id) {
      try {
        revalidatePath('/');
        revalidatePath(`/deals/${deal.id}`);
      } catch (revalidateCause) {
        console.error('[DealASteal] ingest revalidatePath failed:', revalidateCause);
      }
    }

    try {
      const status = useUpsert ? 200 : 201;
      return NextResponse.json(data as Deal, { status });
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
