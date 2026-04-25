/** @vitest-environment node */
import { describe, expect, it } from 'vitest';

describe('product-events', () => {
  it('trackDealSaveToggle does not throw on server', async () => {
    const { trackDealSaveToggle } = await import('./product-events');
    expect(() => trackDealSaveToggle({ dealId: 'deal-1', save: true })).not.toThrow();
  });
});
