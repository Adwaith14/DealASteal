import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  robots: { index: true, follow: true },
};

export default function PrivacyPage() {
  return (
    <article className="space-y-6 text-[15px] leading-relaxed text-gray-800 [&_a]:font-semibold [&_a]:text-red-600 [&_a]:underline hover:[&_a]:text-red-700">
      <h1 className="text-3xl font-black text-gray-900">Privacy Policy</h1>
      <p className="text-sm text-gray-600">
        <strong>Placeholder — not legal advice.</strong> Have counsel review before USA launch.
      </p>
      <p>Last updated: April 26, 2026</p>

      <h2 id="ccpa" className="text-xl font-extrabold text-gray-900">
        California &amp; US privacy rights (CCPA / CPRA)
      </h2>
      <p id="ccpa-do-not-sell">
        If you are a California resident, you may have the right to opt out of the &quot;sale&quot; or
        &quot;sharing&quot; of personal information as defined under California law. DealASteal does not
        sell personal information for money. We may use cookies or analytics in the future as described
        in this policy; you can control non-essential cookies via the banner when shown.
      </p>
      <p>
        To exercise access or deletion rights, use <strong>Account → Export my data</strong> or{' '}
        <strong>Delete account</strong> while signed in, or contact us via the{' '}
        <a href="/contact">contact form</a>.
      </p>

      <h2 className="text-xl font-extrabold text-gray-900">What we collect</h2>
      <ul className="list-disc space-y-1 pl-5">
        <li>Account: email (via Supabase Auth) when you sign in.</li>
        <li>Saved deals: which deals you saved and when.</li>
        <li>Contact form: the fields you submit (processed to send email).</li>
        <li>Technical: basic logs, approximate geo from CDN headers for consent UX, hashed IP for click analytics.</li>
      </ul>

      <h2 className="text-xl font-extrabold text-gray-900">Cookies</h2>
      <p>
        Essential cookies keep you signed in. Optional cookies require consent where required (e.g. EEA).
        See our <a href="/affiliate-disclosure">Affiliate disclosure</a> for how links work.
      </p>

      <h2 className="text-xl font-extrabold text-gray-900">Retention &amp; deletion</h2>
      <p>
        You can delete your account from the Account page. That removes your profile and saved deals and
        anonymises click records linked to your user id.
      </p>

      <h2 className="text-xl font-extrabold text-gray-900">Processors</h2>
      <p>
        We use Supabase (database &amp; auth), hosting (e.g. Vercel), and email (e.g. Resend) as subprocessors.
        Their terms apply to data they process on our behalf.
      </p>

      <h2 className="text-xl font-extrabold text-gray-900">Contact</h2>
      <p>
        Questions: <a href="/contact">Contact us</a>.
      </p>
    </article>
  );
}
