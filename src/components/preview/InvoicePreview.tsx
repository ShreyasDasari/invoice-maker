'use client';

/**
 * The preview pane.
 *
 * The sheet is rendered at true page size and then scaled with a transform to
 * fit whatever space is available. Scaling rather than restyling is what makes
 * this a preview and not an approximation: line breaks, column widths and
 * spacing are exactly what will print.
 *
 * Printing does not use this at all — it renders its own unscaled copy through
 * a portal — so the transform here is purely for fitting the screen.
 */

import { useEffect, useRef, useState } from 'react';
import type { InvoiceTotals } from '@/lib/calc';
import type { Invoice } from '@/lib/invoice';
import type { DateFormatId } from '@/lib/format';
import { getPaper } from '@/lib/templates';
import { InvoiceSheet } from './InvoiceSheet';

const PT = 96 / 72;

export interface InvoicePreviewProps {
  invoice: Invoice;
  totals: InvoiceTotals;
  locale: string;
  dateStyle: DateFormatId;
  /** Largest scale allowed, so the sheet never looks blown up on a big screen. */
  maxScale?: number;
  /** Proportional shrink from "Fit to one page". */
  fitScale?: number;
}

export function InvoicePreview({
  invoice,
  totals,
  locale,
  dateStyle,
  maxScale = 1,
  fitScale = 1,
}: InvoicePreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.6);
  const [height, setHeight] = useState<number | null>(null);

  const paper = getPaper(invoice.paperSize);
  const sheetWidth = paper.width * PT;

  // Keep the scale in step with the container, and the reserved height in step
  // with the sheet's real height, so a multi-page invoice is fully visible and
  // nothing below it jumps as content grows.
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const measure = () => {
      const available = container.clientWidth;
      if (available > 0) setScale(Math.min(maxScale, available / sheetWidth));
      const sheetHeight = sheetRef.current?.scrollHeight ?? 0;
      if (sheetHeight > 0) setHeight(sheetHeight);
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(container);
    if (sheetRef.current) observer.observe(sheetRef.current);
    return () => observer.disconnect();
  }, [maxScale, sheetWidth, invoice, fitScale]);

  return (
    <div ref={containerRef} className="preview-root w-full">
      <div
        // overflow-hidden: the sheet keeps its full page width in layout even
        // when scaled down, and would otherwise widen the page on a phone.
        className="mx-auto origin-top overflow-hidden"
        style={{
          width: sheetWidth * scale,
          height: height !== null ? height * scale : undefined,
        }}
      >
        <div
          ref={sheetRef}
          style={{
            width: sheetWidth,
            transform: `scale(${scale})`,
            transformOrigin: 'top left',
          }}
          className="border border-line bg-white shadow-[0_1px_2px_rgb(0_0_0/0.04),0_12px_32px_rgb(0_0_0/0.06)] print:border-0 print:shadow-none"
        >
          <InvoiceSheet
            invoice={invoice}
            totals={totals}
            locale={locale}
            dateStyle={dateStyle}
            fitScale={fitScale}
          />
        </div>
      </div>
    </div>
  );
}
