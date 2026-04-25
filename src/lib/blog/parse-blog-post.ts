import matter from 'gray-matter';
import { z } from 'zod';
import type { BlogCategoryKey, BlogPost } from '@/lib/blog/types';

const categoryKeys = ['general', 'comparisons', 'tips'] as const satisfies readonly BlogCategoryKey[];

const FrontmatterSchema = z.object({
  slug: z.string().min(1),
  title: z.string().min(1).max(300),
  excerpt: z.string().min(1).max(2000),
  categoryLabel: z.string().min(1).max(120),
  categoryKey: z.enum(categoryKeys),
  publishedAt: z.union([z.string(), z.date()]).transform((v) => {
    if (v instanceof Date) {
      return v.toISOString().slice(0, 10);
    }
    return v.trim().slice(0, 10);
  }),
  readingMinutes: z.coerce.number().int().positive().max(120),
  metaRight: z.string().trim().min(1).max(80).optional(),
  ogImage: z.string().trim().max(500).optional().nullable(),
});

/**
 * Parses a single ``content/blog/*.md`` file. ``slugFromFilename`` must match frontmatter ``slug``.
 */
export function parseBlogPostSource(slugFromFilename: string, raw: string): BlogPost {
  const { data, content } = matter(raw.trim());
  const fm = FrontmatterSchema.parse(data);
  if (fm.slug !== slugFromFilename) {
    throw new Error(
      `[DealASteal/blog] Slug mismatch for "${slugFromFilename}.md": frontmatter has slug "${fm.slug}".`
    );
  }
  const metaRight = fm.metaRight ?? `${fm.readingMinutes} min read`;
  return {
    slug: fm.slug,
    title: fm.title,
    excerpt: fm.excerpt,
    categoryLabel: fm.categoryLabel,
    categoryKey: fm.categoryKey,
    metaRight,
    publishedAt: fm.publishedAt,
    readingMinutes: fm.readingMinutes,
    ogImage: fm.ogImage ?? null,
    bodyMarkdown: typeof content === 'string' ? content.trim() : '',
  };
}
