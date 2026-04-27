/** @vitest-environment jsdom */
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { DealsCatalogSidebar } from './DealsCatalogSidebar';

const pushMock = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock }),
}));

afterEach(() => {
  cleanup();
  pushMock.mockReset();
});

describe('DealsCatalogSidebar', () => {
  it('pushes category URL when category is selected', () => {
    render(
      <DealsCatalogSidebar
        searchQuery=""
        activeCategorySlug={null}
        activeMaxPrice={null}
        activeLootOnly={false}
        activeSort={null}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /tech/i }));
    expect(pushMock).toHaveBeenCalledWith('/deals?category=tech');
  });

  it('clears filters while preserving query term', () => {
    render(
      <DealsCatalogSidebar
        searchQuery="camera"
        activeCategorySlug="tech"
        activeMaxPrice={100}
        activeLootOnly={true}
        activeSort="popular"
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /clear all filters/i }));
    expect(pushMock).toHaveBeenCalledWith('/deals?q=camera');
  });

  it('preserves sort when changing category', () => {
    render(
      <DealsCatalogSidebar
        searchQuery=""
        activeCategorySlug={null}
        activeMaxPrice={null}
        activeLootOnly={false}
        activeSort="popular"
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /tech/i }));
    expect(pushMock).toHaveBeenCalledWith('/deals?category=tech&sort=popular');
  });
});
