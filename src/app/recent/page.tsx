import type { Metadata } from 'next';
import { AppShell } from '@/components/app/AppShell';
import { EditorProviders } from '@/components/app/EditorProviders';
import { RecentInvoices } from '@/components/app/RecentInvoices';

export const metadata: Metadata = {
  title: 'Recent invoices',
  description: 'Invoices you have created on this device. Open, duplicate or download them again.',
  alternates: { canonical: '/recent' },
  // Nothing here exists until the visitor has made an invoice, so there is
  // nothing for a crawler to index.
  robots: { index: false, follow: true },
};

export default function RecentPage() {
  return (
    <AppShell>
      <EditorProviders>
        <RecentInvoices />
      </EditorProviders>
    </AppShell>
  );
}
