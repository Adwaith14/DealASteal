import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Deal } from '@/types/database.types';
import { HorizontalDealScroll } from './HorizontalDealScroll';

vi.mock('./DealCard', () => ({
  DealCard: ({ deal }: { deal: Deal }) => <div data-testid="deal-card">{deal.id}</div>,
}));

afterEach(() => {
  cleanup();
});

describe('HorizontalDealScroll', () => {
  it('renders section shell with empty-state text when there are no deals', () => {
    render(
      <HorizontalDealScroll
        deals={[]}
        icon="⏱"
        title="Expiring Soon"
        subtitle="Grab them before they're gone"
        origin="https://example.test"
      />
    );

    expect(screen.getByRole('heading', { name: /expiring soon/i })).toBeInTheDocument();
    expect(screen.getByText('No deals available in this section right now.')).toBeInTheDocument();
    expect(screen.queryByTestId('deal-card')).not.toBeInTheDocument();
  });
});
