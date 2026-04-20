import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import Link from 'next/link';
import { MarketingShell } from '@/components/layout/MarketingShell';
import { ContactForm } from '@/components/marketing/ContactForm';
import { PageHero } from '@/components/marketing/PageHero';

export const metadata: Metadata = {
  title: 'Contact',
  description: 'Reach DealASteal for support, partnerships, or general questions.',
};

function InfoCard({
  title,
  children,
  icon,
}: {
  title: string;
  children: ReactNode;
  icon: ReactNode;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 text-center shadow-sm sm:p-7">
      <div className="mx-auto flex size-11 items-center justify-center text-red-600">{icon}</div>
      <h2 className="mt-4 text-sm font-extrabold text-gray-900">{title}</h2>
      <div className="mt-3 text-sm">{children}</div>
    </div>
  );
}

export default function ContactPage() {
  return (
    <MarketingShell>
      <PageHero
        title="Contact us"
        subtitle="Have a question, suggestion, or partnership inquiry? We would love to hear from you."
      />

      <div className="mx-auto w-full max-w-5xl flex-1 px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-5 sm:grid-cols-3">
          <InfoCard
            title="Email us"
            icon={
              <svg className="size-7" viewBox="0 0 24 24" fill="none" aria-hidden>
                <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="1.5" />
                <path d="M3 7l9 6 9-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            }
          >
            <a
              href="mailto:support@dealasteal.com"
              className="font-semibold text-red-600 hover:text-red-700"
            >
              support@dealasteal.com
            </a>
          </InfoCard>
          <InfoCard
            title="Partnerships"
            icon={
              <svg className="size-7" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
            }
          >
            <a
              href="mailto:partners@dealasteal.com"
              className="font-semibold text-red-600 hover:text-red-700"
            >
              partners@dealasteal.com
            </a>
          </InfoCard>
          <InfoCard
            title="FAQ"
            icon={
              <svg className="size-7" viewBox="0 0 24 24" fill="none" aria-hidden>
                <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" />
                <path
                  d="M12 16v-1M12 8c-2 0-2 2.5 0 2.5S14 13 12 13"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
            }
          >
            <Link href="/about#faq" className="font-semibold text-red-600 hover:text-red-700">
              Visit our About page
            </Link>
          </InfoCard>
        </div>

        <div className="mx-auto mt-10 max-w-3xl">
          <ContactForm />
        </div>
      </div>
    </MarketingShell>
  );
}
