'use client';

import { useMemo, useState, useTransition } from 'react';
import { getSupabaseBrowserClient } from '@/lib/supabase/browser-client';

type LoginFormProps = {
  redirectNext: string;
  initialError: string | null;
};

export function LoginForm({ redirectNext, initialError }: LoginFormProps) {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(initialError);
  const [pending, startTransition] = useTransition();
  const browserSupabase = useMemo(() => getSupabaseBrowserClient(), []);

  const submit = () => {
    setError(null);
    setMessage(null);
    const trimmed = email.trim().toLowerCase();
    if (!trimmed) {
      setError('Enter your email');
      return;
    }

    startTransition(async () => {
      const supabase = getSupabaseBrowserClient();
      if (!supabase) {
        setError(
          'Sign-in is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY (e.g. in .env.local).'
        );
        return;
      }
      const origin = typeof window !== 'undefined' ? window.location.origin : '';
      const nextParam = redirectNext.startsWith('/') ? redirectNext : '/';
      const { error: otpError } = await supabase.auth.signInWithOtp({
        email: trimmed,
        options: {
          emailRedirectTo: `${origin}/auth/callback?next=${encodeURIComponent(nextParam)}`,
        },
      });
      if (otpError) {
        setError(otpError.message);
        return;
      }
      setMessage('Check your email for the sign-in link.');
    });
  };

  return (
    <div className="mx-auto max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <h1 className="text-xl font-extrabold text-gray-900">Sign in</h1>
      <p className="mt-2 text-sm text-gray-600">
        We&apos;ll email you a one-time link. No password to remember.
      </p>
      {!browserSupabase ? (
        <p className="mt-3 text-sm font-medium text-amber-800" role="status">
          Sign-in is not configured (missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY).
        </p>
      ) : null}
      <label className="mt-6 block text-sm font-semibold text-gray-800" htmlFor="login-email">
        Email
      </label>
      <input
        id="login-email"
        type="email"
        autoComplete="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="mt-1.5 w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-200"
        placeholder="you@example.com"
      />
      {error ? (
        <p className="mt-3 text-sm font-medium text-red-600" role="alert">
          {error}
        </p>
      ) : null}
      {message ? (
        <p className="mt-3 text-sm font-medium text-emerald-700" role="status">
          {message}
        </p>
      ) : null}
      <button
        type="button"
        disabled={pending || !browserSupabase}
        onClick={() => submit()}
        className="mt-5 w-full rounded-lg bg-[#D32F2F] px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-red-800 disabled:opacity-60"
      >
        {pending ? 'Sending…' : 'Email me a link'}
      </button>
    </div>
  );
}
