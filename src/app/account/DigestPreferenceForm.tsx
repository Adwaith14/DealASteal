'use client';

import { useState, useTransition } from 'react';

type DigestPreferenceFormProps = {
  initialDigestWeekly: boolean;
};

export function DigestPreferenceForm({ initialDigestWeekly }: DigestPreferenceFormProps) {
  const [digestWeekly, setDigestWeekly] = useState(initialDigestWeekly);
  const [status, setStatus] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const save = () => {
    setStatus(null);
    startTransition(async () => {
      const res = await fetch('/api/me/preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ digestWeekly }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        setStatus(body.error ?? 'Could not save');
        return;
      }
      setStatus('Saved.');
    });
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <h2 className="text-sm font-extrabold uppercase tracking-wide text-gray-900">Preferences</h2>
      <label className="mt-4 flex cursor-pointer items-start gap-3 text-sm text-gray-800">
        <input
          type="checkbox"
          className="mt-0.5 size-4 rounded border-gray-300 text-orange-600 focus:ring-orange-500"
          checked={digestWeekly}
          onChange={(e) => setDigestWeekly(e.target.checked)}
        />
        <span>Weekly email digest of new deals (coming soon — stored for when we enable mail).</span>
      </label>
      <button
        type="button"
        disabled={pending}
        onClick={() => save()}
        className="mt-4 rounded-lg border border-gray-300 bg-gray-50 px-4 py-2 text-sm font-bold text-gray-900 shadow-sm transition hover:bg-white disabled:opacity-50"
      >
        {pending ? 'Saving…' : 'Save preferences'}
      </button>
      {status ? (
        <p className={`mt-2 text-xs font-medium ${status === 'Saved.' ? 'text-emerald-700' : 'text-red-600'}`}>
          {status}
        </p>
      ) : null}
    </div>
  );
}
