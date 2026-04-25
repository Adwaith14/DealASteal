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

describe('src/lib/supabase/client', () => {
  it('exports null when NEXT_PUBLIC_SUPABASE_URL is missing', async () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';

    const { supabase } = await import('./client');
    expect(supabase).toBeNull();
  });

  it('exports null when NEXT_PUBLIC_SUPABASE_ANON_KEY is missing', async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co';
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    const { supabase } = await import('./client');
    expect(supabase).toBeNull();
  });

  it('exports null when NEXT_PUBLIC_SUPABASE_URL is only whitespace', async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = '   ';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';

    const { supabase } = await import('./client');
    expect(supabase).toBeNull();
  });

  it('exports null when NEXT_PUBLIC_SUPABASE_ANON_KEY is only whitespace', async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = '\t\n';

    const { supabase } = await import('./client');
    expect(supabase).toBeNull();
  });

  it('exports null when NEXT_PUBLIC_SUPABASE_URL is not a valid http(s) URL', async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'not-a-url';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';

    const { supabase } = await import('./client');
    expect(supabase).toBeNull();
  });

  it('exports a Supabase client when both env vars are set', async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';

    const { supabase } = await import('./client');
    expect(supabase).toBeDefined();
    expect(supabase!.auth).toBeDefined();
  });
});
