'use client';

import { useState } from 'react';

export function AccountDataControls() {
  const [busy, setBusy] = useState<'export' | 'delete' | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function onExport() {
    setMessage(null);
    setBusy('export');
    try {
      const res = await fetch('/api/me/export', { method: 'GET' });
      if (!res.ok) {
        setMessage(`Export failed (${res.status})`);
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `dealasteal-export-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setMessage('Download started.');
    } finally {
      setBusy(null);
    }
  }

  async function onDelete() {
    setMessage(null);
    if (
      !window.confirm(
        'Permanently delete your DealASteal account? This removes your profile and saved deals. This cannot be undone.'
      )
    ) {
      return;
    }
    setBusy('delete');
    try {
      const res = await fetch('/api/me/delete', { method: 'DELETE' });
      if (res.status === 204) {
        window.location.href = '/';
        return;
      }
      const j = (await res.json().catch(() => ({}))) as { error?: string };
      setMessage(j.error ?? `Delete failed (${res.status})`);
    } finally {
      setBusy(null);
    }
  }

  return (
    <section className="rounded-xl border border-red-200 bg-red-50/60 p-4">
      <h2 className="text-sm font-extrabold uppercase tracking-wide text-red-900">Your data</h2>
      <p className="mt-2 text-xs leading-relaxed text-red-900/90">
        Export a JSON copy of your profile and saved deals (CCPA / GDPR portability). Delete removes your account
        entirely.
      </p>
      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
        <button
          type="button"
          onClick={() => void onExport()}
          disabled={busy !== null}
          className="rounded-lg border border-red-300 bg-white px-3 py-2 text-sm font-bold text-red-900 shadow-sm hover:bg-red-50 disabled:opacity-50"
        >
          {busy === 'export' ? 'Preparing…' : 'Export my data'}
        </button>
        <button
          type="button"
          onClick={() => void onDelete()}
          disabled={busy !== null}
          className="rounded-lg bg-red-700 px-3 py-2 text-sm font-bold text-white shadow-sm hover:bg-red-800 disabled:opacity-50"
        >
          {busy === 'delete' ? 'Deleting…' : 'Delete account'}
        </button>
      </div>
      {message ? <p className="mt-2 text-xs font-medium text-red-800">{message}</p> : null}
    </section>
  );
}
