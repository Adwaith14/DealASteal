'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { DEAL_CATEGORY_NAV } from '@/constants/deal-categories';
import type { Deal } from '@/types/database.types';

type IngestRow = {
  network: string;
  last_started_at: string | null;
  last_finished_at: string | null;
  last_ok: boolean | null;
  last_error: string | null;
  last_rows: number | null;
  updated_at: string | null;
};

type AdminDealsPanelProps = {
  deals: Deal[];
  networks: IngestRow[];
};

export function AdminDealsPanel({ deals: initialDeals, networks }: AdminDealsPanelProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const patchDeal = (dealId: string, body: Record<string, unknown>) => {
    setError(null);
    startTransition(async () => {
      const res = await fetch(`/api/admin/deals/${dealId}`, {
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
    <div className="space-y-10">
      {error ? (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800" role="alert">
          {error}
        </p>
      ) : null}

      <section aria-labelledby="ingest-status-heading">
        <h2 id="ingest-status-heading" className="text-lg font-semibold text-gray-900">
          Ingest job status
        </h2>
        <p className="mt-1 text-sm text-gray-600">
          Workers can POST to <code className="rounded bg-gray-100 px-1">/api/ingest/network-status</code> with the
          ingestion bearer key.
        </p>
        <div className="mt-3 overflow-x-auto rounded-lg border border-gray-200 bg-white">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-gray-200 bg-gray-50 text-gray-700">
              <tr>
                <th className="px-3 py-2 font-medium">Network</th>
                <th className="px-3 py-2 font-medium">Last run</th>
                <th className="px-3 py-2 font-medium">OK</th>
                <th className="px-3 py-2 font-medium">Rows</th>
                <th className="px-3 py-2 font-medium">Error</th>
              </tr>
            </thead>
            <tbody>
              {networks.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-3 py-4 text-gray-500">
                    No rows yet.
                  </td>
                </tr>
              ) : (
                networks.map((n) => (
                  <tr key={n.network} className="border-b border-gray-100">
                    <td className="px-3 py-2 font-mono text-xs">{n.network}</td>
                    <td className="px-3 py-2 text-gray-700">
                      {n.last_finished_at ? new Date(n.last_finished_at).toLocaleString() : '—'}
                    </td>
                    <td className="px-3 py-2">{n.last_ok == null ? '—' : n.last_ok ? 'yes' : 'no'}</td>
                    <td className="px-3 py-2">{n.last_rows ?? '—'}</td>
                    <td className="px-3 py-2 text-red-700">{n.last_error ?? '—'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section aria-labelledby="deals-heading">
        <h2 id="deals-heading" className="text-lg font-semibold text-gray-900">
          Deals
        </h2>
        <div className="mt-3 overflow-x-auto rounded-lg border border-gray-200 bg-white">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-gray-200 bg-gray-50 text-gray-700">
              <tr>
                <th className="px-3 py-2 font-medium">Title</th>
                <th className="px-3 py-2 font-medium">Category</th>
                <th className="px-3 py-2 font-medium">Pin</th>
                <th className="px-3 py-2 font-medium">Hidden</th>
              </tr>
            </thead>
            <tbody>
              {initialDeals.map((d) => (
                <DealAdminRow key={d.id} deal={d} disabled={pending} onPatch={(body) => patchDeal(d.id, body)} />
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function DealAdminRow({
  deal,
  disabled,
  onPatch,
}: {
  deal: Deal;
  disabled: boolean;
  onPatch: (body: Record<string, unknown>) => void;
}) {
  const pinned = Boolean(deal.admin_pinned_at);
  const hidden = Boolean(deal.admin_hidden);

  return (
    <tr className="border-b border-gray-100 align-top">
      <td className="max-w-xs px-3 py-2">
        <div className="font-medium text-gray-900">{deal.title}</div>
        <div className="mt-1 font-mono text-xs text-gray-500">{deal.id}</div>
      </td>
      <td className="px-3 py-2">
        <label className="sr-only" htmlFor={`cat-${deal.id}`}>
          Category for {deal.title}
        </label>
        <select
          id={`cat-${deal.id}`}
          className="rounded border border-gray-300 bg-white px-2 py-1 text-sm"
          defaultValue={deal.category_slug ?? ''}
          disabled={disabled}
          onChange={(e) => {
            const v = e.target.value;
            onPatch({ category_slug: v === '' ? null : v });
          }}
        >
          <option value="">(none)</option>
          {DEAL_CATEGORY_NAV.map((c) => (
            <option key={c.slug} value={c.slug}>
              {c.label}
            </option>
          ))}
        </select>
      </td>
      <td className="px-3 py-2">
        <button
          type="button"
          className="rounded border border-gray-300 bg-white px-2 py-1 text-sm hover:bg-gray-50 disabled:opacity-50"
          disabled={disabled}
          onClick={() => onPatch({ pinned: !pinned })}
        >
          {pinned ? 'Unpin' : 'Pin'}
        </button>
      </td>
      <td className="px-3 py-2">
        <button
          type="button"
          className="rounded border border-gray-300 bg-white px-2 py-1 text-sm hover:bg-gray-50 disabled:opacity-50"
          disabled={disabled}
          onClick={() => onPatch({ admin_hidden: !hidden })}
        >
          {hidden ? 'Show' : 'Hide'}
        </button>
      </td>
    </tr>
  );
}
