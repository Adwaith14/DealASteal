/** @vitest-environment jsdom */
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { HomeHeroSection } from './HomeHeroSection';

afterEach(() => {
  cleanup();
});

describe('HomeHeroSection', () => {
  it('renders optional children in browse strip (no marketing hero)', () => {
    render(
      <HomeHeroSection>
        <p>Filter strip</p>
      </HomeHeroSection>
    );

    expect(screen.queryByRole('heading', { name: /Grab the Deals/i })).not.toBeInTheDocument();
    expect(screen.getByText('Filter strip')).toBeInTheDocument();
  });

  it('renders nothing when there are no children', () => {
    const { container } = render(<HomeHeroSection />);
    expect(container.firstChild).toBeNull();
  });
});
