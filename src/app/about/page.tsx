import type { Metadata } from 'next';
import Link from 'next/link';
import { MarketingShell } from '@/components/layout/MarketingShell';
import { PageHero } from '@/components/marketing/PageHero';

export const metadata: Metadata = {
  title: 'About',
  description:
    'Learn how DealASteal finds, verifies, and curates deals and coupons so you can save time and shop with confidence.',
};

const howSteps = [
  {
    title: 'Deal aggregation',
    body:
      'We collect offers from affiliate networks and merchant programs we trust. Coverage varies by retailer, category, and season.',
  },
  {
    title: 'Deal validation',
    body:
      'Each listing is checked for basic consistency: working links, coherent pricing, and clear titles. We remove or deactivate listings that fail quality checks.',
  },
  {
    title: 'Categorization',
    body:
      'Deals are grouped into browse-friendly categories so you can skim what matters to you—tech, home, fashion, and more as the catalog grows.',
  },
  {
    title: 'Easy redemption',
    body:
      'When you grab a deal, you leave for the retailer’s site to complete purchase. Coupons and final prices are always controlled by the merchant at checkout.',
  },
] as const;

const faqItems = [
  {
    q: 'Is DealASteal free to use?',
    a: 'Yes. Browsing the site is free. We may earn a commission when you purchase through certain links, at no extra cost to you.',
  },
  {
    q: 'How often are deals updated?',
    a: 'We refresh the feed regularly as new offers arrive and older ones expire. Timestamps on cards show when a deal was listed.',
  },
  {
    q: 'What makes DealASteal different from other deal sites?',
    a: 'We focus on a clean reading experience, clear pricing, and honest metadata. We would rather show fewer listings than noisy or misleading ones.',
  },
  {
    q: 'Which stores does DealASteal cover?',
    a: 'Coverage depends on merchant partnerships and feed availability. If you want a specific store, use search and filters on the home page.',
  },
] as const;

export default function AboutPage() {
  return (
    <MarketingShell>
      <PageHero
        title="About DealASteal"
        subtitle="We find, verify, and curate deals and coupons from online stores so you can save time and shop with confidence."
      />

      <div className="mx-auto w-full max-w-3xl flex-1 px-4 py-12 sm:px-6 lg:px-8">
        <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
          <h2 className="text-xl font-extrabold text-gray-900">About the company</h2>
          <div className="mt-4 space-y-4 text-sm leading-relaxed text-gray-600 sm:text-base">
            <p>
              DealASteal is an independent deal-discovery product. We combine automated ingestion with manual
              review to keep the feed useful and easy to scan.
            </p>
            <p>
              We are not affiliated with any single retailer; individual offers are provided by merchants and
              networks. Always verify price and terms on the store’s site before you buy.
            </p>
          </div>
        </section>

        <section className="mt-12">
          <h2 className="text-xl font-extrabold text-gray-900">Our mission</h2>
          <div className="mt-4 space-y-4 text-sm leading-relaxed text-gray-600 sm:text-base">
            <p>
              Online shopping should feel straightforward: see a fair summary, understand what you are getting,
              and reach checkout without surprises.
            </p>
            <p>
              Whether you shop major marketplaces or specialty stores, we aim to surface offers that are easy
              to compare and act on—without burying you in clutter.
            </p>
          </div>
        </section>

        <section className="mt-12 grid gap-5 sm:grid-cols-3">
          {[
            {
              title: 'Verified deals',
              desc: 'We score listings for consistency and clarity before they appear in the main feed.',
              icon: (
                <svg className="size-7" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path
                    d="M12 2l2.4 4.9 5.4.8-3.9 3.8.9 5.4L12 15.8 6.2 16.9l.9-5.4L3.2 7.7l5.4-.8L12 2z"
                    stroke="currentColor"
                    strokeWidth="1.25"
                    strokeLinejoin="round"
                  />
                  <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
                </svg>
              ),
            },
            {
              title: 'Updated daily',
              desc: 'New drops and price changes flow in continuously so you are not staring at stale links.',
              icon: (
                <svg className="size-7" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path
                    d="M13 2L3 14h8l-1 8 10-12h-8l1-8z"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinejoin="round"
                  />
                </svg>
              ),
            },
            {
              title: 'Trusted sources',
              desc: 'We work through established affiliate programs and merchant feeds—not random redirects.',
              icon: (
                <svg className="size-7" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path
                    d="M12 3l7 4v5c0 5-3.5 9-7 10-3.5-1-7-5-7-10V7l7-4z"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinejoin="round"
                  />
                  <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              ),
            },
          ].map((item) => (
            <div
              key={item.title}
              className="rounded-xl border border-gray-200 bg-white p-6 text-center shadow-sm"
            >
              <div className="mx-auto flex size-12 items-center justify-center text-red-600">{item.icon}</div>
              <h3 className="mt-4 text-base font-extrabold text-gray-900">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-gray-600">{item.desc}</p>
            </div>
          ))}
        </section>

        <section className="mt-16">
          <h2 className="text-xl font-extrabold text-gray-900">How DealASteal works</h2>
          <ol className="mt-8 space-y-8">
            {howSteps.map((step, i) => (
              <li key={step.title} className="flex gap-4">
                <span
                  className="flex size-9 shrink-0 items-center justify-center rounded-full bg-red-100 text-sm font-extrabold text-red-700"
                  aria-hidden
                >
                  {i + 1}
                </span>
                <div>
                  <h3 className="text-base font-extrabold text-gray-900">{step.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-gray-600 sm:text-base">{step.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section id="faq" className="mt-16 scroll-mt-24">
          <h2 className="text-xl font-extrabold text-gray-900">Frequently asked questions</h2>
          <div className="mt-6 space-y-3">
            {faqItems.map((item) => (
              <details
                key={item.q}
                className="group rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-sm open:shadow-md"
              >
                <summary className="cursor-pointer list-none text-sm font-bold text-gray-900 sm:text-base [&::-webkit-details-marker]:hidden">
                  <span className="mr-2 inline-block text-gray-500 transition group-open:rotate-90" aria-hidden>
                    ▸
                  </span>
                  {item.q}
                </summary>
                <p className="mt-3 border-t border-gray-100 pt-3 text-sm leading-relaxed text-gray-600">
                  {item.a}
                </p>
              </details>
            ))}
          </div>
        </section>

        <p className="mt-12 text-center text-sm text-gray-500">
          More questions?{' '}
          <Link href="/contact" className="font-semibold text-red-600 hover:text-red-700">
            Contact us
          </Link>
          .
        </p>
      </div>
    </MarketingShell>
  );
}
