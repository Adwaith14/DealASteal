'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';

type InitialAlert = { id: string; thresholdPrice: number } | null;

const money = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 2,
});

type PriceDropAlertFormProps = {
  dealId: string;
  currentPrice: number;
  signedIn: boolean;
  initialAlert: InitialAlert;
};

export function PriceDropAlertForm({ dealId, currentPrice, signedIn, initialAlert }: PriceDropAlertFormProps) {
  const router = useRouter();
  const [value, setValue] = useState(() =>
    initialAlert ? String(initialAlert.thresholdPrice) : String((Math.max(0.01, currentPrice * 0.9)).toFixed(2))
  );
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (!signedIn) {
    return (
      <div className="rounded-lg border border-dashed border-gray-200 bg-white/80 px-4 py-3 text-sm text-gray-600">
        <span className="font-semibold text-gray-900">Price drop email</span>
        <span className="mx-1.5">·</span>
        <Link href="/login" className="font-bold text-red-600 underline hover:text-red-700">
          Sign in
        </Link>{' '}
        to be notified when this hits your target price.
      </div>
    );
  }

  const save = () => {
    setError(null);
    const t = parseFloat(value.replace(/,/g, ''));
    if (!Number.isFinite(t) || t <= 0) {
      setError('Enter a valid price');
      return;
    }
    startTransition(async () => {
      const res = await fetch('/api/price-alerts', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ dealId, thresholdPrice: t }),
        credentials: 'same-origin',
      });
      if (res.status === 401) {
        setError('Session expired. Sign in again.');
        return;
      }
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string };
        setError(j.error ?? 'Could not save');
        return;
      }
      router.refresh();
    });
  };

  const remove = () => {
    if (!initialAlert) {
      return;
    }
    setError(null);
    startTransition(async () => {
      const res = await fetch(`/api/price-alerts?id=${encodeURIComponent(initialAlert.id)}`, {
        method: 'DELETE',
        credentials: 'same-origin',
      });
      if (res.status === 204 || res.status === 200) {
        router.refresh();
        return;
      }
      setError('Could not remove');
    });
  };

  return (
    <div className="rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm">
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="font-bold text-gray-900">Email when price drops to…</span>
        {initialAlert ? (
          <span className="text-xs text-emerald-600">You have an active alert</span>
        ) : null}
      </div>
      <p className="mb-2 text-xs text-gray-500">
        Current price {money.format(currentPrice)}. We only email on a <strong>drop</strong> to your target, not
        for small bumps while it stays low.
      </p>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
        <label className="flex flex-1 flex-col text-xs font-medium text-gray-600">
          Target (USD)
          <input
            type="number"
            inputMode="decimal"
            min={0.01}
            step={0.01}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="mt-1 rounded border border-gray-200 px-2 py-1.5 text-base text-gray-900"
          />
        </label>
        <button
          type="button"
          onClick={save}
          disabled={pending}
          className="min-h-10 rounded-lg bg-gray-900 px-4 text-sm font-bold text-white transition hover:bg-gray-800 disabled:opacity-50"
        >
          {initialAlert ? 'Update alert' : 'Create alert'}
        </button>
        {initialAlert ? (
          <button
            type="button"
            onClick={remove}
            disabled={pending}
            className="min-h-10 rounded-lg border border-gray-200 px-3 text-sm font-semibold text-gray-700 hover:bg-gray-50"
          >
            Remove
          </button>
        ) : null}
      </div>
      {error ? <p className="mt-2 text-xs font-medium text-red-600">{error}</p> : null}
    </div>
  );
}
