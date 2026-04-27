export type BlogCategoryKey = 'general' | 'comparisons' | 'tips';

export type BlogPost = {
  slug: string;
  title: string;
  excerpt: string;
  categoryLabel: string;
  categoryKey: BlogCategoryKey;
  /** Shown after the category pipe, e.g. &quot;6 min read&quot; or &quot;2 products&quot;. */
  metaRight: string;
  publishedAt: string;
  readingMinutes: number;
  /** Plain paragraphs for the article view (no HTML). */
  body: string[];
};

export const blogPosts: BlogPost[] = [
  {
    slug: 'spot-real-discounts',
    title: 'How to Know If a Deal Is Actually Good (2026 Guide)',
    excerpt:
      'Retailers use anchor pricing, countdown timers, and “was” prices that never existed. Here is a practical checklist to judge a discount before you click buy.',
    categoryLabel: 'Shopping tips',
    categoryKey: 'tips',
    metaRight: '6 min read',
    publishedAt: '2026-03-24',
    readingMinutes: 6,
    body: [
      'Start with the product’s typical street price, not the “list” price shown on the product page. Search recent sold listings and reputable retailers for the same SKU.',
      'If the discount depends on a coupon stack, confirm each step still works at checkout and that returns are reasonable if the stack fails.',
      'When something feels too good to be true, verify the seller, warranty terms, and whether the item is refurbished or international stock.',
    ],
  },
  {
    slug: 'robot-vacuum-vs-cordless',
    title: 'Robot Vacuum vs Cordless Vacuum — Which Is Worth It in 2026?',
    excerpt:
      'Robot vacuums win on daily maintenance; cordless sticks win on spot cleans and stairs. Match the tool to your floor plan, pets, and how often you want to babysit a machine.',
    categoryLabel: 'Product comparisons',
    categoryKey: 'comparisons',
    metaRight: '6 min read',
    publishedAt: '2026-03-24',
    readingMinutes: 6,
    body: [
      'Robot vacuums reduce friction: they run on a schedule and keep dust from building up in high-traffic lanes.',
      'Cordless sticks are faster for targeted messes and tight spaces where a robot cannot navigate reliably.',
      'Many households end up with both over time; if you must pick one first, choose based on your biggest pain point: maintenance vs deep spot cleaning.',
    ],
  },
  {
    slug: 'avoid-fake-discounts',
    title: 'How to Avoid Fake Discounts Online',
    excerpt:
      'Learn the common patterns fake “sales” use and how to verify a price history before you commit your cart.',
    categoryLabel: 'General',
    categoryKey: 'general',
    metaRight: '4 min read',
    publishedAt: '2026-03-01',
    readingMinutes: 4,
    body: [
      'Compare the offer against at least two independent retailers and look for matching model numbers.',
      'Watch for renamed bundles that obscure what is included, especially in electronics and small appliances.',
      'Use your best judgment on third-party marketplaces: check ratings, return policies, and shipping timelines.',
    ],
  },
];

export function getBlogPostBySlug(slug: string): BlogPost | undefined {
  return blogPosts.find((p) => p.slug === slug);
}
