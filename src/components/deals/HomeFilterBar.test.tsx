/** @vitest-environment jsdom */
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { HomeFilterBar } from './HomeFilterBar';

const push = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push }),
  usePathname: () => '/',
}));

const defaultFacets = {
  activeStore: null as const,
  activeMinDiscount: null as const,
  activeMaxPrice: null as const,
};

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('HomeFilterBar', () => {
  it('navigates when category changes', () => {
    render(<HomeFilterBar searchQuery="" activeCategorySlug={null} {...defaultFacets} />);

    const select = screen.getByLabelText('Category');
    fireEvent.change(select, { target: { value: 'tech' } });

    expect(push).toHaveBeenCalledWith('/?category=tech');
  });

  it('preserves search query when changing category', () => {
    render(<HomeFilterBar searchQuery="usb" activeCategorySlug={null} {...defaultFacets} />);

    const select = screen.getByLabelText('Category');
    fireEvent.change(select, { target: { value: 'laptops' } });

    expect(push).toHaveBeenCalledWith('/?q=usb&category=laptops');
  });

  it('navigates when store changes and preserves other facets', () => {
    render(
      <HomeFilterBar
        searchQuery="cable"
        activeCategorySlug="tech"
        activeStore={null}
        activeMinDiscount={25}
        activeMaxPrice={100}
      />
    );

    fireEvent.change(screen.getByLabelText('Stores'), { target: { value: 'amazon' } });

    expect(push).toHaveBeenCalledWith(
      '/?q=cable&category=tech&store=amazon&min_disc=25&max_price=100'
    );
  });
});
