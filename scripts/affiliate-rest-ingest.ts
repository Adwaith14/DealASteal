import { config as loadEnv } from 'dotenv';
import { resolve } from 'node:path';
import { fetchAffiliateRestOffersPage } from '@/lib/vendors/affiliate-rest/fetch-offers';
import {
  loadAffiliateRestFixtureFile,
  sliceAffiliateRestPage,
} from '@/lib/vendors/affiliate-rest/load-fixture';
import {
  parseMerchantMapEnv,
  resolveMerchantForOffer,
} from '@/lib/vendors/affiliate-rest/merchant-resolution';
import { isPlaceholderAffiliateRestUrl } from '@/lib/vendors/affiliate-rest/is-placeholder-affiliate-url';
import { normalizeAffiliateRestOffer } from '@/lib/vendors/affiliate-rest/normalize-offer';
import type { DealIngestPayload } from '@/types/schemas';

const DEFAULT_OFFLINE_FIXTURE = 'fixtures/affiliate-rest-sample.json';

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function parseArgs(argv: string[]) {
  let dryRun = argv.includes('--dry-run');
  let limit = 25;
  let maxPages = 5;
  let fixtureFromArg: string | undefined;

  for (const arg of argv) {
    if (arg === '--dry-run') dryRun = true;
    if (arg.startsWith('--fixture=')) {
      fixtureFromArg = arg.slice('--fixture='.length).trim();
    }
    if (arg.startsWith('--limit=')) {
      limit = Math.max(1, Number.parseInt(arg.slice('--limit='.length), 10) || 25);
    }
    if (arg.startsWith('--max-pages=')) {
      maxPages = Math.max(1, Number.parseInt(arg.slice('--max-pages='.length), 10) || 5);
    }
  }
  return { dryRun, limit, maxPages, fixtureFromArg };
}

function isUuid(value: string): boolean {
  return UUID_RE.test(value.trim());
}

function readRequiredEnv(name: string): string {
  const value = process.env[name]?.trim() ?? '';
  if (!value) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

async function postIngest(
  siteUrl: string,
  apiKey: string,
  payload: DealIngestPayload
): Promise<{ ok: boolean; status: number; body: string }> {
  const url = `${siteUrl.replace(/\/$/, '')}/api/ingest/deals`;
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
}

async function main() {
  loadEnv({ path: resolve(process.cwd(), '.env.local') });
  loadEnv({ path: resolve(process.cwd(), '.env') });

  const { dryRun, limit, maxPages, fixtureFromArg } = parseArgs(process.argv);
  let fixturePath =
    fixtureFromArg?.trim() || process.env.AFFILIATE_REST_FIXTURE_PATH?.trim() || '';

  const offersUrlEnv = process.env.AFFILIATE_REST_OFFERS_URL?.trim() ?? '';

  if (
    fixturePath.length === 0 &&
    dryRun &&
    isPlaceholderAffiliateRestUrl(offersUrlEnv)
  ) {
    fixturePath = DEFAULT_OFFLINE_FIXTURE;
    process.stderr.write(
      `[affiliate-ingest] Dry-run: AFFILIATE_REST_OFFERS_URL is missing or looks like a placeholder; using bundled fixture ${DEFAULT_OFFLINE_FIXTURE}. Set a real URL for live fetch, or pass --fixture=path/to.json\n`
    );
  }

  if (
    fixturePath.length === 0 &&
    !dryRun &&
    isPlaceholderAffiliateRestUrl(offersUrlEnv)
  ) {
    throw new Error(
      'AFFILIATE_REST_OFFERS_URL must point to a real affiliate REST endpoint for live ingest (not a placeholder). Use --dry-run with the bundled fixture, or set a valid URL.'
    );
  }

  const endpoint =
    fixturePath.length > 0 ? '' : readRequiredEnv('AFFILIATE_REST_OFFERS_URL');
  const source = process.env.AFFILIATE_REST_SOURCE?.trim() || 'affiliate';
  const defaultMerchantId = (process.env.AFFILIATE_DEFAULT_MERCHANT_ID ?? process.env.INGEST_MERCHANT_ID)?.trim();
  if (defaultMerchantId && !isUuid(defaultMerchantId)) {
    throw new Error('AFFILIATE_DEFAULT_MERCHANT_ID (or INGEST_MERCHANT_ID fallback) must be a valid UUID');
  }
  const merchantMap = parseMerchantMapEnv(process.env.AFFILIATE_MERCHANT_MAP);

  const siteUrl = process.env.INGEST_SITE_URL ?? 'http://localhost:3000';
  const ingestApiKey =
    dryRun ? (process.env.INGESTION_API_KEY ?? '').trim() : readRequiredEnv('INGESTION_API_KEY');
  if (!dryRun && !ingestApiKey) {
    throw new Error('Missing required env var: INGESTION_API_KEY');
  }
  const bearerToken = process.env.AFFILIATE_REST_BEARER_TOKEN?.trim();
  const apiKey = process.env.AFFILIATE_REST_API_KEY?.trim();
  const lootThreshold = Math.max(
    0,
    Math.min(99, Number.parseInt(process.env.AFFILIATE_LOOT_THRESHOLD_PCT ?? '30', 10) || 30)
  );

  let cursor: string | undefined;
  let imported = 0;

  const useFixture = fixturePath.length > 0;

  for (let page = 0; page < maxPages; page += 1) {
    const data = useFixture
      ? sliceAffiliateRestPage(loadAffiliateRestFixtureFile(fixturePath), limit)
      : await fetchAffiliateRestOffersPage({
          endpoint,
          limit,
          cursor,
          ...(bearerToken ? { bearerToken } : {}),
          ...(apiKey ? { apiKey } : {}),
        });

    if (useFixture && page > 0) {
      break;
    }

    if (data.offers.length === 0) {
      break;
    }

    for (const offer of data.offers) {
      const { merchantId, merchantScope } = resolveMerchantForOffer(
        offer,
        merchantMap,
        defaultMerchantId
      );
      const payload = normalizeAffiliateRestOffer(offer, {
        merchantId,
        source,
        merchantScope,
        lootThresholdPct: lootThreshold,
      });

      if (dryRun) {
        process.stdout.write(`${JSON.stringify(payload)}\n`);
        imported += 1;
        continue;
      }

      const result = await postIngest(siteUrl, ingestApiKey, payload);
      if (!result.ok) {
        throw new Error(`Ingest failed HTTP ${result.status}: ${result.body}`);
      }
      imported += 1;
    }

    cursor = data.next_cursor;
    if (!cursor) break;
  }

  process.stdout.write(
    dryRun
      ? `Dry run finished: ${imported} payload(s) generated.\n`
      : `Done. Posted ${imported} deal(s).\n`
  );
}

main().catch((error) => {
  const msg = error instanceof Error ? error.message : String(error);
  process.stderr.write(`${msg}\n`);
  process.exit(1);
});
