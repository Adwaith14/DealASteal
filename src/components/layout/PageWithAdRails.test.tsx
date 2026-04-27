import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { PageWithAdRails } from './PageWithAdRails';

afterEach(() => {
  cleanup();
});

describe('PageWithAdRails', () => {
  it('renders content without side ad slots', () => {
    render(
      <PageWithAdRails>
        <main>
          <p>Feed</p>
        </main>
      </PageWithAdRails>
    );

    expect(screen.getByText('Feed')).toBeInTheDocument();
    expect(screen.queryByTestId('ad-slot-left')).not.toBeInTheDocument();
    expect(screen.queryByTestId('ad-slot-right')).not.toBeInTheDocument();
  });
});
