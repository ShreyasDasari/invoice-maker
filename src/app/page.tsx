import type { Metadata } from 'next';
import { AppShell } from '@/components/app/AppShell';
import { LandingHero } from '@/components/marketing/LandingHero';
import { LegacyShareRedirect } from '@/components/marketing/LegacyShareRedirect';
import { SITE, absoluteUrl } from '@/lib/site';

export const metadata: Metadata = {
  title: SITE.title,
  description: SITE.description,
  alternates: { canonical: '/' },
};

/**
 * The home page.
 *
 * One claim, one button and the finished invoice. It shows the real document
 * before asking for anything, because that is what a first-time visitor wants
 * to know: what will I end up with. The editor is one click away and needs no
 * account, so there is nothing else to explain here.
 */
export default function HomePage() {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: SITE.name,
    url: absoluteUrl('/'),
    description: SITE.description,
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Any',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
      description: 'Free. No account required, no watermark.',
    },
    featureList: [
      'Create and download PDF invoices',
      'Automatic tax, discount and total calculation',
      'Multi-currency support',
      'Three professional templates',
      'Works without an account',
    ],
  };

  return (
    <AppShell>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      {/* Share links used to point at "/". Send those straight to the editor. */}
      <LegacyShareRedirect />

      <LandingHero />
    </AppShell>
  );
}
