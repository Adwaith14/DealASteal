import * as Sentry from '@sentry/nextjs';

const SENSITIVE_HEADERS = new Set([
  'authorization',
  'cookie',
  'set-cookie',
  'x-api-key',
  'x-vercel-signature',
]);

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  enabled: Boolean(process.env.SENTRY_DSN?.trim()),
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1,
  environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV,
  beforeSend(event) {
    if (event.request?.cookies) {
      delete event.request.cookies;
    }
    const headers = event.request?.headers;
    if (headers && typeof headers === 'object') {
      for (const k of Object.keys(headers)) {
        if (SENSITIVE_HEADERS.has(k.toLowerCase())) {
          delete (headers as Record<string, unknown>)[k];
        }
      }
    }
    if (event.user) {
      delete event.user.email;
      delete event.user.ip_address;
    }
    return event;
  },
});
