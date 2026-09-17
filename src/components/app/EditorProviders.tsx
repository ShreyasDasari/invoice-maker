'use client';

import type { ReactNode } from 'react';
import { InvoiceStoreProvider } from '@/state/invoice-store';
import { ToastProvider } from '@/components/ui/Toast';

/** The client-side context the editor and the recent list both need. */
export function EditorProviders({ children }: { children: ReactNode }) {
  return (
    <ToastProvider>
      <InvoiceStoreProvider>{children}</InvoiceStoreProvider>
    </ToastProvider>
  );
}
