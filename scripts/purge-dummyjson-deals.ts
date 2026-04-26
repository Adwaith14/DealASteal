/**
 * Deletes deals whose ``ingest_external_id`` starts with ``dummyjson:`` (DummyJSON
 * demo / seed), plus ``coupons`` rows that reference those deals.
 *
 * Does not touch deals from other feeds (affiliate REST, PA-API, manual, etc.).
 *
 * Env (``.env.local``):
 *   - NEXT_PUBLIC_SUPABASE_URL
 *   - SUPABASE_SERVICE_ROLE_KEY
 *
 * Usage:
 *   npx tsx --tsconfig tsconfig.json scripts/purge-dummyjson-deals.ts --yes-i-know
 *   npx tsx --tsconfig tsconfig.json scripts/purge-dummyjson-deals.ts --yes-i-know --refresh-scores
 *
 * ``--refresh-scores`` runs ``public.refresh_deal_scores()`` so ``best_deals_today``
 * does not reference removed ids (requires migration ``20260427153000_deal_scoring_job.sql``).
 */

import { resolve } from 'node:path';
import { config as loadEnv } from 'dotenv';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

const CHUNK = 120;

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    out.push(arr.slice(i, i + size));
  }
  return out;
}

async function main() {
  loadEnv({ path: resolve(process.cwd(), '.env.local') });
  loadEnv({ path: resolve(process.cwd(), '.env') });

  if (!process.argv.includes('--yes-i-know')) {
    process.stderr.write(
      'Refusing to run: pass --yes-i-know (deletes DummyJSON-backed deals and related coupons).\n'
    );
    process.exit(1);
  }

  const refreshScores = process.argv.includes('--refresh-scores');
  const admin = getSupabaseAdmin();

  const { data: rows, error: selErr } = await admin
    .from('deals')
    .select('id')
    .ilike('ingest_external_id', 'dummyjson:%');

  if (selErr) {
    process.stderr.write(`Failed to list DummyJSON deals: ${selErr.message}\n`);
    process.exit(1);
  }

  const ids = (rows ?? []).map((r) => r.id as string).filter(Boolean);
  if (ids.length === 0) {
    process.stdout.write('No deals with ingest_external_id ilike dummyjson:% — nothing to delete.\n');
    if (refreshScores) {
      const { error: rpcErr } = await admin.rpc('refresh_deal_scores');
      if (rpcErr) {
        process.stderr.write(`refresh_deal_scores: ${rpcErr.message}\n`);
        process.exit(1);
      }
      process.stdout.write('Ran refresh_deal_scores().\n');
    }
    return;
  }

  process.stdout.write(`Deleting ${ids.length} DummyJSON deal(s) and linked coupons…\n`);

  for (const part of chunk(ids, CHUNK)) {
    const { error: cErr } = await admin.from('coupons').delete().in('deal_id', part);
    if (cErr) {
      process.stderr.write(`Coupon delete failed: ${cErr.message}\n`);
      process.exit(1);
    }
  }

  for (const part of chunk(ids, CHUNK)) {
    const { error: dErr } = await admin.from('deals').delete().in('id', part);
    if (dErr) {
      process.stderr.write(`Deal delete failed: ${dErr.message}\n`);
      process.exit(1);
    }
  }

  process.stdout.write(`Done. Removed ${ids.length} deal(s). Reload the homepage.\n`);

  if (refreshScores) {
    const { error: rpcErr } = await admin.rpc('refresh_deal_scores');
    if (rpcErr) {
      process.stderr.write(`refresh_deal_scores: ${rpcErr.message}\n`);
      process.exit(1);
    }
    process.stdout.write('Ran refresh_deal_scores().\n');
  }
}

main().catch((e) => {
  process.stderr.write(e instanceof Error ? `${e.message}\n` : String(e));
  process.exit(1);
});
