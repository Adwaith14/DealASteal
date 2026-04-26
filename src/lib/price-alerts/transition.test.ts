import { describe, expect, it } from 'vitest';
import { evaluatePriceAlertStep, initialIsBelow } from '@/lib/price-alerts/transition';

describe('evaluatePriceAlertStep', () => {
  it('fires once on first cross at or below threshold', () => {
    expect(
      evaluatePriceAlertStep({
        thresholdPrice: 50,
        currentPrice: 49,
        isBelowThreshold: false,
      })
    ).toEqual({ shouldNotify: true, nextIsBelowThreshold: true });
  });

  it('does not fire again while still below', () => {
    expect(
      evaluatePriceAlertStep({
        thresholdPrice: 50,
        currentPrice: 40,
        isBelowThreshold: true,
      })
    ).toEqual({ shouldNotify: false, nextIsBelowThreshold: true });
  });

  it('resets when price goes back above threshold', () => {
    expect(
      evaluatePriceAlertStep({
        thresholdPrice: 50,
        currentPrice: 55,
        isBelowThreshold: true,
      })
    ).toEqual({ shouldNotify: false, nextIsBelowThreshold: false });
  });

  it('fires again on second crossing', () => {
    expect(
      evaluatePriceAlertStep({
        thresholdPrice: 50,
        currentPrice: 48,
        isBelowThreshold: false,
      })
    ).toEqual({ shouldNotify: true, nextIsBelowThreshold: true });
  });
});

describe('initialIsBelow', () => {
  it('true when already at or below target (no drop email on first cron)', () => {
    expect(initialIsBelow({ thresholdPrice: 50, currentPrice: 45 })).toBe(true);
  });
  it('false when above target', () => {
    expect(initialIsBelow({ thresholdPrice: 50, currentPrice: 60 })).toBe(false);
  });
});
