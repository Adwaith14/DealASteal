/**
 * DummyJSON → DealASteal ingest CLI.
 *
 * ── BEFORE YOU RUN (read in order) ─────────────────────────────────────────
 * 1) Dry-run needs NO API key and NO merchant id (prints sample JSON only).
 * 2) Real POST needs BOTH in `.env.local` (this script loads `.env.local` for you;
 *    `next dev` also loads it, but plain `tsx` did not until we added dotenv here):
 *      INGESTION_API_KEY=<same value as in .env.local for your Next API>
 *      INGEST_MERCHANT_ID=<UUID of a row that already exists in Supabase `merchants`>
 *    Create `INGESTION_API_KEY` yourself (any long random string); put the SAME
 *    string in `.env.local` so the ingest route accepts your script.
 * 3) Start the site: `npm run dev` (only required for real POST, not dry-run).
 * 4) Run dry-run first (see npm note below about flag names).
 *
 * npm quirk: `npm run … -- --foo=bar` — npm may treat some `--foo` flags as *npm*
 * config (you saw “Unknown cli config --batch-size”). Use either:
 *   - `npx tsx --tsconfig tsconfig.json scripts/dummyjson-ingest.ts --dry-run --take=3`
 *   - `npm run ingest:dummyjson:dry` (no extra flags; good on Windows)
 *   - env: `INGEST_DRY_RUN=1`, `INGEST_BATCH_SIZE=3` (see parseArgs)
 *
 * Port: if you use `next dev -p 3010`, set `INGEST_SITE_URL=http://127.0.0.1:3010` in `.env.local`.
 *
 * Catalog columns: payloads include ``currency`` / ``merchant_sku`` for parity with Amazon ingest.
 * If your Supabase DB has **not** run ``20260425000000_v2_catalog_evolution.sql``, leave ``DEALS_DB_V2``
 * unset so the ingest route strips those keys. After the migration, set ``DEALS_DB_V2=1`` and restart Next.
 */

import { config as loadEnv } from 'dotenv';
import { resolve } from 'node:path';
import { fetchDummyJsonProductsPage } from '@/lib/vendors/dummyjson/fetch-products';
import { normalizeDummyJsonProduct } from '@/lib/vendors/dummyjson/normalize-product';
import type { DealIngestPayload } from '@/types/schemas';

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isUuid(value: string): boolean {
  return UUID_RE.test(value.trim());
}

/**
 * Read flags from the full argv list. `npm`/`tsx` inject paths before user flags,
 * so `process.argv.slice(2)` is unreliable — always scan the whole array.
 */
function parseArgs(argv: string[]) {
  let dryRun =
    argv.includes('--dry-run') || String(process.env.INGEST_DRY_RUN ?? '').trim() === '1';
  let batchSize = 10;
  let skip = 0;
  let maxPages = 1;
  let sawBatchFromArgv = false;

  for (const arg of argv) {
    if (arg === '--dry-run') dryRun = true;
    else if (arg.startsWith('--take=')) {
      sawBatchFromArgv = true;
      batchSize = Math.max(1, Number.parseInt(arg.slice('--take='.length), 10) || 10);
    } else if (arg.startsWith('--batch-size=')) {
      sawBatchFromArgv = true;
      batchSize = Math.max(1, Number.parseInt(arg.slice('--batch-size='.length), 10) || 10);
    } else if (arg.startsWith('--limit=')) {
      sawBatchFromArgv = true;
      batchSize = Math.max(1, Number.parseInt(arg.slice('--limit='.length), 10) || 10);
    }
    else if (arg.startsWith('--skip=')) skip = Math.max(0, Number.parseInt(arg.slice('--skip='.length), 10) || 0);
    else if (arg.startsWith('--max-pages='))
      maxPages = Math.max(1, Number.parseInt(arg.slice('--max-pages='.length), 10) || 1);
  }

  const envBatch = Number.parseInt(String(process.env.INGEST_BATCH_SIZE ?? '').trim(), 10);
  if (!sawBatchFromArgv && Number.isFinite(envBatch) && envBatch >= 1) {
    batchSize = envBatch;
  }

  return { dryRun, limit: batchSize, skip, maxPages };
}

function isConnectionRefused(err: unknown): boolean {
  if (!(err instanceof Error)) return false;
  const c = err.cause;
  if (c && typeof c === 'object' && 'code' in c && (c as NodeJS.ErrnoException).code === 'ECONNREFUSED') {
    return true;
  }
  if (err.message.includes('ECONNREFUSED')) return true;
  return false;
}

