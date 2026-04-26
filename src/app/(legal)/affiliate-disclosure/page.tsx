import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Affiliate Disclosure',
  robots: { index: true, follow: true },
};

export default function AffiliateDisclosurePage() {
  return (
    <article className="space-y-6 text-[15px] leading-relaxed text-gray-800 [&_a]:font-semibold [&_a]:text-red-600 [&_a]:underline hover:[&_a]:text-red-700">
      <h1 className="text-3xl font-black text-gray-900">Affiliate disclosure</h1>
      <p className="text-sm text-gray-600">
        <strong>Placeholder — not legal advice.</strong> Align final copy with FTC Guides and each network&apos;s
        operating agreement.
      </p>
      <p>Last updated: April 26, 2026</p>

      <p>
        DealASteal participates in affiliate programs. When you click certain links (for example &quot;Grab the
        Deal&quot;) we may earn a commission at no extra cost to you, if you make a qualifying purchase on the
        retailer&apos;s site.
      </p>

      <h2 className="text-xl font-extrabold text-gray-900">Amazon Associates</h2>
      <p>
        As an Amazon Associate we earn from qualifying purchases. Amazon and the Amazon logo are trademarks of
        Amazon.com, Inc. or its affiliates.
      </p>

      <h2 className="text-xl font-extrabold text-gray-900">Other retailers</h2>
      <p>
        We may link to Walmart, eBay, Target, and other merchants via affiliate networks. Each retailer sets its
        own price and availability.
      </p>

      <h2 className="text-xl font-extrabold text-gray-900">Outbound links</h2>
      <p>
        For measurement and compliance, some outbound clicks route through our server before redirecting to the
        merchant. We do not store raw IP addresses in click logs.
      </p>
    </article>
  );
}
