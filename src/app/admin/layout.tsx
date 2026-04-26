import { redirect } from 'next/navigation';
import { SiteFooter } from '@/components/layout/SiteFooter';
import { SiteHeader } from '@/components/layout/SiteHeader';
import { requireAdminSupabase } from '@/lib/admin/require-admin';

export const metadata = {
  title: 'Admin',
  robots: { index: false, follow: false } as const,
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  if (String(process.env.DEALS_ADMIN_SCHEMA ?? '').trim() !== '1') {
    return (
      <div className="flex min-h-dvh flex-col bg-[#f5f5f5] text-gray-900">
        <SiteHeader initialSearchQuery="" />
        <main id="main-content" className="flex flex-1 flex-col px-4 py-10 sm:px-6">
          <div className="mx-auto max-w-lg rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
            Admin UI needs migration <code className="font-mono">20260501100000_phase23_admin_console.sql</code> and{' '}
            <code className="font-mono">DEALS_ADMIN_SCHEMA=1</code> in the server environment.
          </div>
        </main>
        <SiteFooter />
      </div>
    );
  }

  const gate = await requireAdminSupabase();
  if (!gate.ok) {
    if (gate.status === 401) {
      redirect('/login?next=/admin');
    }
    return (
      <div className="flex min-h-dvh flex-col bg-[#f5f5f5] text-gray-900">
        <SiteHeader initialSearchQuery="" />
        <main id="main-content" className="flex flex-1 flex-col px-4 py-10 sm:px-6">
          <h1 className="text-xl font-semibold">Forbidden</h1>
          <p className="mt-2 text-sm text-gray-600">
            This area is for accounts with <code className="rounded bg-gray-200 px-1">profiles.role = admin</code>{' '}
            (set via Supabase service role / SQL).
          </p>
        </main>
        <SiteFooter />
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh flex-col bg-[#f5f5f5] text-gray-900">
      <SiteHeader initialSearchQuery="" />
      <main id="main-content" className="flex flex-1 flex-col px-4 py-8 sm:px-6">
        <div className="mx-auto w-full max-w-5xl">{children}</div>
      </main>
      <SiteFooter />
    </div>
  );
}
