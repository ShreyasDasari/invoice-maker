import type { Metadata } from 'next';
import { AppShell } from '@/components/app/AppShell';
import { EditorProviders } from '@/components/app/EditorProviders';
import { InvoiceEditor } from '@/components/editor/InvoiceEditor';
import { SITE, absoluteUrl } from '@/lib/site';
import { t } from '@/lib/i18n';

export const metadata: Metadata = {
  title: SITE.title,
  description: SITE.description,
  alternates: { canonical: '/' },
};

/**
 * The home page is the tool.
 *
 * No marketing wall to scroll past and no "Get started" button between the
 * visitor and the thing they came for. Someone arriving from a search for
 * "invoice maker" is already in the editor.
 *
 * The prose a crawler needs lives in the header below and on the dedicated
 * landing pages; the h1 is real, server-rendered text, not a decoration.
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
    browserRequirements: 'Requires JavaScript',
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
        // Static, authored JSON: no user input reaches this string.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      <div className="border-b border-line">
        <div className="mx-auto flex max-w-[1600px] flex-col gap-0.5 px-4 pb-3 pt-3.5 sm:gap-1 sm:px-6 sm:pb-4 sm:pt-5">
          <h1 className="text-[19px] font-semibold leading-tight tracking-tight text-ink sm:text-2xl">
            {t.tagline}
          </h1>
          <p className="text-[12.5px] text-ink-muted sm:text-[13px]">{t.subtitle}</p>
        </div>
      </div>

      <EditorProviders>
        <InvoiceEditor />
      </EditorProviders>

      <noscript>
        <div className="mx-auto max-w-2xl px-4 py-10 text-center">
          <p className="text-sm text-ink-muted">
            The invoice editor needs JavaScript, because your invoice is built in your
            browser rather than on a server. Turn it on to create an invoice.
          </p>
        </div>
      </noscript>
    </AppShell>
  );
}
