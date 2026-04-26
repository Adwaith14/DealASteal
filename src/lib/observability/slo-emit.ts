import 'server-only';
import { logger } from '@/lib/observability/logger';

const slo = logger.child('slo');

/**
 * Structured SLO line for Vercel / log aggregators (chart ``durationMs`` by ``op``).
 */
export function emitSloMetric(parts: {
  op: string;
  durationMs: number;
  httpStatus: number;
  error?: boolean;
}): void {
  slo.info('metric', {
    kind: 'slo',
    op: parts.op,
    durationMs: parts.durationMs,
    httpStatus: parts.httpStatus,
    ...(parts.error ? { error: true } : {}),
  });
}

export async function measureSlo<T extends { status: number }>(
  op: string,
  fn: () => Promise<T>
): Promise<T> {
  const t0 = Date.now();
  try {
    const res = await fn();
    emitSloMetric({
      op,
      durationMs: Date.now() - t0,
      httpStatus: res.status,
    });
    return res;
  } catch (cause) {
    emitSloMetric({
      op,
      durationMs: Date.now() - t0,
      httpStatus: 500,
      error: true,
    });
    throw cause;
  }
}
