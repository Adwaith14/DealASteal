import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { PageWithAdRails } from './PageWithAdRails';

afterEach(() => {
  cleanup();
});

describe('PageWithAdRails', () => {
  it('renders center content and reserves left/right ad slots', () => {
    render(
      <PageWithAdRails>
        <main>
          <p>Feed</p>
        </main>
      </PageWithAdRails>
    );

    expect(screen.getByText('Feed')).toBeInTheDocument();
    expect(screen.getByTestId('ad-slot-left')).toBeInTheDocument();
    expect(screen.getByTestId('ad-slot-right')).toBeInTheDocument();
  });
});
