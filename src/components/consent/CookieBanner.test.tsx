import { cleanup, render, screen, fireEvent, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CookieBanner } from './CookieBanner';

describe('CookieBanner', () => {
  beforeEach(() => {
    vi.stubEnv('NODE_ENV', 'test');
    cleanup();
    Object.defineProperty(document, 'cookie', {
      writable: true,
      value: '',
    });
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllEnvs();
    document.cookie = '';
  });

  it('shows GDPR dialog for EEA country when no consent cookie', async () => {
    render(<CookieBanner serverCountry="DE" />);
    expect(await screen.findByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText(/Cookies & privacy/i)).toBeInTheDocument();
  });

  it('writes consent cookie when Essential only is chosen', async () => {
    render(<CookieBanner serverCountry="FR" />);
    const btn = await screen.findByRole('button', { name: /essential only/i });
    fireEvent.click(btn);
    await waitFor(() => {
      expect(document.cookie).toContain('dealasteal_consent_v1=');
    });
  });
});
