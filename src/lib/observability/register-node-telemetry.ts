import 'server-only';
import { diag, DiagConsoleLogger, DiagLogLevel, trace } from '@opentelemetry/api';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { resourceFromAttributes } from '@opentelemetry/resources';
import { ATTR_SERVICE_NAME } from '@opentelemetry/semantic-conventions';
import { BasicTracerProvider, BatchSpanProcessor } from '@opentelemetry/sdk-trace-base';

let registered = false;

/**
 * Registers a global tracer provider + OTLP exporter when
 * ``OTEL_EXPORTER_OTLP_ENDPOINT`` (or ``OTEL_EXPORTER_OTLP_TRACES_ENDPOINT``) is set.
 * Safe to call multiple times (no-op after first).
 */
export function registerNodeTelemetry(): void {
  if (registered) {
    return;
  }
  registered = true;

  const endpoint =
    process.env.OTEL_EXPORTER_OTLP_TRACES_ENDPOINT?.trim() ||
    process.env.OTEL_EXPORTER_OTLP_ENDPOINT?.trim() ||
    '';
  if (!endpoint) {
    return;
  }

  if (process.env.OTEL_DIAG_LOG === '1') {
    diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.DEBUG);
  }

  const serviceName = process.env.OTEL_SERVICE_NAME?.trim() || 'dealasteal-web';

  const exporter = new OTLPTraceExporter({
    url: endpoint.includes('/v1/traces') ? endpoint : `${endpoint.replace(/\/$/, '')}/v1/traces`,
    headers: parseOtlpHeaders(),
  });

  const provider = new BasicTracerProvider({
    resource: resourceFromAttributes({
      [ATTR_SERVICE_NAME]: serviceName,
    }),
    spanProcessors: [new BatchSpanProcessor(exporter)],
  });

  trace.setGlobalTracerProvider(provider);
}

function parseOtlpHeaders(): Record<string, string> | undefined {
  const raw = process.env.OTEL_EXPORTER_OTLP_HEADERS?.trim();
  if (!raw) {
    return undefined;
  }
  const out: Record<string, string> = {};
  for (const pair of raw.split(',')) {
    const [k, ...rest] = pair.split('=');
    if (!k?.trim() || rest.length === 0) continue;
    out[k.trim()] = rest.join('=').trim();
  }
  return Object.keys(out).length ? out : undefined;
}
