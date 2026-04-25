/** @vitest-environment node */
import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest';

const baselineEnv = { ...process.env };

beforeEach(() => {
  vi.resetModules();
  process.env = { ...baselineEnv };
});

afterAll(() => {
  process.env = baselineEnv;
});

describe('getSupabaseServerAnon', () => {
  it('returns null when public Supabase env is missing', async () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    const { getSupabaseServerAnon } = await import('./server');
    expect(getSupabaseServerAnon()).toBeNull();
    expect(getSupabaseServerAnon()).toBeNull();
  });

  it('returns a client when URL and anon key are set', async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';

    const { getSupabaseServerAnon } = await import('./server');
    const client = getSupabaseServerAnon();
    expect(client).not.toBeNull();
    expect(client!.from).toBeDefined();
  });
});
