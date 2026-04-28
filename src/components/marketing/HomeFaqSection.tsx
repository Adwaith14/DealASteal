const FAQ_ITEMS: { question: string; answer: string }[] = [
  {
    question: 'How does DealASteal pick which deals to show?',
    answer:
      'We aggregate active offers from partner merchants and run checks for obvious price drops, discount strength, and freshness. Flash and curated rows prioritize time-sensitive and high-signal deals so you see actionable picks first.',
  },
  {
    question: 'Is DealASteal free to use?',
    answer:
      'Yes. Browsing deals, categories, and partner store pages is free. When you click through to a retailer, standard merchant and affiliate terms may apply on their site.',
  },
  {
    question: 'Do you cover my favorite stores?',
    answer:
      'We list partner stores that appear in our current deal feed. Open Partner Stores to browse who is active right now; the directory grows as new merchants show up in verified listings.',
  },
  {
    question: 'How often are prices and discounts updated?',
    answer:
      'Listings refresh as our data sources update. Hot and ending-soon sections skew toward recency so you are less likely to see stale markdown that already expired.',
  },
  {
    question: 'What if a deal link does not work or the price changed?',
    answer:
      'Retailers change pages and promos without notice. Use Contact Support from the footer to flag a broken or mismatched offer and we will triage it with our feed partners.',
  },
  {
    question: 'Why do I sometimes leave DealASteal when I click a deal?',
    answer:
      'Purchases complete on the merchant’s own checkout. We send you to the official store or approved partner link so you can verify the final price, shipping, and return policy before you buy.',
  },
];

function ChevronIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path
        d="M5 7.5L10 12.5L15 7.5"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function HomeFaqSection() {
  return (
    <section
      id="faq"
      aria-labelledby="home-faq-heading"
      className="mx-auto mt-8 max-w-3xl bg-white px-4 py-10 sm:px-6 sm:py-12"
    >
      <h2
        id="home-faq-heading"
        className="text-center text-2xl font-bold tracking-tight text-gray-900 sm:text-[1.65rem]"
      >
        Frequently Asked Questions
      </h2>

      <div className="mt-8 border-t border-gray-200">
        {FAQ_ITEMS.map(({ question, answer }) => (
          <details key={question} className="group border-b border-gray-200">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4 pr-1 text-left text-base font-medium text-gray-900 outline-none marker:hidden [&::-webkit-details-marker]:hidden focus-visible:ring-2 focus-visible:ring-[#26BBA4]/40 focus-visible:ring-offset-2">
              <span className="min-w-0 flex-1">{question}</span>
              <ChevronIcon className="size-5 shrink-0 text-gray-400 transition-transform duration-200 group-open:-rotate-180" />
            </summary>
            <div className="border-t border-transparent pb-5 pt-0 text-sm leading-relaxed text-gray-600">
              {answer}
            </div>
          </details>
        ))}
      </div>
    </section>
  );
}
