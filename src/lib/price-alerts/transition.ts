/**
 * State step for a single (threshold, is_below_threshold) + observed price.
 * Fires a notification on false → true crossing (at or below threshold).
 */
export function evaluatePriceAlertStep(args: {
  thresholdPrice: number;
  currentPrice: number;
  isBelowThreshold: boolean;
}): { shouldNotify: boolean; nextIsBelowThreshold: boolean } {
  const { thresholdPrice, currentPrice, isBelowThreshold } = args;
  const nowBelow = currentPrice <= thresholdPrice;
  if (nowBelow) {
    if (!isBelowThreshold) {
      return { shouldNotify: true, nextIsBelowThreshold: true };
    }
    return { shouldNotify: false, nextIsBelowThreshold: true };
  }
  return { shouldNotify: false, nextIsBelowThreshold: false };
}

/** For new rows: if already at/below target, do not treat next crossing as a "drop". */
export function initialIsBelow(args: { thresholdPrice: number; currentPrice: number }): boolean {
  return args.currentPrice <= args.thresholdPrice;
}
