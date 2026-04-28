/** @vitest-environment jsdom */
import type { ReactNode } from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { HomeMarketingHero } from './HomeMarketingHero';

vi.mock('next/link', () => ({
  default: ({ href, children, ...rest }: { href: string; children: ReactNode }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

afterEach(() => {
  cleanup();
});

describe('HomeMarketingHero', () => {
  it('renders headline and search form targeting home with q', () => {
    render(<HomeMarketingHero />);

    expect(screen.getByRole('heading', { name: /AI-Powered Savings at Your Fingertips/i })).toBeInTheDocument();
    const form = screen.getByRole('search');
    expect(form).toHaveAttribute('action', '/search');
    expect(form).toHaveAttribute('method', 'get');
    expect(screen.getByRole('searchbox', { name: /Search deals/i })).toHaveAttribute('name', 'q');
    expect(screen.getByRole('button', { name: /^Search$/i })).toHaveAttribute('type', 'submit');
  });

  it('renders secondary links', () => {
    render(<HomeMarketingHero />);
    expect(screen.getByRole('link', { name: /Explore Today's Deals/i })).toHaveAttribute('href', '/#expiring-deals');
    expect(screen.getByRole('link', { name: /How it works/i })).toHaveAttribute('href', '/about');
  });

  it('renders dashboard hero image', () => {
    render(<HomeMarketingHero />);
    expect(screen.getByRole('img', { name: /Deals dashboard preview/i })).toBeInTheDocument();
  });
});
