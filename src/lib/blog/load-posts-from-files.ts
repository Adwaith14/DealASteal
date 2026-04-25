import fs from 'node:fs';
import path from 'node:path';
import type { BlogPost } from '@/lib/blog/types';
import { parseBlogPostSource } from '@/lib/blog/parse-blog-post';

const BLOG_DIR = path.join(process.cwd(), 'content', 'blog');

function readAllPosts(): BlogPost[] {
  if (!fs.existsSync(BLOG_DIR)) {
    return [];
  }
  const files = fs.readdirSync(BLOG_DIR).filter((f) => f.endsWith('.md'));
  const posts: BlogPost[] = [];
  for (const file of files) {
    const slug = file.replace(/\.md$/u, '');
    const raw = fs.readFileSync(path.join(BLOG_DIR, file), 'utf8');
    posts.push(parseBlogPostSource(slug, raw));
  }
  return posts.sort((a, b) => {
    const byDate = b.publishedAt.localeCompare(a.publishedAt);
    if (byDate !== 0) {
      return byDate;
    }
    return a.slug.localeCompare(b.slug);
  });
}

let _cache: BlogPost[] | null = null;

/** Sorted newest first. Cached per Node process (revalidated on restart / deploy). */
export function getAllBlogPosts(): BlogPost[] {
  if (_cache) {
    return _cache;
  }
  _cache = readAllPosts();
  return _cache;
}

export function getBlogPostBySlug(slug: string): BlogPost | undefined {
  return getAllBlogPosts().find((p) => p.slug === slug);
}

export function getAllBlogSlugs(): string[] {
  return getAllBlogPosts().map((p) => p.slug);
}

/** Test-only: clear module cache so ``content/blog`` changes are picked up in the same process. */
export function __resetBlogPostsCacheForTests(): void {
  _cache = null;
}
