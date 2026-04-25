/** @vitest-environment node */
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  dealSelectColumnsForPostgrest,
  dealsDbHasV2Schema,
  stripV2DealInsertColumns,
} from './deals-db-schema';

describe('dealsDbHasV2Schema', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('is false when DEALS_DB_V2 unset', () => {
    vi.stubEnv('DEALS_DB_V2', '');
    expect(dealsDbHasV2Schema()).toBe(false);
  });

  it('is true when DEALS_DB_V2=1', () => {
    vi.stubEnv('DEALS_DB_V2', '1');
    expect(dealsDbHasV2Schema()).toBe(true);
  });
});

describe('dealSelectColumnsForPostgrest', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('omits v2 columns when DEALS_DB_V2 is not 1', () => {
    vi.stubEnv('DEALS_DB_V2', '');
    const s = dealSelectColumnsForPostgrest();
    expect(s).toContain('trust_bundle');
    expect(s).not.toContain('currency');
    expect(s).not.toContain('asin');
  });

  it('includes v2 columns when DEALS_DB_V2=1', () => {
    vi.stubEnv('DEALS_DB_V2', '1');
    const s = dealSelectColumnsForPostgrest();
    expect(s).toContain('currency');
    expect(s).toContain('score');
  });
});

describe('stripV2DealInsertColumns', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('removes v2 keys when schema flag off', () => {
    vi.stubEnv('DEALS_DB_V2', '');
    const row = stripV2DealInsertColumns({
      merchant_id: '550e8400-e29b-41d4-a716-446655440000',
      title: 'x',
      currency: 'USD',
      asin: 'B012345678',
      brand: 'Acme',
    });
    expect(row).not.toHaveProperty('currency');
    expect(row).not.toHaveProperty('asin');
    expect(row).toHaveProperty('title');
  });

  it('keeps v2 keys when DEALS_DB_V2=1', () => {
    vi.stubEnv('DEALS_DB_V2', '1');
    const row = stripV2DealInsertColumns({ currency: 'USD', title: 'x' });
    expect(row).toHaveProperty('currency', 'USD');
  });
});
