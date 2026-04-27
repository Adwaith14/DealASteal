/** @vitest-environment jsdom */
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { SearchResultsSidebar } from './SearchResultsSidebar';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

afterEach(() => {
  cleanup();
});

describe('SearchResultsSidebar', () => {
  it('renders filter sections', () => {
    render(
      <SearchResultsSidebar
        searchQuery="cable"
        activeCategorySlug={null}
        activeMaxPrice={null}
        activeMinDiscount={null}
        activeLootOnly={false}
      />
    );

    expect(screen.getByRole('heading', { name: /^Filters$/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /^Price range$/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /^Categories$/i })).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Search categories/i)).toBeInTheDocument();
  });
});
