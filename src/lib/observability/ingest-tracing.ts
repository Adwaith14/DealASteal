import 'server-only';
import { SpanKind, SpanStatusCode, trace } from '@opentelemetry/api';

/** Instrumentation scope name = logical ``service.name`` for ingest (see Phase 21 smoke test). */
export const INGEST_TRACER_NAME = 'ingest';

export function getIngestTracer() {
  return trace.getTracer(INGEST_TRACER_NAME, '1.0.0');
}

export async function withIngestRootSpan<T>(spanName: string, fn: () => Promise<T>): Promise<T> {
  const tracer = getIngestTracer();
  return tracer.startActiveSpan(
    spanName,
    { kind: SpanKind.SERVER },
    async (span) => {
      try {
        return await fn();
      } catch (cause) {
        const err = cause instanceof Error ? cause : new Error(String(cause));
        span.recordException(err);
        span.setStatus({ code: SpanStatusCode.ERROR, message: err.message });
        throw cause;
      } finally {
        span.end();
      }
    }
  );
}
