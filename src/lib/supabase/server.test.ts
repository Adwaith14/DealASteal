/** @vitest-environment node */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

beforeEach(() => {
  vi.resetModules();
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('getSupabaseServerAnon', () => {
  it('returns null when public Supabase env is missing', async () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', '');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', '');

    const { getSupabaseServerAnon } = await import('./server');
    expect(getSupabaseServerAnon()).toBeNull();
    expect(getSupabaseServerAnon()).toBeNull();
  });

  it('returns a client when URL and anon key are set', async () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://example.supabase.co');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'test-anon-key');

    const { getSupabaseServerAnon } = await import('./server');
    const client = getSupabaseServerAnon();
    expect(client).not.toBeNull();
    expect(client!.from).toBeDefined();
  });
});
