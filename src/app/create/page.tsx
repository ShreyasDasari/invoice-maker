import type { Metadata } from 'next';
import { AppShell } from '@/components/app/AppShell';
import { EditorProviders } from '@/components/app/EditorProviders';
import { InvoiceEditor } from '@/components/editor/InvoiceEditor';
import { SITE } from '@/lib/site';
import { t } from '@/lib/i18n';

export const metadata: Metadata = {
  title: 'Create an invoice',
  description: SITE.description,
  alternates: { canonical: '/create' },
};

/**
 * The editor.
 *
 * Kept on its own route so the home page can show what the finished invoice
 * looks like first. Everything here still works without an account, and the
 * draft lives in the browser, so arriving from anywhere picks up where the
 * last visit left off.
 */
export default function CreatePage() {
  return (
    <AppShell showFooter={false}>
      <div className="border-b border-line/70">
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
            The invoice editor needs JavaScript, because your invoice is built in your browser
            rather than on a server. Turn it on to create an invoice.
          </p>
        </div>
      </noscript>
    </AppShell>
  );
}
