/** @vitest-environment node */
import { afterEach, describe, expect, it, vi } from 'vitest';

const { info } = vi.hoisted(() => ({ info: vi.fn() }));

vi.mock('@/lib/observability/logger', () => ({
  logger: {
    child: () => ({ info }),
  },
}));

import { emitSloMetric, measureSlo } from '@/lib/observability/slo-emit';

describe('slo-emit', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('emitSloMetric logs structured slo ctx', () => {
    emitSloMetric({ op: 'test.op', durationMs: 12, httpStatus: 200 });
    expect(info).toHaveBeenCalledWith('metric', {
      kind: 'slo',
      op: 'test.op',
      durationMs: 12,
      httpStatus: 200,
    });
  });

  it('measureSlo logs on success', async () => {
    const res = await measureSlo('x', async () => ({ status: 201 } as const));
    expect(res.status).toBe(201);
    expect(info).toHaveBeenCalledWith(
      'metric',
      expect.objectContaining({ kind: 'slo', op: 'x', httpStatus: 201 })
    );
  });

  it('measureSlo logs error path on throw', async () => {
    await expect(
      measureSlo('y', async () => {
        throw new Error('boom');
      })
    ).rejects.toThrow('boom');
    expect(info).toHaveBeenCalledWith(
      'metric',
      expect.objectContaining({ kind: 'slo', op: 'y', httpStatus: 500, error: true })
    );
  });
});
