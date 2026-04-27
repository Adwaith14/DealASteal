/** @vitest-environment jsdom */
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { DealShareRow } from './DealShareRow';

afterEach(() => {
  cleanup();
});

describe('DealShareRow', () => {
  it('renders Facebook share with encoded deal URL', () => {
    const url = 'https://deala.test/deals/abc';
    render(<DealShareRow dealPageUrl={url} title="Nice gadget" />);

    const fb = screen.getByLabelText('Share on Facebook');
    expect(fb.getAttribute('href')).toContain(encodeURIComponent(url));
    expect(fb.getAttribute('href')).toContain('facebook.com/sharer');
  });

  it('renders Pinterest when includePinterest is set', () => {
    render(
      <DealShareRow dealPageUrl="https://deala.test/d/1" title="T" includePinterest />
    );
    const pin = screen.getByLabelText('Share on Pinterest');
    expect(pin.getAttribute('href')).toContain('pinterest.com/pin/create');
  });
});
