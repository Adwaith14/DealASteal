import { describe, expect, it } from 'vitest';
import { formatDealEndsIn, formatDealListedAgo } from './deal-time';

describe('formatDealListedAgo', () => {
  const t0 = Date.parse('2026-06-15T12:00:00.000Z');

  it('returns minutes ago for recent posts', () => {
    const posted = new Date(t0 - 25 * 60 * 1000).toISOString();
    expect(formatDealListedAgo(posted, t0)).toBe('25m ago');
  });

  it('returns hours ago within 48h', () => {
    const posted = new Date(t0 - 5 * 3600000).toISOString();
    expect(formatDealListedAgo(posted, t0)).toBe('5h ago');
  });

  it('returns days ago within 14d', () => {
    const posted = new Date(t0 - 3 * 86400000).toISOString();
    expect(formatDealListedAgo(posted, t0)).toBe('3d ago');
  });
});

describe('formatDealEndsIn', () => {
  const t0 = Date.parse('2026-06-15T12:00:00.000Z');

  it('returns null when no expiry', () => {
    expect(formatDealEndsIn(null, t0)).toBeNull();
  });

  it('returns null when already expired', () => {
    expect(formatDealEndsIn(new Date(t0 - 1000).toISOString(), t0)).toBeNull();
  });

  it('formats hours and minutes until expiry', () => {
    const end = new Date(t0 + (15 * 3600000 + 13 * 60000)).toISOString();
    expect(formatDealEndsIn(end, t0)).toBe('Ends in 15h 13m');
  });
});
