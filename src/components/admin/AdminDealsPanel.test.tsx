/** @vitest-environment jsdom */
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Deal } from '@/types/database.types';
import { AdminDealsPanel } from './AdminDealsPanel';

const refresh = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh }),
}));

const baseDeal: Deal = {
  id: '660e8400-e29b-41d4-a716-446655440001',
  merchant_id: '550e8400-e29b-41d4-a716-446655440000',
  title: 'Test deal',
  description: null,
  original_price: 100,
  discount_price: 50,
  discount_percentage: 50,
  affiliate_url: 'https://example.com/x',
  image_url: null,
  is_loot_deal: false,
  is_active: true,
  expires_at: null,
  created_at: new Date().toISOString(),
  category_slug: 'tech',
  ingest_external_id: null,
  admin_pinned_at: null,
  admin_hidden: false,
};

afterEach(() => {
  vi.restoreAllMocks();
  cleanup();
});

describe('AdminDealsPanel', () => {
  it('Pin sends PATCH with pinned true', () => {
    globalThis.fetch = vi.fn(() =>
      Promise.resolve(new Response(JSON.stringify({ ok: true }), { status: 200 }))
    ) as typeof fetch;

    render(<AdminDealsPanel deals={[baseDeal]} networks={[]} />);
    fireEvent.click(screen.getByRole('button', { name: 'Pin' }));
    expect(fetch).toHaveBeenCalledWith(
      '/api/admin/deals/660e8400-e29b-41d4-a716-446655440001',
      expect.objectContaining({
        method: 'PATCH',
        body: JSON.stringify({ pinned: true }),
      })
    );
  });

  it('Unpin sends PATCH with pinned false', () => {
    globalThis.fetch = vi.fn(() =>
      Promise.resolve(new Response(JSON.stringify({ ok: true }), { status: 200 }))
    ) as typeof fetch;

    const pinned: Deal = { ...baseDeal, admin_pinned_at: '2026-01-01T00:00:00.000Z' };
    render(<AdminDealsPanel deals={[pinned]} networks={[]} />);
    fireEvent.click(screen.getByRole('button', { name: 'Unpin' }));
    expect(fetch).toHaveBeenCalledWith(
      '/api/admin/deals/660e8400-e29b-41d4-a716-446655440001',
      expect.objectContaining({
        method: 'PATCH',
        body: JSON.stringify({ pinned: false }),
      })
    );
  });
});
