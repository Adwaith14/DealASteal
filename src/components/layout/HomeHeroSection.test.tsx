/** @vitest-environment jsdom */
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { HomeHeroSection } from './HomeHeroSection';

afterEach(() => {
  cleanup();
});

describe('HomeHeroSection', () => {
  it('renders hero heading and optional children', () => {
    render(
      <HomeHeroSection>
        <p>Filter strip</p>
      </HomeHeroSection>
    );

    expect(
      screen.getByRole('heading', {
        name: /Grab the Deals — Today's Best Coupons & Discounts/i,
      })
    ).toBeInTheDocument();
    expect(screen.getByText('Filter strip')).toBeInTheDocument();
  });
});
