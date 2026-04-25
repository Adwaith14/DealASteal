import { NextResponse } from 'next/server';
import { getAllBlogPosts } from '@/lib/blog-posts';

function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export function GET(request: Request) {
  const envBase = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/$/, '');
  const origin = envBase ?? new URL(request.url).origin;
  const posts = getAllBlogPosts();

  const items = posts
    .map((p) => {
      const link = `${origin}/blog/${p.slug}`;
      const pub = new Date(`${p.publishedAt}T12:00:00.000Z`).toUTCString();
      return [
        '  <item>',
        `    <title>${escapeXml(p.title)}</title>`,
        `    <link>${escapeXml(link)}</link>`,
        `    <guid>${escapeXml(link)}</guid>`,
        `    <pubDate>${pub}</pubDate>`,
        `    <description>${escapeXml(p.excerpt)}</description>`,
        '  </item>',
      ].join('\n');
    })
    .join('\n');

  const xml = [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<rss version="2.0">`,
    `  <channel>`,
    `    <title>DealASteal Blog</title>`,
    `    <link>${escapeXml(`${origin}/blog`)}</link>`,
    `    <description>Deal guides and shopping tips from DealASteal.</description>`,
    `    <language>en-us</language>`,
    items,
    `  </channel>`,
    `</rss>`,
  ].join('\n');

  return new NextResponse(xml, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
    },
  });
}
