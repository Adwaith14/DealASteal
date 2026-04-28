/** @vitest-environment jsdom */
import type { ReactNode } from 'react';
import { cleanup, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Deal } from '@/types/database.types';
import { CuratedForYouSection } from './CuratedForYouSection';

vi.mock('next/link', () => ({
  default: ({ children, href }: { children: ReactNode; href: string }) => <a href={href}>{children}</a>,
}));

vi.mock('next/image', () => ({
  default: (props: Record<string, unknown>) => (
    <img alt="" src={typeof props.src === 'string' ? props.src : ''} data-testid="card-img" />
  ),
}));

afterEach(() => {
  cleanup();
});

function deal(id: string, title: string): Deal {
  return {
    id,
    merchant_id: 'm1',
    title,
    description: null,
    original_price: 100,
    discount_price: 80,
    discount_percentage: 20,
    affiliate_url: 'https://example.com/out',
    image_url: null,
    is_loot_deal: false,
    is_active: true,
    expires_at: null,
    created_at: '2026-01-01T12:00:00.000Z',
    category_slug: null,
    ingest_external_id: null,
    merchant_name: 'Test Store',
  };
}

describe('CuratedForYouSection', () => {
  it('renders Popular Deals, Latest Deals, and Biggest Price Drop with See more buttons', () => {
    const buckets = {
      newest: [deal('n1', 'Newest Alpha')],
      popular: [deal('p1', 'Popular Beta')],
      biggest_drop: [deal('b1', 'Biggest Gamma')],
    };

    render(<CuratedForYouSection buckets={buckets} />);

    const popular = screen.getByRole('region', { name: /^Popular Deals$/i });
    expect(within(popular).getByText('Popular Beta')).toBeInTheDocument();

    const newest = screen.getByRole('region', { name: /^Latest Deals$/i });
    expect(within(newest).getByText('Newest Alpha')).toBeInTheDocument();

    const drop = screen.getByRole('region', { name: /Biggest Price Drop/i });
    expect(within(drop).getByText('Biggest Gamma')).toBeInTheDocument();

    expect(screen.queryByText(/Curated for You/i)).not.toBeInTheDocument();
    expect(screen.queryByRole('tab')).not.toBeInTheDocument();

    expect(screen.getAllByRole('button', { name: /^See more$/i })).toHaveLength(3);
  });
});
