import Link from 'next/link';
import { BlogCategoryIcon } from '@/components/marketing/BlogCategoryIcon';
import type { BlogPost } from '@/lib/blog-posts';
import { formatBlogListDate } from '@/utils/blog-display';

type BlogPostCardProps = {
  post: BlogPost;
};

export function BlogPostCard({ post }: BlogPostCardProps) {
  const categoryUpper = post.categoryLabel.toUpperCase();

  return (
    <article className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition hover:shadow-md sm:p-8">
      <div className="flex flex-wrap items-center gap-3 text-sm">
        <BlogCategoryIcon categoryKey={post.categoryKey} />
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2 text-gray-600">
          <span className="font-extrabold uppercase tracking-wide text-red-600">{categoryUpper}</span>
          <span className="hidden text-gray-300 sm:inline" aria-hidden>
            |
          </span>
          <span className="flex items-center gap-1.5 text-gray-500">
            <svg className="size-3.5 shrink-0" viewBox="0 0 24 24" fill="none" aria-hidden>
              <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" />
              <path d="M12 7v5l3 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            {post.metaRight}
          </span>
        </div>
      </div>

      <h2 className="mt-5 text-xl font-extrabold leading-snug text-gray-900 sm:text-2xl">
        <Link
          href={`/blog/${post.slug}`}
          className="hover:text-red-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-500"
        >
          {post.title}
        </Link>
      </h2>
      <p className="mt-3 text-pretty text-sm leading-relaxed text-gray-600 sm:text-base">{post.excerpt}</p>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 pt-4 text-sm">
        <time className="text-gray-400" dateTime={post.publishedAt}>
          {formatBlogListDate(post.publishedAt)}
        </time>
        <Link
          href={`/blog/${post.slug}`}
          className="font-semibold text-red-600 transition hover:text-red-700"
        >
          Read more →
        </Link>
      </div>
    </article>
  );
}
