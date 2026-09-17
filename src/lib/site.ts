/** Canonical site configuration, shared by metadata, sitemap and robots. */

/**
 * The public origin.
 *
 * Set NEXT_PUBLIC_SITE_URL to the production domain. Vercel's own VERCEL_URL is
 * the fallback so preview deployments emit correct absolute URLs, and localhost
 * is the last resort for development.
 */
export function getSiteUrl(): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL;
  if (configured) return configured.replace(/\/$/, '');
  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL ?? process.env.VERCEL_URL;
  if (vercel) return `https://${vercel.replace(/\/$/, '')}`;
  return 'http://localhost:3000';
}

export const SITE = {
  name: 'Invoice Maker',
  shortName: 'Invoice Maker',
  title: 'Free Invoice Maker — Create an Invoice Online',
  description:
    'Create a professional invoice in seconds and download it as a PDF. Free, no signup, no watermark. Works on mobile and desktop.',
  /** High-intent search terms this tool should answer. */
  keywords: [
    'invoice maker',
    'free invoice maker',
    'invoice generator',
    'free invoice generator',
    'create invoice',
    'online invoice maker',
    'invoice template',
    'professional invoice maker',
    'simple invoice maker',
    'invoice generator free',
    'business invoice maker',
    'freelance invoice maker',
    'invoice maker online free',
    'make an invoice',
  ],
  locale: 'en_US',
} as const;

/** Absolute URL for a path, for canonicals and structured data. */
export function absoluteUrl(path = '/'): string {
  const base = getSiteUrl();
  return path === '/' ? base : `${base}${path.startsWith('/') ? path : `/${path}`}`;
}
