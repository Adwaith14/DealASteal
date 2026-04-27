/** @vitest-environment jsdom */
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { DealSearchBarForm } from './DealSearchBarForm';

afterEach(() => {
  cleanup();
});

describe('DealSearchBarForm', () => {
  it('submits to /search with q by default', () => {
    render(<DealSearchBarForm inputId="t-q" defaultQuery="cable" />);
    const form = screen.getByRole('search');
    expect(form).toHaveAttribute('action', '/search');
    expect(form).toHaveAttribute('method', 'get');
    expect(screen.getByRole('searchbox', { name: /Search deals/i })).toHaveValue('cable');
    expect(screen.getByRole('button', { name: /^Search$/i })).toHaveAttribute('type', 'submit');
  });

  it('renders hidden facet fields when preserve is set', () => {
    render(
      <DealSearchBarForm
        inputId="t-q2"
        preserve={{
          category: 'tech',
          store: 'amazon',
          maxPrice: 100,
          minDiscount: 25,
          lootDeals: true,
        }}
      />
    );
    expect(document.querySelector('input[name="category"]')).toHaveValue('tech');
    expect(document.querySelector('input[name="store"]')).toHaveValue('amazon');
    expect(document.querySelector('input[name="max_price"]')).toHaveValue('100');
    expect(document.querySelector('input[name="min_disc"]')).toHaveValue('25');
    expect(document.querySelector('input[name="loot"]')).toHaveValue('1');
  });
});
