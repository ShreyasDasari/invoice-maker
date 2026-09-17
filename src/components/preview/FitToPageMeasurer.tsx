'use client';

/**
 * Measures how far the invoice must shrink to fit on one page.
 *
 * A hidden copy of the sheet is laid out at true page width and its natural
 * height read. Because every dimension in the template scales together, the
 * required factor is simply the page height over that natural height — no
 * trial renders of the PDF, and an answer that is available immediately as the
 * user types.
 *
 * The estimate is deliberately conservative. Shrinking type makes text wrap
 * less, never more, so the real height comes out at or below the prediction,
 * and a small safety margin absorbs the remaining difference between this
 * layout and the PDF renderer's.
 */

import { useCallback, useEffect, useRef } from 'react';
import type { InvoiceTotals } from '@/lib/calc';
import type { Invoice } from '@/lib/invoice';
import type { DateFormatId } from '@/lib/format';
import { MIN_FIT_SCALE, getPaper } from '@/lib/templates';
import { InvoiceSheet } from './InvoiceSheet';

const PT = 96 / 72;

/** Absorbs the small layout differences between this engine and the PDF's. */
const SAFETY = 0.96;

export interface FitToPageMeasurerProps {
  invoice: Invoice;
  totals: InvoiceTotals;
  locale: string;
  dateStyle: DateFormatId;
  onScale: (scale: number) => void;
}

export function FitToPageMeasurer({
  invoice,
  totals,
  locale,
  dateStyle,
  onScale,
}: FitToPageMeasurerProps) {
  const ref = useRef<HTMLDivElement>(null);
  const lastReported = useRef<number | null>(null);
  const paper = getPaper(invoice.paperSize);

  const measure = useCallback(() => {
    const node = ref.current;
    if (!node) return;
    const natural = node.scrollHeight;
    if (natural <= 0) return;

    const pageHeight = paper.height * PT;
    const scale =
      natural <= pageHeight
        ? 1
        : Math.max(MIN_FIT_SCALE, Math.min(1, (pageHeight / natural) * SAFETY));

    // Report only meaningful movement, so typing does not thrash the preview.
    const rounded = Math.round(scale * 1000) / 1000;
    if (lastReported.current !== null && Math.abs(lastReported.current - rounded) < 0.005) return;
    lastReported.current = rounded;
    onScale(rounded);
  }, [onScale, paper.height]);

  useEffect(() => {
    measure();
    const node = ref.current;
    if (!node) return;
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => observer.disconnect();
  }, [measure, invoice]);

  return (
    <div
      // Laid out (so it can be measured) but never painted and never read out.
      className="no-print pointer-events-none fixed left-[-20000px] top-0 -z-50 opacity-0"
      aria-hidden="true"
    >
      <div ref={ref} style={{ width: paper.width * PT }}>
        <InvoiceSheet
          invoice={invoice}
          totals={totals}
          locale={locale}
          dateStyle={dateStyle}
          measuring
        />
      </div>
    </div>
  );
}
