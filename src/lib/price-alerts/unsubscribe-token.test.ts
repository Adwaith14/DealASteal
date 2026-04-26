/** @vitest-environment node */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { signPriceAlertUnsubscribeToken, verifyPriceAlertUnsubscribeToken } from '@/lib/price-alerts/unsubscribe-token';

describe('price alert unsubscribe token', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('round-trips with shared secret', () => {
    vi.stubEnv('PRICE_ALERT_UNSUBSCRIBE_SECRET', 'test-secret-key');
    const id = '550e8400-e29b-41d4-a716-446655440000';
    const token = signPriceAlertUnsubscribeToken(id);
    expect(verifyPriceAlertUnsubscribeToken(token)).toBe(id);
  });

  it('rejects tampered token', () => {
    vi.stubEnv('PRICE_ALERT_UNSUBSCRIBE_SECRET', 'test-secret-key');
    const id = '550e8400-e29b-41d4-a716-446655440000';
    const token = signPriceAlertUnsubscribeToken(id);
    const bad = token.slice(0, -3) + 'xxx';
    expect(verifyPriceAlertUnsubscribeToken(bad)).toBeNull();
  });

  it('rejects wrong secret', () => {
    vi.stubEnv('PRICE_ALERT_UNSUBSCRIBE_SECRET', 'a');
    const token = signPriceAlertUnsubscribeToken('550e8400-e29b-41d4-a716-446655440000', 'a');
    expect(verifyPriceAlertUnsubscribeToken(token, 'b')).toBeNull();
  });
});
