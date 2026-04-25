'use client';

import { useEffect, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { trackDealSaveToggle } from '@/lib/analytics/product-events';
import { getSupabaseBrowserClient } from '@/lib/supabase/browser-client';
import {
  invalidateSavedDealIdsCache,
  loadSavedDealIdsCached,
} from '@/utils/saved-deals-client-cache';

type SaveDealButtonProps = {
  dealId: string;
  /** When set (e.g. PDP SSR), seed UI; still refreshes from cache on auth changes. */
  initialSaved?: boolean;
  /** Compact icon style for cards vs PDP. */
  variant?: 'icon' | 'wide';
};

function HeartIcon({ filled, className }: { filled: boolean; className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} aria-hidden>
      <path
        d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function SaveDealButton({ dealId, initialSaved, variant = 'icon' }: SaveDealButtonProps) {
  const router = useRouter();
  const [saved, setSaved] = useState<boolean | null>(
    typeof initialSaved === 'boolean' ? initialSaved : null
  );
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (typeof initialSaved === 'boolean') {
      setSaved(initialSaved);
    }
  }, [initialSaved]);

  useEffect(() => {
    if (typeof initialSaved === 'boolean') {
      return;
    }
    void loadSavedDealIdsCached().then((ids) => {
      setSaved(ids.includes(dealId));
    });
  }, [dealId, initialSaved]);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      return;
    }
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      invalidateSavedDealIdsCache();
      void loadSavedDealIdsCached().then((ids) => {
        setSaved(ids.includes(dealId));
      });
    });
    return () => {
      subscription.unsubscribe();
    };
  }, [dealId]);

  const toggle = () => {
    setError(null);
    startTransition(async () => {
      const supabase = getSupabaseBrowserClient();
      if (!supabase) {
        const next =
          typeof window !== 'undefined'
            ? `${window.location.pathname}${window.location.search}`
            : '/';
        router.push(`/login?next=${encodeURIComponent(next)}`);
        return;
      }
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        const next =
          typeof window !== 'undefined'
            ? `${window.location.pathname}${window.location.search}`
            : '/';
        router.push(`/login?next=${encodeURIComponent(next)}`);
        return;
      }

      const nextSave = !saved;
      const res = await fetch('/api/me/saved-deals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ dealId, save: nextSave }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        setError(body.error ?? 'Could not update');
        return;
      }
      invalidateSavedDealIdsCache();
      setSaved(nextSave);
      trackDealSaveToggle({ dealId, save: nextSave });
      router.refresh();
    });
  };

  const isSaved = saved === true;
  const label = isSaved ? 'Saved' : 'Save';

  const baseClass =
    variant === 'wide'
      ? 'inline-flex min-h-12 w-full flex-1 items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 text-sm font-bold text-gray-800 shadow-sm transition hover:border-red-300 hover:bg-red-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 disabled:opacity-50'
      : 'inline-flex size-9 shrink-0 items-center justify-center rounded-lg border border-gray-300 bg-white text-gray-600 shadow-sm transition hover:border-red-300 hover:bg-red-50 hover:text-red-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 disabled:opacity-50';

  return (
    <div className={variant === 'wide' ? 'flex min-w-0 flex-1 flex-col' : 'inline-flex flex-col items-center'}>
      <button
        type="button"
        className={baseClass}
        aria-pressed={isSaved}
        aria-label={label}
        title={label}
        disabled={pending || saved === null}
        onClick={() => toggle()}
      >
        <HeartIcon filled={isSaved} className={variant === 'wide' ? 'size-5' : 'size-4'} />
        {variant === 'wide' ? <span>{label}</span> : null}
      </button>
      {error ? <p className="mt-1 text-center text-[10px] font-medium text-red-600">{error}</p> : null}
    </div>
  );
}
