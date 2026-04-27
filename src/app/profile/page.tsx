import Link from 'next/link';
import { FloatingContact } from '@/components/layout/FloatingContact';
import { SiteFooter } from '@/components/layout/SiteFooter';
import { SiteHeader } from '@/components/layout/SiteHeader';
import { getActiveDeals } from '@/services/api/deals';

const moneyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 2,
});

function initials(text: string): string {
  const t = text.replace(/[^A-Za-z]/g, '');
  if (t.length <= 1) return t.toUpperCase() || '?';
  return `${t[0]}${t[t.length - 1]}`.toUpperCase();
}

export default async function ProfilePage() {
  const savedDealsResult = await getActiveDeals({ page: 1, pageSize: 4 });
  const savedDeals = savedDealsResult.ok ? savedDealsResult.deals : [];

  return (
    <div className="flex min-h-dvh flex-col bg-slate-50 text-slate-900">
      <SiteHeader />

      <main className="mx-auto w-full max-w-[1200px] flex-1 px-4 py-10 sm:px-6">
        <header className="mb-10">
          <div className="flex items-center gap-6">
             <div className="size-20 rounded-full bg-[#0B1340] flex items-center justify-center text-2xl font-black text-white shadow-xl">
               AR
             </div>
             <div>
               <h1 className="text-3xl font-black tracking-tight text-[#0B1340] sm:text-4xl">Hello, Alex Richardson</h1>
               <p className="mt-1 text-slate-500">Member since April 2024 • Pro Saver Account</p>
             </div>
          </div>
        </header>

        <div className="grid gap-8 lg:grid-cols-[240px_minmax(0,1fr)]">
          {/* Sidebar Nav */}
          <aside>
            <nav className="flex flex-col gap-1">
              {[
                { label: 'My Saved Deals', href: '#saved', active: true },
                { label: 'Deal Alerts', href: '#alerts' },
                { label: 'Recent Activity', href: '#activity' },
                { label: 'Account Settings', href: '#settings' },
              ].map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  className={`rounded-xl px-4 py-3 text-sm font-bold transition-all ${
                    item.active
                      ? 'bg-[#0B1340] text-white shadow-lg'
                      : 'text-slate-600 hover:bg-slate-200/50 hover:text-[#0B1340]'
                  }`}
                >
                  {item.label}
                </a>
              ))}
              <div className="mt-6 border-t border-slate-200 pt-6">
                <button className="w-full text-left rounded-xl px-4 py-3 text-sm font-bold text-red-600 hover:bg-red-50 transition-all">
                  Sign Out
                </button>
              </div>
            </nav>
          </aside>

          {/* Main Content Area */}
          <div className="space-y-10">
            <section id="saved">
              <div className="mb-6 flex items-center justify-between">
                <h2 className="text-2xl font-black text-[#0B1340]">Recently Saved</h2>
                <Link href="/deals" className="text-sm font-bold text-[#26BBA4] hover:underline">Browse More</Link>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                {savedDeals.map((deal) => (
                  <article
                    key={deal.id}
                    className="group relative flex flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition-all hover:shadow-md"
                  >
                    <div className="flex items-start justify-between gap-4">
                       <div className="size-12 shrink-0 rounded-xl bg-slate-50 flex items-center justify-center text-sm font-black text-[#0B1340]">
                         {initials(deal.title)}
                       </div>
                       <Link
                         href={`/deals/${deal.id}`}
                         className="flex-1 text-lg font-bold text-[#0B1340] line-clamp-1 group-hover:text-[#26BBA4] transition-colors"
                       >
                         {deal.title}
                       </Link>
                    </div>

                    <div className="mt-6 flex items-end justify-between">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-[#26BBA4]">
                          {Math.round(deal.discount_percentage)}% OFF
                        </p>
                        <p className="mt-1 text-2xl font-black text-[#0B1340]">
                          {moneyFormatter.format(deal.discount_price)}
                        </p>
                      </div>
                      <a
                        href={deal.affiliate_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-lg bg-[#26BBA4] px-4 py-2 text-xs font-bold text-white transition hover:bg-[#1faa95]"
                      >
                        Buy Now
                      </a>
                    </div>
                  </article>
                ))}
              </div>
            </section>

            <section id="settings" className="rounded-3xl border border-slate-100 bg-white p-8 shadow-sm">
              <h2 className="mb-6 text-2xl font-black text-[#0B1340]">Account Settings</h2>

              <div className="grid gap-8 sm:grid-cols-2">
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Personal Info</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="mb-2 block text-xs font-bold text-slate-500 uppercase tracking-wider" htmlFor="profile-name">
                        Full Name
                      </label>
                      <input
                        id="profile-name"
                        readOnly
                        value="Alex Richardson"
                        className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#26BBA4]/20"
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-xs font-bold text-slate-500 uppercase tracking-wider" htmlFor="profile-email">
                        Email Address
                      </label>
                      <input
                        id="profile-email"
                        readOnly
                        value="alex.r@example.com"
                        className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#26BBA4]/20"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Preferences</h3>
                  <div className="space-y-3">
                    <label className="flex items-center gap-3 rounded-xl border border-slate-100 p-4 transition-colors hover:bg-slate-50 cursor-pointer">
                       <input type="checkbox" defaultChecked className="size-5 rounded border-slate-300 text-[#26BBA4] focus:ring-[#26BBA4]" />
                       <span className="text-sm font-bold text-[#0B1340]">Email Notifications</span>
                    </label>
                    <label className="flex items-center gap-3 rounded-xl border border-slate-100 p-4 transition-colors hover:bg-slate-50 cursor-pointer">
                       <input type="checkbox" defaultChecked className="size-5 rounded border-slate-300 text-[#26BBA4] focus:ring-[#26BBA4]" />
                       <span className="text-sm font-bold text-[#0B1340]">Direct Deal Influx</span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="mt-10 flex justify-end gap-4 border-t border-slate-50 pt-8">
                <button className="px-6 py-3 text-sm font-bold text-slate-500 hover:text-slate-800 transition-colors">
                  Discard
                </button>
                <button className="rounded-2xl bg-[#0B1340] px-8 py-3 text-sm font-bold text-white shadow-lg transition-transform hover:scale-[1.03] active:scale-[0.97]">
                  Save Changes
                </button>
              </div>
            </section>
          </div>
        </div>
      </main>

      <SiteFooter />
      <FloatingContact />
    </div>
  );
}