async function postIngest(
  siteUrl: string,
  apiKey: string,
  payload: DealIngestPayload
): Promise<{ ok: boolean; status: number; body: string }> {
  const url = `${siteUrl.replace(/\/$/, '')}/api/ingest/deals`;
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        authorization: `Bearer ${apiKey}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    const body = await res.text();
    return { ok: res.ok, status: res.status, body };
  } catch (err) {
    if (isConnectionRefused(err)) {
      console.error(
        [
          `Cannot reach ${url} (connection refused).`,
          '',
          'Checklist:',
          '  1) Is Next running? (`npm run dev` or `npm run dev:3010`)',
          '  2) Match the port in .env.local, e.g. if you use -p 3010:',
          '       INGEST_SITE_URL=http://127.0.0.1:3010',
          '     Then restart this script (it reloads .env.local on each run).',
        ].join('\n')
      );
    }
    throw err;
  }
}

async function main() {
  loadEnv({ path: resolve(process.cwd(), '.env.local') });
  loadEnv({ path: resolve(process.cwd(), '.env') });

  const { dryRun, limit, skip: startSkip, maxPages } = parseArgs(process.argv);

  const siteUrl = process.env.INGEST_SITE_URL ?? 'http://localhost:3000';
  const apiKey = process.env.INGESTION_API_KEY ?? '';
  const merchantFromEnv = process.env.INGEST_MERCHANT_ID?.trim() ?? '';
  const baseUrl = process.env.DUMMYJSON_BASE_URL;

  /** Only for `--dry-run` when env is missing or invalid; never use for real POST unless that row exists in `merchants`. */
  const demoMerchantId = '550e8400-e29b-41d4-a716-446655440000';
  const merchantEnvValid = merchantFromEnv.length > 0 && isUuid(merchantFromEnv);
  const merchantId = merchantEnvValid ? merchantFromEnv : dryRun ? demoMerchantId : '';

  if (merchantFromEnv.length > 0 && !merchantEnvValid) {
    console.warn(
      [
        'INGEST_MERCHANT_ID is not a valid UUID.',
        `  You have: "${merchantFromEnv.slice(0, 60)}${merchantFromEnv.length > 60 ? '…' : ''}"`,
        '  Fix: Supabase dashboard → Table Editor → merchants → copy the id (looks like 550e8400-e29b-41d4-a716-446655440000).',
        dryRun
          ? `  Dry-run will print JSON using demo UUID ${demoMerchantId} instead.`
          : '  Real ingest cannot run until this is fixed.',
      ].join('\n')
    );
  }

  if (!dryRun && (!apiKey || !merchantEnvValid)) {
    console.error(
      [
        'Cannot POST: need a valid INGESTION_API_KEY and a valid INGEST_MERCHANT_ID (UUID from `merchants` table).',
        'Use --dry-run to preview payloads without posting.',
      ].join('\n')
    );
    process.exit(1);
  }

  if (dryRun && !merchantEnvValid) {
    console.warn(
      `INGEST_MERCHANT_ID missing or invalid — dry-run uses sample UUID ${demoMerchantId} in printed JSON. Before real ingest, set a real merchant UUID in .env.local.`
    );
  }

  let imported = 0;
  let skip = startSkip;

  for (let page = 0; page < maxPages; page++) {
    const data = await fetchDummyJsonProductsPage({
      limit,
      skip,
      ...(baseUrl ? { baseUrl } : {}),
    });

    if (data.products.length === 0) {
      console.log(`No products at skip=${skip}; stopping.`);
      break;
    }

    for (const product of data.products) {
      const payload = normalizeDummyJsonProduct(product, { merchantId });

      if (dryRun) {
        console.log(JSON.stringify(payload));
        imported += 1;
      } else {
        const result = await postIngest(siteUrl, apiKey, payload);
        if (!result.ok) {
          console.error(`Ingest failed HTTP ${result.status} for product ${product.id}: ${result.body}`);
          process.exit(1);
        }
        imported += 1;
      }
    }

    skip += data.products.length;
    if (skip >= data.total) break;
  }

  if (!dryRun) {
    console.log(`Done. Posted ${imported} deal(s).`);
  } else {
    console.log(`Dry run finished: ${imported} payload(s) printed above.`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
