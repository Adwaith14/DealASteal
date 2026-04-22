import type { ReactNode } from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Deal } from '@/types/database.types';
import { DealCard } from './DealCard';

const TEST_ORIGIN = 'https://example.test';

afterEach(() => {
  cleanup();
});

vi.mock('next/link', () => ({
  default: ({
    children,
    href,
    ...rest
  }: {
    children: ReactNode;
    href: string;
  }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

vi.mock('next/image', () => ({
  default: (props: Record<string, unknown>) => {
    const { alt, className, src, sizes, priority: _p, fill: _f, ...rest } = props;
    const srcString =
      typeof src === 'string' ? src : src != null ? String(src) : '';
    return (
      <img
        alt={String(alt ?? '')}
        className={typeof className === 'string' ? className : undefined}
        src={srcString}
        data-sizes={typeof sizes === 'string' ? sizes : undefined}
        {...rest}
      />
    );
  },
}));

vi.mock('./DealShareRow', () => ({
  DealShareRow: ({ dealPageUrl }: { dealPageUrl: string }) => (
    <div data-testid="share-row">{dealPageUrl}</div>
  ),
}));

function buildDeal(overrides: Partial<Deal> = {}): Deal {
  return {
    id: 'deal-1',
    merchant_id: 'merchant-1',
    created_at: '2019-06-01T12:00:00.000Z',
    title: 'Example deal title that can span more than one line for clamping',
    description: null,
    original_price: 100,
    discount_price: 75,
    discount_percentage: 25,
    affiliate_url: 'https://example.com/deal',
    image_url: null,
    is_loot_deal: false,
    is_active: true,
    expires_at: null,
    category_slug: null,
    ingest_external_id: null,
    ...overrides,
  };
}

describe('DealCard', () => {
  it('renders Grab the Deal link with secure new-tab attributes', () => {
    render(<DealCard deal={buildDeal()} dealPageUrl={`${TEST_ORIGIN}/deals/deal-1`} />);

    const link = screen.getByRole('link', { name: /grab the deal/i });
    expect(link).toHaveAttribute('href', 'https://example.com/deal');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('shows fire prefix on discount badge when is_loot_deal is true', () => {
    render(
      <DealCard deal={buildDeal({ is_loot_deal: true })} dealPageUrl={`${TEST_ORIGIN}/deals/deal-1`} />
    );
    const badge = screen.getByText(/25% OFF/).closest('span');
    expect(badge).toBeTruthy();
    expect(badge).toHaveTextContent(/🔥/);
  });

  it('hides fire on badge when is_loot_deal is false', () => {
    render(<DealCard deal={buildDeal({ is_loot_deal: false })} dealPageUrl={`${TEST_ORIGIN}/deals/deal-1`} />);
    expect(screen.queryByText('🔥')).not.toBeInTheDocument();
  });

  it('shows the shopping fallback when image_url is null', () => {
    render(<DealCard deal={buildDeal({ image_url: null })} dealPageUrl={`${TEST_ORIGIN}/deals/deal-1`} />);

    expect(screen.getByLabelText('No product image')).toBeInTheDocument();
    expect(
      screen.queryByRole('img', { name: /example deal title/i })
    ).not.toBeInTheDocument();
  });

  it('renders next/image when image_url is set', () => {
    render(
      <DealCard
        deal={buildDeal({ image_url: 'https://example.com/image.jpg' })}
        dealPageUrl={`${TEST_ORIGIN}/deals/deal-1`}
      />
    );

    const img = screen.getByRole('img', { name: /example deal title/i });
    expect(img).toHaveAttribute('src', 'https://example.com/image.jpg');
  });

  it('renders the discount badge with a rounded percentage', () => {
    render(
      <DealCard
        deal={buildDeal({ discount_percentage: 33.6 })}
        dealPageUrl={`${TEST_ORIGIN}/deals/deal-1`}
      />
    );
    expect(screen.getByText('34% OFF')).toBeInTheDocument();
  });

  it('links the title to the deal detail route', () => {
    render(<DealCard deal={buildDeal()} dealPageUrl={`${TEST_ORIGIN}/deals/deal-1`} />);
    const titleLink = screen.getByRole('link', { name: /example deal title/i });
    expect(titleLink).toHaveAttribute('href', '/deals/deal-1');
  });

  it('passes deal page URL to the share row', () => {
    render(<DealCard deal={buildDeal()} dealPageUrl={`${TEST_ORIGIN}/deals/deal-1`} />);
    expect(screen.getByTestId('share-row')).toHaveTextContent(`${TEST_ORIGIN}/deals/deal-1`);
  });
});
