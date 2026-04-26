/** @vitest-environment node */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

beforeEach(() => {
  vi.resetModules();
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('src/lib/supabase/client', () => {
  it('exports null when NEXT_PUBLIC_SUPABASE_URL is missing', async () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', '');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'test-anon-key');

    const { supabase } = await import('./client');
    expect(supabase).toBeNull();
  });

  it('exports null when NEXT_PUBLIC_SUPABASE_ANON_KEY is missing', async () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://example.supabase.co');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', '');

    const { supabase } = await import('./client');
    expect(supabase).toBeNull();
  });

  it('exports null when NEXT_PUBLIC_SUPABASE_URL is only whitespace', async () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', '   ');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'test-anon-key');

    const { supabase } = await import('./client');
    expect(supabase).toBeNull();
  });

  it('exports null when NEXT_PUBLIC_SUPABASE_ANON_KEY is only whitespace', async () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://example.supabase.co');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', '\t\n');

    const { supabase } = await import('./client');
    expect(supabase).toBeNull();
  });

  it('exports null when NEXT_PUBLIC_SUPABASE_URL is not a valid http(s) URL', async () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'not-a-url');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'test-anon-key');

    const { supabase } = await import('./client');
    expect(supabase).toBeNull();
  });

  it('exports a Supabase client when both env vars are set', async () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://example.supabase.co');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'test-anon-key');

    const { supabase } = await import('./client');
    expect(supabase).toBeDefined();
    expect(supabase!.auth).toBeDefined();
  });
});
