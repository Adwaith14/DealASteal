import type { MetadataRoute } from 'next';
import { getPublicSiteBaseUrl } from '@/lib/site-base-url';

export default function robots(): MetadataRoute.Robots {
  const base = getPublicSiteBaseUrl();
  return {
    rules: {
      userAgent: '*',
      allow: '/',
    },
    sitemap: `${base}/sitemap.xml`,
  };
}
