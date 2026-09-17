import type { MetadataRoute } from 'next';
import { absoluteUrl } from '@/lib/site';
import { SEO_PAGES } from '@/lib/seo-pages';

/**
 * sitemap.xml
 *
 * The tool itself, the landing pages that answer a search, and the privacy
 * page. Pages that only make sense with local data (recent invoices) are left
 * out: there is nothing there for a crawler to index.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  return [
    {
      url: absoluteUrl('/'),
      lastModified,
      changeFrequency: 'weekly',
      priority: 1,
    },
    ...SEO_PAGES.map((page) => ({
      url: absoluteUrl(`/${page.slug}`),
      lastModified,
      changeFrequency: 'monthly' as const,
      priority: page.priority,
    })),
    {
      url: absoluteUrl('/privacy'),
      lastModified,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
  ];
}
