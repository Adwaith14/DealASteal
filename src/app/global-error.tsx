'use client';

import * as Sentry from '@sentry/nextjs';
import { useEffect } from 'react';

type GlobalErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

/**
 * Root error boundary for App Router (required for Sentry React render errors).
 */
export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="en">
      <body className="min-h-dvh bg-gray-50 px-4 py-16 text-center text-gray-900">
        <h1 className="text-xl font-bold">Something went wrong</h1>
        <p className="mt-2 text-sm text-gray-600">We have been notified.</p>
        <button
          type="button"
          onClick={reset}
          className="mt-6 rounded-lg bg-orange-500 px-5 py-2.5 text-sm font-bold text-white"
        >
          Try again
        </button>
      </body>
    </html>
  );
}
