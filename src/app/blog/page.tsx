import type { Metadata } from 'next';
import { MarketingShell } from '@/components/layout/MarketingShell';
import { BlogPostCard } from '@/components/marketing/BlogPostCard';
import { PageHero } from '@/components/marketing/PageHero';
import { blogPosts } from '@/lib/blog-posts';

export const metadata: Metadata = {
  title: 'Deal guides & shopping tips',
  description:
    'Expert guides to help you find great deals, compare products, and save more on every purchase.',
};

export default function BlogPage() {
  return (
    <MarketingShell>
      <PageHero
        title="Deal guides & shopping tips"
        subtitle="Expert guides to help you find great deals, avoid scams, and save more money on every purchase."
      />

      <div className="mx-auto w-full max-w-3xl flex-1 px-4 py-10 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-6">
          {blogPosts.map((post) => (
            <BlogPostCard key={post.slug} post={post} />
          ))}
        </div>
        <p className="mt-10 text-center text-sm text-gray-500">
          More guides coming soon. Check back for updated shopping tips and deal strategies.
        </p>
      </div>
    </MarketingShell>
  );
}
