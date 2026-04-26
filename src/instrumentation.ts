import * as Sentry from '@sentry/nextjs';

export async function register(): Promise<void> {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { registerNodeTelemetry } = await import('@/lib/observability/register-node-telemetry');
    registerNodeTelemetry();
    if (process.env.SENTRY_DSN?.trim()) {
      await import('../sentry.server.config');
    }
  }
  if (process.env.NEXT_RUNTIME === 'edge' && process.env.SENTRY_DSN?.trim()) {
    await import('../sentry.edge.config');
  }
}

export const onRequestError = Sentry.captureRequestError;
