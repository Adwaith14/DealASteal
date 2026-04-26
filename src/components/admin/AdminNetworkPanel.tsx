'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';

export type IngestNetworkSettingRow = {
  network_slug: string;
  ingest_enabled: boolean;
  tos_url: string | null;
  disclosure_note: string | null;
  attribution_note: string | null;
  updated_at: string | null;
};

type AdminNetworkPanelProps = {
  settings: IngestNetworkSettingRow[];
};

export function AdminNetworkPanel({ settings: initial }: AdminNetworkPanelProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [rows, setRows] = useState(initial);

  const patch = (body: Record<string, unknown>) => {
    setError(null);
    startTransition(async () => {
      const res = await fetch('/api/admin/network-settings', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string };
        setError(j.error ?? `HTTP ${res.status}`);
        return;
      }
      router.refresh();
    });
  };

  return (
    <section aria-labelledby="network-settings-heading" className="rounded-lg border border-gray-200 bg-white p-4">
      <h2 id="network-settings-heading" className="text-lg font-semibold text-gray-900">
        Ingest networks
      </h2>
      <p className="mt-1 text-sm text-gray-600">
        Turn workers off without redeploying. Python workers read{' '}
        <code className="rounded bg-gray-100 px-1 text-xs">GET /api/ingest/network-config</code> when{' '}
        <code className="rounded bg-gray-100 px-1 text-xs">DEALASTEAL_BASE_URL</code> is set.
      </p>
      {error ? (
        <p className="mt-2 text-sm text-red-700" role="alert">
          {error}
        </p>
      ) : null}
      <ul className="mt-4 divide-y divide-gray-100">
        {rows.map((r) => (
          <li key={r.network_slug} className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <span className="font-mono text-sm font-semibold text-gray-900">{r.network_slug}</span>
              <div className="text-xs text-gray-500">
                ToS: {r.tos_url ? (
                  <a href={r.tos_url} className="text-[#D32F2F] underline" target="_blank" rel="noreferrer">
                    link
                  </a>
                ) : (
                  '—'
                )}
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                disabled={pending}
                className="rounded border border-gray-300 bg-white px-2 py-1 text-sm hover:bg-gray-50 disabled:opacity-50"
                onClick={() => {
                  const next = !r.ingest_enabled;
                  setRows((prev) => prev.map((x) => (x.network_slug === r.network_slug ? { ...x, ingest_enabled: next } : x)));
                  patch({ network_slug: r.network_slug, ingest_enabled: next });
                }}
              >
                {r.ingest_enabled ? 'Disable ingest' : 'Enable ingest'}
              </button>
            </div>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-xs text-gray-500">
        Compliance copy is stored per network; keep ToS / disclosure / attribution aligned with each program&apos;s
        contract (edit via API or SQL).
      </p>
    </section>
  );
}
