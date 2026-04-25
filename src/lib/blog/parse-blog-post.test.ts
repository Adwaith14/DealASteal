/** @vitest-environment node */
import { describe, expect, it } from 'vitest';
import { parseBlogPostSource } from './parse-blog-post';

describe('parseBlogPostSource', () => {
  it('parses frontmatter and markdown body', () => {
    const raw = `---
slug: test-post
title: "Hello"
excerpt: "Short lead."
categoryLabel: General
categoryKey: general
publishedAt: "2026-01-15"
readingMinutes: 3
---

First paragraph.

Second **bold** line.
`;
    const post = parseBlogPostSource('test-post', raw);
    expect(post.slug).toBe('test-post');
    expect(post.title).toBe('Hello');
    expect(post.metaRight).toBe('3 min read');
    expect(post.bodyMarkdown).toContain('First paragraph');
    expect(post.bodyMarkdown).toContain('**bold**');
  });

  it('throws when filename slug does not match frontmatter', () => {
    const raw = `---
slug: wrong-slug
title: T
excerpt: E
categoryLabel: G
categoryKey: general
publishedAt: "2026-01-01"
readingMinutes: 1
---
Body
`;
    expect(() => parseBlogPostSource('right-slug', raw)).toThrow(/Slug mismatch/i);
  });
});
