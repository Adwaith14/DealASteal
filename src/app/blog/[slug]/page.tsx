import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { MarketingShell } from '@/components/layout/MarketingShell';
import { BlogCategoryIcon } from '@/components/marketing/BlogCategoryIcon';
import { getBlogPostBySlug, blogPosts } from '@/lib/blog-posts';
import { formatBlogListDate } from '@/utils/blog-display';

type PageProps = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return blogPosts.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = getBlogPostBySlug(slug);
  if (!post) {
    return { title: 'Article | DealASteal' };
  }
  return {
    title: post.title,
    description: post.excerpt,
  };
}

export default async function BlogArticlePage({ params }: PageProps) {
  const { slug } = await params;
  const post = getBlogPostBySlug(slug);
  if (!post) {
    notFound();
  }

  const categoryUpper = post.categoryLabel.toUpperCase();

  return (
    <MarketingShell>
      <article className="flex-1">
        <header className="border-b border-gray-200 bg-white px-4 py-10 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl">
            <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600">
              <BlogCategoryIcon categoryKey={post.categoryKey} />
              <span className="font-extrabold uppercase tracking-wide text-red-600">{categoryUpper}</span>
              <span className="text-gray-300" aria-hidden>
                |
              </span>
              <span>{post.readingMinutes} min read</span>
            </div>
            <h1 className="mt-6 text-2xl font-extrabold leading-tight text-gray-900 sm:text-4xl">
              {post.title}
            </h1>
            <p className="mt-2 text-sm text-gray-400">
              <time dateTime={post.publishedAt}>{formatBlogListDate(post.publishedAt)}</time>
            </p>
          </div>
        </header>

        <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
            <p className="text-lg leading-relaxed text-gray-700">{post.excerpt}</p>
            <div className="mt-8 space-y-4 text-sm leading-relaxed text-gray-600 sm:text-base">
              {post.body.map((para, i) => (
                <p key={i}>{para}</p>
              ))}
            </div>
          </div>
          <p className="mt-8">
            <Link href="/blog" className="text-sm font-semibold text-red-600 hover:text-red-700">
              ← All guides
            </Link>
          </p>
        </div>
      </article>
    </MarketingShell>
  );
}
