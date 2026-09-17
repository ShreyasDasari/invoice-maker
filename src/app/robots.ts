import type { MetadataRoute } from 'next';
import { absoluteUrl } from '@/lib/site';

/**
 * robots.txt
 *
 * Everything is crawlable. The only exclusion is Next.js internals, which
 * carry no content and waste crawl budget.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/_next/', '/api/'],
      },
    ],
    sitemap: absoluteUrl('/sitemap.xml'),
  };
}
