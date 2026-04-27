/** @vitest-environment jsdom */
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ContactForm } from './ContactForm';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('ContactForm', () => {
  it('submits valid data and shows a success message', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ ok: true }),
    });
    vi.stubGlobal('fetch', fetchMock);

    render(<ContactForm />);

    fireEvent.change(screen.getByPlaceholderText('Your name'), { target: { value: 'Test User' } });
    fireEvent.change(screen.getByPlaceholderText('you@email.com'), {
      target: { value: 'test@example.com' },
    });
    fireEvent.change(screen.getByPlaceholderText('How can we help?'), {
      target: { value: 'Question' },
    });
    fireEvent.change(screen.getByPlaceholderText('Tell us more…'), {
      target: { value: 'Hello there.' },
    });

    fireEvent.click(screen.getByRole('button', { name: /send message/i }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/contact',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        })
      );
    });

    const body = JSON.parse((fetchMock.mock.calls[0][1] as { body: string }).body);
    expect(body).toMatchObject({
      name: 'Test User',
      email: 'test@example.com',
      subject: 'Question',
      message: 'Hello there.',
    });

    expect(await screen.findByText(/Thanks — your message was received/i)).toBeInTheDocument();
  });
});
