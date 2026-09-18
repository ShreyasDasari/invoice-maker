'use client';

/**
 * The copy of the invoice that actually prints.
 *
 * Printing used to work off the on-screen preview, which failed in two ways:
 * on a phone the preview is `display:none` whenever the Edit tab is showing,
 * so Print produced a blank page; and on a desktop the preview sits in a
 * scrolling container, so anything below the fold was cut off — often the
 * totals.
 *
 * Neither is fixable from inside that subtree, because a child cannot undo
 * `display:none` or `overflow:hidden` on an ancestor. So the printable invoice
 * is rendered through a portal as a direct child of <body>, where nothing can
 * clip or hide it, and the print stylesheet simply hides every other top-level
 * element.
 */

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import type { InvoiceTotals } from '@/lib/calc';
import type { Invoice } from '@/lib/invoice';
import type { DateFormatId } from '@/lib/format';
import { getPaper } from '@/lib/templates';
import { InvoiceSheet } from './InvoiceSheet';

export interface PrintSheetProps {
  invoice: Invoice;
  totals: InvoiceTotals;
  locale: string;
  dateStyle: DateFormatId;
  fitScale?: number;
}

export function PrintSheet({ invoice, totals, locale, dateStyle, fitScale = 1 }: PrintSheetProps) {
  // Portals need a DOM target, so this waits for the client.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // `@page` reads this, so the printer is told A4 or Letter to match the PDF.
  const paper = getPaper(invoice.paperSize);
  useEffect(() => {
    document.documentElement.style.setProperty('--print-page-size', paper.css);
  }, [paper.css]);

  if (!mounted) return null;

  return createPortal(
    <div className="print-portal" aria-hidden="true">
      <InvoiceSheet
        invoice={invoice}
        totals={totals}
        locale={locale}
        dateStyle={dateStyle}
        fitScale={fitScale}
      />
    </div>,
    document.body,
  );
}
