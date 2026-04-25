export type BlogCategoryKey = 'general' | 'comparisons' | 'tips';

export type BlogPost = {
  slug: string;
  title: string;
  excerpt: string;
  categoryLabel: string;
  categoryKey: BlogCategoryKey;
  /** Shown after the category pipe, e.g. ``6 min read``. */
  metaRight: string;
  /** ``YYYY-MM-DD`` from frontmatter. */
  publishedAt: string;
  readingMinutes: number;
  /** Markdown body (after YAML frontmatter). */
  bodyMarkdown: string;
  /** Optional Open Graph image (absolute URL or root-relative ``/…``). */
  ogImage?: string | null;
};
