# Phase 12 — Blog / CMS (file-based)

## Authoring

- Add Markdown files under **`content/blog/`** (one file per post, name = slug, e.g. `my-post.md`).
- **YAML frontmatter** (required keys): `slug`, `title`, `excerpt`, `categoryLabel`, `categoryKey` (`general` | `comparisons` | `tips`), `publishedAt` (`YYYY-MM-DD`), `readingMinutes`.
- Optional: `metaRight` (defaults to `"{readingMinutes} min read"`), `ogImage` (absolute URL or root-relative path for Open Graph / Twitter).

Body is standard **Markdown** below the closing `---` (GFM enabled: tables, strikethrough, task lists, etc.).

## Discovery & SEO

- **`/sitemap.xml`** — static routes plus every `content/blog/*.md` URL (`src/app/sitemap.ts`).
- **`/robots.txt`** — allows crawlers and points to the sitemap (`src/app/robots.ts`).
- **`/feed.xml`** — RSS 2.0 of posts (`src/app/feed.xml/route.ts`).
- **Article pages** emit **JSON-LD** `BlogPosting` and Open Graph / Twitter metadata.

## Ops

- Set **`NEXT_PUBLIC_SITE_URL`** in production for canonical URLs in sitemap, RSS, and `metadataBase` (see `src/lib/site-base-url.ts`). On Vercel, `VERCEL_URL` is used as a fallback when unset.

## Follow-ups

- MDX, drafts (`draft: true`), or a hosted headless CMS if editors need a GUI.
