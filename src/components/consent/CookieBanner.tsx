'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  CONSENT_COOKIE_MAX_AGE_SECONDS,
  CONSENT_COOKIE_NAME,
  defaultAcceptAll,
  defaultDeniedNonEssential,
  parseConsentCookie,
  serializeConsentCookie,
  type ConsentDecision,
} from '@/lib/consent/cookie-store';
import { isEeaLikeCountry, isUnitedStates } from '@/lib/consent/geo';

function readCountryFromDocumentCookie(): string {
  if (typeof document === 'undefined') return '';
  const m = document.cookie.match(/(?:^|;\s*)das_country=([^;]*)/);
  return decodeURIComponent(m?.[1] ?? '').trim().toUpperCase().slice(0, 2);
}

function writeConsentCookie(decision: ConsentDecision): void {
  const v = serializeConsentCookie(decision);
  const secure = typeof window !== 'undefined' && window.location.protocol === 'https:' ? '; Secure' : '';
  document.cookie = `${CONSENT_COOKIE_NAME}=${v}; Path=/; Max-Age=${CONSENT_COOKIE_MAX_AGE_SECONDS}; SameSite=Lax${secure}`;
}

type CookieBannerProps = {
  /** From middleware cookie or ``x-vercel-ip-country`` (server). */
  serverCountry: string;
};

export function CookieBanner({ serverCountry }: CookieBannerProps) {
  const [mounted, setMounted] = useState(false);
  const [decision, setDecision] = useState<ConsentDecision | null>(null);
  const [dismissedUsStrip, setDismissedUsStrip] = useState(false);

  useEffect(() => {
    setMounted(true);
    const raw = document.cookie
      .split(';')
      .map((c) => c.trim())
      .find((c) => c.startsWith(`${CONSENT_COOKIE_NAME}=`));
    const value = raw?.slice(`${CONSENT_COOKIE_NAME}=`.length);
    setDecision(parseConsentCookie(value));
  }, []);

  const country = useMemo(() => {
    const c = readCountryFromDocumentCookie() || serverCountry;
    return c.trim().toUpperCase().slice(0, 2);
  }, [serverCountry, mounted]);

  const showGdpr = isEeaLikeCountry(country);
  const showUsStrip = isUnitedStates(country) && !showGdpr;

  const onRejectNonEssential = useCallback(() => {
    const d = defaultDeniedNonEssential();
    writeConsentCookie(d);
    setDecision(d);
  }, []);

  const onAcceptAll = useCallback(() => {
    const d = defaultAcceptAll();
    writeConsentCookie(d);
    setDecision(d);
  }, []);

  if (!mounted) return null;

  if (showGdpr && decision == null) {
    return (
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="consent-title"
        className="fixed inset-x-0 bottom-0 z-[100] border-t border-gray-800 bg-[#1a1f2e] px-4 py-4 text-gray-100 shadow-[0_-8px_30px_rgba(0,0,0,0.35)] sm:px-6"
      >
        <div className="mx-auto flex max-w-4xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0 flex-1 text-sm leading-relaxed">
            <h2 id="consent-title" className="font-bold text-white">
              Cookies & privacy
            </h2>
            <p className="mt-1 text-gray-300">
              We use essential cookies to run the site (session, security). Optional analytics/marketing
              cookies stay off until you opt in. See{' '}
              <Link href="/privacy" className="font-semibold text-orange-400 underline hover:text-orange-300">
                Privacy
              </Link>
              .
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap gap-2">
            <button
              type="button"
              onClick={onRejectNonEssential}
              className="rounded-lg border border-gray-500 px-4 py-2 text-sm font-bold text-white hover:bg-gray-800"
            >
              Essential only
            </button>
            <button
              type="button"
              onClick={onAcceptAll}
              className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-bold text-white hover:bg-orange-600"
            >
              Accept all
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (showUsStrip && decision == null && !dismissedUsStrip) {
    return (
      <div className="fixed inset-x-0 bottom-0 z-[99] border-t border-amber-900/40 bg-amber-950/95 px-4 py-2 text-xs text-amber-50 sm:text-sm">
        <div className="mx-auto flex max-w-4xl flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <p>
            California residents: you may have the right to opt out of the &quot;sale&quot; or
            &quot;sharing&quot; of personal information. See{' '}
            <Link href="/privacy#ccpa" className="font-bold underline">
              CCPA section
            </Link>{' '}
            in our Privacy Policy.
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                onRejectNonEssential();
                setDismissedUsStrip(true);
              }}
              className="shrink-0 rounded bg-amber-800 px-2 py-1 font-bold text-white hover:bg-amber-700"
            >
              OK
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
