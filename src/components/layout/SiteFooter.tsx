export function SiteFooter() {
  return (
    <footer className="border-t border-gray-800 bg-[#1a1f2e] text-gray-300">
      <div className="mx-auto max-w-[1400px] px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8">
          <div id="footer-brand" className="scroll-mt-24">
            <div className="flex items-center gap-2">
              <span className="flex size-9 items-center justify-center rounded-lg bg-red-600 text-white">
                <svg className="size-5" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path
                    d="M4 7V5a2 2 0 012-2h2m0 0h8m0 0h2a2 2 0 012 2v2M4 7h16M4 7l1 12a2 2 0 002 1.9h10a2 2 0 002-1.9L20 7M9 11v2m6-2v2"
                    stroke="currentColor"
                    strokeWidth={1.75}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
              <span className="text-lg font-bold text-white">
                DealA<span className="text-red-500">Steal</span>
              </span>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-gray-400">
              Verified coupons and discounts updated daily. Save more on every purchase from stores you
              already trust.
            </p>
          </div>

          <div id="footer-explore" className="scroll-mt-24">
            <h3 className="text-xs font-bold uppercase tracking-widest text-white">Explore</h3>
            <ul className="mt-4 space-y-2 text-sm">
              <li>
                <a href="/" className="hover:text-white">
                  Home
                </a>
              </li>
              <li>
                <a href="/about" className="hover:text-white">
                  About
                </a>
              </li>
              <li>
                <a href="/blog" className="hover:text-white">
                  Blog
                </a>
              </li>
              <li>
                <a href="/contact" className="hover:text-white">
                  Contact
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-bold uppercase tracking-widest text-white">Legal</h3>
            <ul className="mt-4 space-y-2 text-sm">
              <li>
                <a href="/#privacy" className="hover:text-white">
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="/#terms" className="hover:text-white">
                  Terms
                </a>
              </li>
              <li>
                <a href="/#affiliate" className="hover:text-white">
                  Affiliate Disclosure
                </a>
              </li>
            </ul>
          </div>

          <div id="affiliate" className="scroll-mt-24">
            <p className="text-sm leading-relaxed text-gray-400">
              As an Amazon Associate we earn from qualifying purchases. Prices and availability are
              subject to change.
            </p>
          </div>
        </div>

        <div
          id="footer-bottom"
          className="mt-12 flex flex-col gap-2 border-t border-gray-700/80 pt-8 text-xs text-gray-500 sm:flex-row sm:items-center sm:justify-between"
        >
          <p>© {new Date().getFullYear()} DealASteal. All rights reserved.</p>
          <p>Prices may vary from actual store listing.</p>
        </div>
      </div>
    </footer>
  );
}
