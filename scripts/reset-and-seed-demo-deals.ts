/**
 * Wipes ALL `coupons` and `deals`, then inserts a fresh DummyJSON-backed demo set so each
 * homepage section has something to show:
 *   - Expiring soon (expires within 7 days)
 *   - Coupon deals (rows in `coupons` linked to deals)
 *   - Top deals (discount % ≥ 40)
 *   - Hot deals (`is_loot_deal = true`)
 *   - Latest (newest active deals — filled by the same batch)
 *
 * DANGER: destructive. Required flag: `--yes-i-know`
 *
 * Env (from `.env.local`):
 *   - NEXT_PUBLIC_SUPABASE_URL
 *   - SUPABASE_SERVICE_ROLE_KEY
 *   - INGEST_MERCHANT_ID (must exist in `merchants`)
 *
 * DB: `public.coupons` must include all columns the app uses (see ONE migration:
 * `supabase/migrations/20260422140000_align_coupons_for_dealasteal.sql`).
 * Run that in Supabase SQL before seeding or coupon inserts will fail.
 *
 * Manual wipe only (no seed): `supabase/manual-wipe-deals.sql`
 *
 * To drop only DummyJSON rows and keep a live feed: `npm run catalog:purge-dummyjson -- --yes-i-know`
 *
 * Usage:
 *   npx tsx --tsconfig tsconfig.json scripts/reset-and-seed-demo-deals.ts --yes-i-know
 */

import { randomUUID } from 'node:crypto';
import { resolve } from 'node:path';
import { config as loadEnv } from 'dotenv';
import { buildDealInsertRow, type DealInsertRow } from '@/lib/ingest/build-deal-insert';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { buildDemoIngestPayload, demoProfileForIndex } from '@/lib/vendors/dummyjson/demo-profiles';
import { fetchDummyJsonProductsPage } from '@/lib/vendors/dummyjson/fetch-products';
import { DummyJsonProductSchema } from '@/lib/vendors/dummyjson/types';
import { DealIngestSchema } from '@/types/schemas';

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isUuid(value: string): boolean {
  return UUID_RE.test(value.trim());
}

/** PostgREST “delete all rows” pattern */
const NEVER_MATCH = '00000000-0000-0000-0000-000000000000';

function stripGeneratedPct(row: DealInsertRow): Omit<DealInsertRow, 'discount_percentage'> {
  const { discount_percentage: _pct, ...rest } = row;
  return rest;
}

async function main() {
  loadEnv({ path: resolve(process.cwd(), '.env.local') });
  loadEnv({ path: resolve(process.cwd(), '.env') });

  if (!process.argv.includes('--yes-i-know')) {
    console.error('Refusing to run: pass --yes-i-know (this deletes all deals and coupons).');
    process.exit(1);
  }

  const merchantId = process.env.INGEST_MERCHANT_ID?.trim() ?? '';
  if (!isUuid(merchantId)) {
    console.error('Set INGEST_MERCHANT_ID in .env.local to a valid merchant UUID.');
    process.exit(1);
  }

  const admin = getSupabaseAdmin();

  console.log('Deleting coupons…');
  const { error: delCouponErr } = await admin
    .from('coupons')
    .delete()
    .neq('id', NEVER_MATCH);
  if (delCouponErr) {
    console.error('Failed to delete coupons:', delCouponErr.message);
    process.exit(1);
  }

  console.log('Deleting deals…');
  const { error: delDealErr } = await admin.from('deals').delete().neq('id', NEVER_MATCH);
  if (delDealErr) {
    console.error('Failed to delete deals:', delDealErr.message);
    process.exit(1);
  }

  const take = 30;
  const page = await fetchDummyJsonProductsPage({ limit: take, skip: 0 });
  const products = page.products
    .map((p) => DummyJsonProductSchema.parse(p))
    .slice(0, take);

  if (products.length < take) {
    console.warn(`Only ${products.length} products returned (wanted ${take}). Continuing.`);
  }

  let dealsInserted = 0;
  let couponsInserted = 0;

  for (let i = 0; i < products.length; i++) {
    const product = products[i];
    const profile = demoProfileForIndex(i);
    const rawPayload = buildDemoIngestPayload(product, merchantId, profile);
    const parsed = DealIngestSchema.safeParse(rawPayload);
    if (!parsed.success) {
      console.error(`Skip product ${product.id}:`, parsed.error.flatten());
      continue;
    }

    const row = buildDealInsertRow(parsed.data);
    const insertPayload = stripGeneratedPct(row);

    const { data: dealRow, error: insErr } = await admin
      .from('deals')
      .upsert(insertPayload, { onConflict: 'ingest_external_id' })
      .select('id')
      .single();

    if (insErr || !dealRow?.id) {
      console.error(`Insert failed for product ${product.id}:`, insErr?.message);
      process.exit(1);
    }

    dealsInserted += 1;

    if (profile === 'coupon') {
      const couponId = randomUUID();
      const { error: cErr } = await admin.from('coupons').insert({
        id: couponId,
        merchant_id: merchantId,
        deal_id: dealRow.id,
        code: `DEMO${product.id}`,
        title: `Save on ${product.title.slice(0, 40)}`,
        description: 'Demo coupon for homepage Coupon Deals section.',
        discount_type: 'percent',
        discount_value: 10,
        affiliate_url: parsed.data.affiliate_url,
        expires_at: null,
        is_active: true,
      });

      if (cErr) {
        console.error(`Coupon insert failed for deal ${dealRow.id}:`, cErr.message);
        process.exit(1);
      }
      couponsInserted += 1;
    }
  }

  console.log(
    `Done. Inserted ${dealsInserted} deal(s) and ${couponsInserted} coupon(s). Refresh the homepage.`
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
