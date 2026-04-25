export type { BlogCategoryKey, BlogPost } from '@/lib/blog/types';
import {
  getAllBlogPosts,
  getAllBlogSlugs,
  getBlogPostBySlug,
} from '@/lib/blog/load-posts-from-files';

export { getAllBlogPosts, getAllBlogSlugs, getBlogPostBySlug };

/** @deprecated Prefer ``getAllBlogPosts()`` — list snapshot at first import (matches prior static array usage). */
export const blogPosts = getAllBlogPosts();
