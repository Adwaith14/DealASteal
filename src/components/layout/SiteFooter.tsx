import Link from 'next/link';

export function SiteFooter({ fullWidth }: { fullWidth?: boolean }) {
  return (
    <footer className="border-t border-[#0a0f2e] bg-[#0B1340] text-gray-300">
      <div
        className={`mx-auto px-4 py-14 sm:px-6 lg:px-8 ${
          fullWidth ? 'max-w-full' : 'max-w-[1400px]'
        }`}
      >
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8">
          <div id="footer-brand" className="scroll-mt-24">
            <span className="text-xl font-extrabold text-white">
              AI <span className="text-[#26BBA4]">Deals</span>
            </span>
            <p className="mt-4 text-sm leading-relaxed text-gray-400">
              Verified coupons and discounts updated daily. Save more on every purchase from stores you
              already trust.
            </p>
          </div>

          <div id="footer-information" className="scroll-mt-24">
            <h3 className="text-xs font-bold uppercase tracking-widest text-white">Information</h3>
            <ul className="mt-4 space-y-2 text-sm">
              <li>
                <Link href="/about" className="hover:text-white">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-white">
                  Contact Support
                </Link>
              </li>
              <li>
                <Link href="/blog" className="hover:text-white">
                  Blog
                </Link>
              </li>
              <li>
                <a href="/feed.xml" className="hover:text-white">
                  RSS feed
                </a>
              </li>
              <li>
                <Link href="/contact" className="hover:text-white">
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-bold uppercase tracking-widest text-white">Legal</h3>
            <ul className="mt-4 space-y-2 text-sm">
              <li>
                <Link href="/privacy" className="hover:text-white">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-white">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/affiliate-disclosure" className="hover:text-white">
                  Affiliate Disclosure
                </Link>
              </li>
              <li>
                <a href="/dmca" className="hover:text-white">
                  DMCA
                </a>
              </li>
            </ul>
          </div>

          <div id="footer-newsletter" className="scroll-mt-24">
            <p className="text-sm leading-relaxed text-gray-300">
              Get the top 10 vetted deals in your inbox daily.
            </p>
            <p className="mt-2 text-xs leading-relaxed text-gray-400">
              DealASteal earns commissions from qualifying purchases through affiliate links (FTC disclosure).
              As an Amazon Associate we earn from qualifying purchases. Prices and availability are subject to
              change.
            </p>
            <div className="mt-3 flex flex-col gap-2 sm:flex-row">
              <label className="sr-only" htmlFor="footer-newsletter-email">
                Email
              </label>
              <input
                id="footer-newsletter-email"
                type="email"
                readOnly
                placeholder="you@example.com"
                className="min-h-11 w-full rounded-2xl border border-white/20 bg-white/10 px-4 text-sm text-white outline-none placeholder:text-gray-500 focus:border-[#26BBA4]/60"
              />
              <Link
                href="/contact"
                className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-2xl bg-[#26BBA4] px-6 text-sm font-bold text-white transition hover:bg-[#1fa08d]"
              >
                Join
              </Link>
            </div>
          </div>
        </div>

        <div
          id="footer-bottom"
          className="mt-12 flex flex-col gap-2 border-t border-white/10 pt-8 text-center text-xs text-gray-500 sm:text-left"
        >
          <p>© {new Date().getFullYear()} DealASteal. All rights reserved.</p>
          <p className="max-w-xl text-right sm:text-left">
            Prices may vary from actual store listing.{' '}
            <Link href="/affiliate-disclosure" className="text-gray-400 underline hover:text-white">
              Affiliate disclosure
            </Link>
            .
          </p>
        </div>
      </div>
    </footer>
  );
}
