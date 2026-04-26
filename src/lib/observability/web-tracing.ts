import 'server-only';
import { SpanKind, SpanStatusCode, trace } from '@opentelemetry/api';

const WEB = 'dealasteal-web';

export function getWebTracer() {
  return trace.getTracer(WEB, '1.0.0');
}

export async function withWebSpan<T>(spanName: string, fn: () => Promise<T>): Promise<T> {
  const tracer = getWebTracer();
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
