/** @vitest-environment node */
import { trace } from '@opentelemetry/api';
import {
  BasicTracerProvider,
  InMemorySpanExporter,
  SimpleSpanProcessor,
} from '@opentelemetry/sdk-trace-base';
import { afterEach, describe, expect, it } from 'vitest';
import { INGEST_TRACER_NAME, withIngestRootSpan } from '@/lib/observability/ingest-tracing';

describe('ingest tracing', () => {
  afterEach(() => {
    trace.disable();
  });

  it('emits a span whose instrumentation scope is ingest (service.name contract for Phase 21)', async () => {
    const exporter = new InMemorySpanExporter();
    const provider = new BasicTracerProvider({
      spanProcessors: [new SimpleSpanProcessor(exporter)],
    });
    trace.setGlobalTracerProvider(provider);

    await withIngestRootSpan('ingest.deals.post', async () => 'ok');

    const spans = exporter.getFinishedSpans();
    expect(spans.length).toBe(1);
    expect(spans[0].instrumentationScope.name).toBe(INGEST_TRACER_NAME);
    expect(spans[0].name).toBe('ingest.deals.post');
  });
});
