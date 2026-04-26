import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Service',
  robots: { index: true, follow: true },
};

export default function TermsPage() {
  return (
    <article className="space-y-6 text-[15px] leading-relaxed text-gray-800 [&_a]:font-semibold [&_a]:text-red-600 [&_a]:underline hover:[&_a]:text-red-700">
      <h1 className="text-3xl font-black text-gray-900">Terms of Service</h1>
      <p className="text-sm text-gray-600">
        <strong>Placeholder — not legal advice.</strong> Have counsel review before USA launch.
      </p>
      <p>Last updated: April 26, 2026</p>

      <h2 className="text-xl font-extrabold text-gray-900">Agreement</h2>
      <p>
        By using DealASteal you agree to these terms and our <a href="/privacy">Privacy Policy</a>.
      </p>

      <h2 className="text-xl font-extrabold text-gray-900">Not a retailer</h2>
      <p>
        We aggregate publicly advertised deals and affiliate links. Purchases happen on third-party sites.
        We do not control pricing, inventory, shipping, returns, or taxes.
      </p>

      <h2 className="text-xl font-extrabold text-gray-900">Affiliate relationships</h2>
      <p>
        We may earn a commission when you use certain links. See{' '}
        <a href="/affiliate-disclosure">Affiliate disclosure</a>.
      </p>

      <h2 className="text-xl font-extrabold text-gray-900">Disclaimer</h2>
      <p>
        Information is provided &quot;as is&quot; without warranties. Deals can change or end without notice.
      </p>

      <h2 className="text-xl font-extrabold text-gray-900">Account</h2>
      <p>You are responsible for activity on your account. You may export or delete your data from the Account page.</p>

      <h2 className="text-xl font-extrabold text-gray-900">Contact</h2>
      <p>
        <a href="/contact">Contact us</a>.
      </p>
    </article>
  );
}
