'use client';

/**
 * Download, print and share.
 *
 * The PDF renderer is loaded with a dynamic import the first time it is needed.
 * It is by far the heaviest dependency in the project, and nobody should pay
 * for it while typing — the critical path to a filled-in invoice stays light,
 * and the cost is paid once, at the moment the user asks for the file.
 */

import { useCallback, useRef, useState } from 'react';
import type { Invoice } from '@/lib/invoice';
import type { InvoiceTotals } from '@/lib/calc';
import type { DateFormatId } from '@/lib/format';
import { buildShareUrl } from '@/lib/share';
import { track } from '@/lib/analytics';
import { t } from '@/lib/i18n';
import { useToast } from '@/components/ui/Toast';

/** Generous enough for a hundred-line invoice on a slow phone. */
const PDF_TIMEOUT_MS = 45_000;

/** A filename that is safe on every OS and still recognisable in a folder. */
export function pdfFilename(invoice: Invoice): string {
  const parts = [invoice.invoiceNumber, invoice.customer.name]
    .map((part) => part.trim())
    .filter(Boolean)
    .join('-');
  const safe = (parts || 'invoice')
    // Path separators and characters Windows reserves.
    .replace(/[\\/:*?"<>|]+/g, '')
    // Control codes, which have no business in a filename.
    .replace(/[\x00-\x1f\x7f]+/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^[-.]+|[-.]+$/g, '')
    .slice(0, 80);
  return `${safe || 'invoice'}.pdf`;
}

interface ActionContext {
  invoice: Invoice;
  totals: InvoiceTotals;
  locale: string;
  dateStyle: DateFormatId;
  /** The shrink factor measured by the preview, for "Fit to one page". */
  fitScale: number;
  /** Records the invoice as finished, for the recent list. */
  onCommit: () => void;
}

export function useInvoiceActions({
  invoice,
  totals,
  locale,
  dateStyle,
  fitScale,
  onCommit,
}: ActionContext) {
  const toast = useToast();
  const [downloading, setDownloading] = useState(false);
  const [sharing, setSharing] = useState(false);
  // Guards against a second click landing while the first render is in flight.
  const inFlight = useRef(false);

  const buildBlob = useCallback(async (): Promise<Blob> => {
    const [{ pdf }, { InvoiceDocument }] = await Promise.all([
      import('@react-pdf/renderer'),
      import('@/components/pdf/InvoiceDocument'),
    ]);

    const render = pdf(
      <InvoiceDocument
        invoice={invoice}
        totals={totals}
        locale={locale}
        dateStyle={dateStyle}
        fitScale={fitScale}
      />,
    ).toBlob();

    // The renderer loads a WebAssembly layout engine. If the environment
    // refuses to compile it, the underlying promise can hang rather than
    // reject, which would leave the button spinning forever. A ceiling turns
    // that into an error the user can act on.
    return Promise.race([
      render,
      new Promise<never>((_, reject) => {
        window.setTimeout(() => reject(new Error('PDF render timed out')), PDF_TIMEOUT_MS);
      }),
    ]);
  }, [invoice, totals, locale, dateStyle, fitScale]);

  const download = useCallback(async () => {
    if (inFlight.current) return;
    inFlight.current = true;
    setDownloading(true);
    try {
      const blob = await buildBlob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = pdfFilename(invoice);
      anchor.rel = 'noopener';
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      // Revoked later: revoking immediately can cancel the download in some browsers.
      window.setTimeout(() => URL.revokeObjectURL(url), 10_000);

      onCommit();
      track('invoice_downloaded', { template: invoice.template, currency: invoice.currency });
      toast.success(t.toast.downloaded);
    } catch {
      toast.error(t.errors.pdfFailed);
    } finally {
      setDownloading(false);
      inFlight.current = false;
    }
  }, [buildBlob, invoice, onCommit, toast]);

  const print = useCallback(() => {
    onCommit();
    track('invoice_printed', { template: invoice.template });
    // The print stylesheet hides the application and prints the sheet alone.
    window.print();
  }, [invoice.template, onCommit]);

  const copyLink = useCallback(async () => {
    setSharing(true);
    try {
      const { url, tooLarge, logoOmitted } = await buildShareUrl(invoice, window.location.origin);
      if (tooLarge) {
        toast.error(t.errors.linkTooLong);
        return;
      }
      await navigator.clipboard.writeText(url);
      onCommit();
      track('invoice_shared');
      toast.success(
        logoOmitted
          ? `${t.actions.linkCopied}. The logo is not included in links.`
          : t.actions.linkCopied,
      );
    } catch {
      toast.error(t.errors.shareUnavailable);
    } finally {
      setSharing(false);
    }
  }, [invoice, onCommit, toast]);

  /**
   * Native share where the platform offers it, which on a phone means the real
   * share sheet. The PDF goes as a file when files are supported, since that is
   * what a customer actually wants to receive.
   */
  const shareNative = useCallback(async () => {
    if (typeof navigator === 'undefined' || !navigator.share) {
      await copyLink();
      return;
    }
    setSharing(true);
    try {
      const blob = await buildBlob();
      const file = new File([blob], pdfFilename(invoice), { type: 'application/pdf' });
      const title = `Invoice ${invoice.invoiceNumber}`;

      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title });
      } else {
        const { url } = await buildShareUrl(invoice, window.location.origin);
        await navigator.share({ title, text: title, url });
      }
      onCommit();
      track('invoice_shared');
    } catch (error) {
      // A user cancelling the share sheet is not an error worth reporting.
      if (error instanceof DOMException && error.name === 'AbortError') return;
      toast.error(t.errors.shareUnavailable);
    } finally {
      setSharing(false);
    }
  }, [buildBlob, copyLink, invoice, onCommit, toast]);

  const canShareNative =
    typeof navigator !== 'undefined' && typeof navigator.share === 'function';

  return { download, print, copyLink, shareNative, downloading, sharing, canShareNative };
}
