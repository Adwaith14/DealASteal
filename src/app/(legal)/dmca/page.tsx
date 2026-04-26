import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'DMCA',
  robots: { index: true, follow: true },
};

export default function DmcaPage() {
  return (
    <article className="space-y-6 text-[15px] leading-relaxed text-gray-800 [&_a]:font-semibold [&_a]:text-red-600 [&_a]:underline hover:[&_a]:text-red-700">
      <h1 className="text-3xl font-black text-gray-900">DMCA / copyright</h1>
      <p className="text-sm text-gray-600">
        <strong>Placeholder — not legal advice.</strong> Replace with your designated agent and process.
      </p>
      <p>Last updated: April 26, 2026</p>

      <p>
        If you believe material on DealASteal infringes your copyright, send a written notice including: (1)
        identification of the work, (2) identification of the allegedly infringing URL, (3) your contact
        information, (4) a good-faith statement, (5) a statement under penalty of perjury that you are authorized
        to act, (6) your physical or electronic signature.
      </p>
      <p>
        Contact via the <a href="/contact">contact form</a> (subject: DMCA) until a dedicated legal inbox is
        published here.
      </p>
    </article>
  );
}
