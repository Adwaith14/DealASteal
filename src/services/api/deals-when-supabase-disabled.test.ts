/** @vitest-environment node */
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/supabase/server', () => ({
  getSupabaseServerAnon: () => null,
}));

beforeEach(() => {
  vi.resetModules();
});

describe('catalog when getSupabaseServerAnon is null', () => {
  it('getActiveDeals and getActiveDealById return graceful failures', async () => {
    const { getActiveDeals, getActiveDealById } = await import('./deals');
    const list = await getActiveDeals();
    expect(list.ok).toBe(false);
    if (!list.ok) {
      expect(list.error).toMatch(/not configured/i);
    }
    const one = await getActiveDealById('00000000-0000-4000-8000-000000000001');
    expect(one.ok).toBe(false);
    if (!one.ok) {
      expect(one.message).toMatch(/not configured/i);
    }
  });

  it('section loaders return empty data and fetchError', async () => {
    const {
      getExpiringDeals,
      getCouponDeals,
      getTopDeals,
      getHotDeals,
      getLatestDeals,
    } = await import('./deals-sections');

    const exp = await getExpiringDeals();
    expect(exp.deals).toEqual([]);
    expect(exp.fetchError).toMatch(/not configured/i);

    const coup = await getCouponDeals();
    expect(coup.deals).toEqual([]);
    expect(coup.fetchError).toMatch(/not configured/i);

    const top = await getTopDeals();
    expect(top.deals).toEqual([]);
    expect(top.total).toBe(0);
    expect(top.fetchError).toMatch(/not configured/i);

    const hot = await getHotDeals();
    expect(hot.deals).toEqual([]);
    expect(hot.total).toBe(0);
    expect(hot.fetchError).toMatch(/not configured/i);

    const latest = await getLatestDeals();
    expect(latest.deals).toEqual([]);
    expect(latest.total).toBe(0);
    expect(latest.fetchError).toMatch(/not configured/i);
  });
});
