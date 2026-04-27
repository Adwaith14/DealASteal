/** @vitest-environment node */
import { describe, expect, it, vi } from 'vitest';

vi.mock('next/headers', () => ({
  headers: vi.fn(),
}));

import { headers } from 'next/headers';
import { getSiteOrigin } from './site-origin';

function mockHeaders(entries: Record<string, string>) {
  return {
    get(name: string) {
      const key = name.toLowerCase();
      const hit = Object.entries(entries).find(([k]) => k.toLowerCase() === key);
      return hit ? hit[1] : null;
    },
  };
}

describe('getSiteOrigin', () => {
  it('defaults to http for localhost', async () => {
    vi.mocked(headers).mockResolvedValue(mockHeaders({ host: 'localhost:3010' }) as never);
    expect(await getSiteOrigin()).toBe('http://localhost:3010');
  });

  it('defaults to http for 127.0.0.1 loopback', async () => {
    vi.mocked(headers).mockResolvedValue(mockHeaders({ host: '127.0.0.1:3010' }) as never);
    expect(await getSiteOrigin()).toBe('http://127.0.0.1:3010');
  });

  it('respects x-forwarded-proto when present', async () => {
    vi.mocked(headers).mockResolvedValue(
      mockHeaders({
        host: '127.0.0.1:3010',
        'x-forwarded-proto': 'https',
      }) as never
    );
    expect(await getSiteOrigin()).toBe('https://127.0.0.1:3010');
  });
});
