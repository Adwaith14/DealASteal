import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { MarketingShell } from '@/components/layout/MarketingShell';
import { BlogCategoryIcon } from '@/components/marketing/BlogCategoryIcon';
import { BlogMarkdown } from '@/components/marketing/BlogMarkdown';
import { getAllBlogPosts, getBlogPostBySlug } from '@/lib/blog-posts';
import { formatBlogListDate } from '@/utils/blog-display';
import { getSiteOrigin } from '@/utils/site-origin';

type PageProps = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return getAllBlogPosts().map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = getBlogPostBySlug(slug);
  if (!post) {
    return { title: 'Article | DealASteal' };
  }
  const origin = await getSiteOrigin();
  const ogImages: string[] | undefined =
    post.ogImage != null && post.ogImage.length > 0
      ? [post.ogImage.startsWith('http') ? post.ogImage : `${origin}${post.ogImage}`]
      : undefined;

  return {
    title: post.title,
    description: post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      type: 'article',
      publishedTime: `${post.publishedAt}T12:00:00.000Z`,
      url: `${origin}/blog/${post.slug}`,
      ...(ogImages ? { images: ogImages } : {}),
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.excerpt,
      ...(ogImages?.[0] ? { images: [ogImages[0]] } : {}),
    },
  };
}

export default async function BlogArticlePage({ params }: PageProps) {
  const { slug } = await params;
  const post = getBlogPostBySlug(slug);
  if (!post) {
    notFound();
  }

  const categoryUpper = post.categoryLabel.toUpperCase();
  const origin = await getSiteOrigin();
  const canonical = `${origin}/blog/${post.slug}`;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.excerpt,
    datePublished: `${post.publishedAt}T12:00:00.000Z`,
    author: {
      '@type': 'Organization',
      name: 'DealASteal',
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': canonical,
    },
  };

  return (
    <MarketingShell>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
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
            <div className="mt-8 border-t border-gray-100 pt-8">
              <BlogMarkdown markdown={post.bodyMarkdown} />
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
