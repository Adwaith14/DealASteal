import type { MetadataRoute } from 'next';
import { getAllBlogPosts } from '@/lib/blog-posts';
import { getPublicSiteBaseUrl } from '@/lib/site-base-url';

export default function sitemap(): MetadataRoute.Sitemap {
  const base = getPublicSiteBaseUrl();
  const now = new Date();

  const staticPaths = ['/', '/about', '/blog', '/contact'] as const;
  const entries: MetadataRoute.Sitemap = staticPaths.map((path) => ({
    url: path === '/' ? `${base}/` : `${base}${path}`,
    lastModified: now,
    changeFrequency: path === '/' ? 'daily' : 'weekly',
    priority: path === '/' ? 1 : 0.7,
  }));

  for (const post of getAllBlogPosts()) {
    entries.push({
      url: `${base}/blog/${post.slug}`,
      lastModified: new Date(`${post.publishedAt}T12:00:00.000Z`),
      changeFrequency: 'monthly',
      priority: 0.6,
    });
  }

  return entries;
}
