import Link from 'next/link';
import { SiteFooter } from '@/components/layout/SiteFooter';
import { SiteHeader } from '@/components/layout/SiteHeader';
import { safeRelativePath } from '@/lib/auth/safe-redirect';
import { LoginForm } from './LoginForm';

type LoginPageProps = {
  searchParams: Promise<{ next?: string; error?: string }>;
};

export const metadata = {
  title: 'Sign in',
  description: 'Sign in to save deals and personalize your DealASteal feed.',
  robots: { index: false, follow: false },
};

function mapLoginError(code: string | undefined): string | null {
  if (code === 'missing_code') {
    return 'Sign-in link was incomplete. Request a new email.';
  }
  if (code === 'exchange') {
    return 'Could not complete sign-in. Try again or request a new link.';
  }
  return null;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const sp = await searchParams;
  const redirectNext = safeRelativePath(typeof sp.next === 'string' ? sp.next : null);
  const initialError = mapLoginError(typeof sp.error === 'string' ? sp.error : undefined);

  return (
    <div className="flex min-h-dvh flex-col bg-[#f5f5f5] text-gray-900">
      <SiteHeader />
      <main id="main-content" className="flex flex-1 flex-col px-4 py-10 sm:px-6">
        <LoginForm redirectNext={redirectNext} initialError={initialError} />
        <p className="mx-auto mt-8 max-w-md text-center text-sm text-gray-600">
          <Link href="/" className="font-semibold text-[#D32F2F] underline hover:text-red-800">
            ← Back to deals
          </Link>
        </p>
      </main>
      <SiteFooter />
    </div>
  );
}
