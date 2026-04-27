/** @vitest-environment jsdom */
import type { ReactNode } from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { SiteHeader } from './SiteHeader';

vi.mock('next/navigation', () => ({
  usePathname: () => '/deals',
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock('next/link', () => ({
  default: ({
    children,
    href,
    ...rest
  }: {
    children: ReactNode;
    href: string;
    [key: string]: unknown;
  }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('SiteHeader', () => {
  it('renders AiDeals wordmark and category links', () => {
    render(<SiteHeader />);

    expect(screen.getByRole('link', { name: /^AiDeals$/i })).toHaveAttribute('href', '/');
    expect(screen.getByRole('link', { name: /hot deals/i })).toHaveAttribute('href', '/deals?loot=1');
    expect(screen.getByRole('link', { name: /account/i })).toHaveAttribute('href', '/profile');
    expect(screen.queryByRole('link', { name: /sign up/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /log in/i })).not.toBeInTheDocument();
  });

  it('uses white bar by default', () => {
    render(<SiteHeader />);
    const banner = screen.getByRole('banner');
    expect(banner).toHaveClass('bg-white');
    expect(banner).toHaveClass('border-gray-200');
  });
});
