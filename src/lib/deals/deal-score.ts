import type { Deal } from '@/types/database.types';

export interface DealScoreInputs {
  deal: Pick<
    Deal,
    | 'discount_percentage'
    | 'discount_price'
    | 'original_price'
    | 'is_loot_deal'
    | 'rating'
    | 'rating_count'
    | 'availability'
    | 'expires_at'
    | 'created_at'
  >;
  /** Lowest historical price for the same deal (last N days), if known. */
  lowestRecentPrice?: number | null;
  /** Recent click-through count (proxy for demand). */
  recentClicks?: number | null;
  /** Reference timestamp; defaults to ``Date.now()`` for testability. */
  now?: Date;
}

const RECENCY_HALF_LIFE_HOURS = 96; // 4 days
const URGENCY_WINDOW_HOURS = 24;

function clamp(value: number, min: number, max: number): number {
  if (Number.isNaN(value)) return min;
  return Math.min(Math.max(value, min), max);
}

/**
 * Aggregate "best deal" score in [0, 100].
 *
 * Designed to surface deals that are:
 *   - Heavily discounted relative to the original price.
 *   - Cheaper than the deal has historically been (lowest-in-recent-history).
 *   - Highly rated, with enough reviews to be trustworthy.
 *   - In stock and not yet expired.
 *   - Recently created or with momentum (recent clicks).
 *
 * Pure function — easy to unit test and to call from a Postgres job that
 * writes ``deals.score``.
 */
export function computeDealScore({
  deal,
  lowestRecentPrice,
  recentClicks,
  now = new Date(),
}: DealScoreInputs): number {
  // --- discount component (max 40) -----------------------------------------
  const discount = clamp(deal.discount_percentage ?? 0, 0, 90);
  const discountScore = (discount / 90) * 40;

  // --- price-history component (max 20) ------------------------------------
  let historyScore = 10;
  const priceOk =
    typeof deal.discount_price === 'number' && Number.isFinite(deal.discount_price) && deal.discount_price > 0;
  if (
    priceOk &&
    typeof lowestRecentPrice === 'number' &&
    Number.isFinite(lowestRecentPrice) &&
    lowestRecentPrice > 0
  ) {
    if (deal.discount_price <= lowestRecentPrice) {
      historyScore = 20;
    } else {
      const ratio = lowestRecentPrice / deal.discount_price;
      historyScore = clamp(ratio * 20, 0, 20);
    }
  }

  // --- rating component (max 15) -------------------------------------------
  const rating = deal.rating ?? 0;
  const reviews = deal.rating_count ?? 0;
  let ratingScore = (rating / 5) * 12;
  if (reviews >= 250) {
    ratingScore += 3;
  } else if (reviews >= 25) {
    ratingScore += 2;
  } else if (reviews >= 5) {
    ratingScore += 1;
  }
  ratingScore = clamp(ratingScore, 0, 15);

  // --- demand momentum component (max 10) ----------------------------------
  const clicks = recentClicks ?? 0;
  const demandScore = clamp(Math.log10(1 + clicks) * 5, 0, 10);

  // --- recency component (max 10) ------------------------------------------
  let recencyScore = 0;
  const created = Date.parse(deal.created_at);
  if (Number.isFinite(created)) {
    if (created > now.getTime()) {
      recencyScore = 0;
    } else {
      const ageHours = (now.getTime() - created) / 36e5;
      recencyScore = clamp(10 * Math.pow(0.5, ageHours / RECENCY_HALF_LIFE_HOURS), 0, 10);
    }
  }

  // --- urgency / loot bonus (max 5) ----------------------------------------
  let urgencyScore = 0;
  if (deal.expires_at) {
    const expiresAt = Date.parse(deal.expires_at);
    if (Number.isFinite(expiresAt)) {
      const hoursToExpiry = (expiresAt - now.getTime()) / 36e5;
      if (hoursToExpiry > 0 && hoursToExpiry < URGENCY_WINDOW_HOURS) {
        urgencyScore = 5;
      }
    }
  }
  if (deal.is_loot_deal && urgencyScore === 0) urgencyScore = 3;

  // --- availability gate ---------------------------------------------------
  let total =
    discountScore + historyScore + ratingScore + demandScore + recencyScore + urgencyScore;

  const availability = (deal.availability ?? '').toLowerCase();
  if (availability && /(out_of_stock|out-of-stock|unavailable|sold ?out)/.test(availability)) {
    total = total * 0.25;
  }

  return Number(clamp(total, 0, 100).toFixed(2));
}

/**
 * Convenience wrapper that returns ``true`` when a deal qualifies as
 * "instantly catches the customer's eye". Combine multiple signals to avoid
 * relying solely on a single high discount that could be a relisted item.
 */
export function isHeadlineDeal(score: number): boolean {
  return score >= 70;
}
