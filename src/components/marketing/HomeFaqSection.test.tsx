/** @vitest-environment jsdom */
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { HomeFaqSection } from './HomeFaqSection';

afterEach(() => {
  cleanup();
});

describe('HomeFaqSection', () => {
  it(
    'renders FAQ heading, accordion questions, and reveals answers when expanded',
    () => {
      render(<HomeFaqSection />);

      expect(screen.getByRole('heading', { name: /Frequently Asked Questions/i })).toBeInTheDocument();
      expect(screen.getByRole('region', { name: /Frequently Asked Questions/i })).toHaveAttribute('id', 'faq');

      expect(screen.getByText(/How does DealASteal pick which deals to show\?/i)).toBeInTheDocument();
      expect(screen.getByText(/Is DealASteal free to use\?/i)).toBeInTheDocument();

      const lastSummary = screen
        .getByText(/Why do I sometimes leave DealASteal when I click a deal\?/i)
        .closest('summary') as HTMLSummaryElement;
      const lastDetails = lastSummary.parentElement as HTMLDetailsElement;
      expect(lastDetails.open).toBe(false);

      fireEvent.click(lastSummary);
      expect(lastDetails.open).toBe(true);
      expect(screen.getByText(/Purchases complete on the merchant/u)).toBeInTheDocument();
    },
    10_000
  );
});
