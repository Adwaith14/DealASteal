/** @vitest-environment jsdom */
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { StoresSupportedSection } from './StoresSupportedSection';

afterEach(() => {
  cleanup();
});

describe('StoresSupportedSection', () => {
  it('renders partner heading and store links', () => {
    render(
      <StoresSupportedSection
        stores={[
          {
            slug: 'amazon',
            label: 'Amazon',
            domain: 'amazon.com',
            dealCount: 12,
            avgDiscountPct: 23,
            successRatePct: 86,
            latestDealAt: '2026-01-01T00:00:00.000Z',
          },
          {
            slug: 'apple',
            label: 'Apple',
            domain: 'apple.com',
            dealCount: 4,
            avgDiscountPct: 10,
            successRatePct: 77,
            latestDealAt: '2026-01-02T00:00:00.000Z',
          },
        ]}
      />
    );

    expect(screen.getByRole('heading', { name: /partner stores/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /view all partners/i })).toHaveAttribute('href', '/partners');
    expect(screen.getByLabelText('Amazon')).toBeInTheDocument();
    expect(screen.getByLabelText('Apple')).toBeInTheDocument();
  });
});
