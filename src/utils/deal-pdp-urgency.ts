import type { Deal } from '@/types/database.types';

export type DealUrgencyBar = 'red' | 'orange' | 'green';

export type DealUrgency = {
  label: string;
  percent: number;
  bar: DealUrgencyBar;
};

const WEEK_MS = 7 * 86400000;

/**
 * Display-only urgency for PDP progress (no inventory data in DB yet).
 */
export function getDealUrgencyForDisplay(deal: Deal, nowMs: number = Date.now()): DealUrgency {
  if (deal.is_loot_deal) {
    return { label: 'Almost gone!', percent: 93, bar: 'red' };
  }
  const end = deal.expires_at?.trim() ? new Date(deal.expires_at).getTime() : NaN;
  if (!Number.isNaN(end) && end > nowMs && end < nowMs + WEEK_MS) {
    return { label: 'Selling fast', percent: 66, bar: 'orange' };
  }
  return { label: 'Good availability', percent: 24, bar: 'green' };
}
