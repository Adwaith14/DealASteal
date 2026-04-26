import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  DEAL_SEARCH_FTS_MIN_LEN,
  isDealSearchFtsEnabled,
  shouldAttemptWebsearchFts,
} from './deal-search-query';

describe('deal-search-query', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('shouldAttemptWebsearchFts respects min length', () => {
    expect(shouldAttemptWebsearchFts('')).toBe(false);
    expect(shouldAttemptWebsearchFts('a')).toBe(false);
    expect(shouldAttemptWebsearchFts('ab')).toBe(true);
    expect(shouldAttemptWebsearchFts('  ab ')).toBe(true);
  });

  it('isDealSearchFtsEnabled is false only when DEALS_SEARCH_FTS=0', () => {
    vi.stubEnv('DEALS_SEARCH_FTS', '0');
    expect(isDealSearchFtsEnabled()).toBe(false);
    vi.stubEnv('DEALS_SEARCH_FTS', '1');
    expect(isDealSearchFtsEnabled()).toBe(true);
    vi.unstubAllEnvs();
    expect(isDealSearchFtsEnabled()).toBe(true);
  });

  it('exports sane min length', () => {
    expect(DEAL_SEARCH_FTS_MIN_LEN).toBeGreaterThanOrEqual(2);
  });
});
