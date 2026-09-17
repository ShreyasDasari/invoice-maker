'use client';

/**
 * The line items editor.
 *
 * Two layouts, not one shrunk down. On a wide screen the rows are a real grid
 * with column headers, which is how people scan a price list. On a phone each
 * line becomes a small stacked card, because a five-column grid at 375px is a
 * precision-tapping exercise.
 *
 * Amounts are computed, never typed, and shown right-aligned in tabular figures
 * so the column stays still as digits change.
 */

import { useCallback, useEffect, useRef } from 'react';
import { FieldShell, TextField, Toggle } from '@/components/ui/Field';
import { Button, IconButton } from '@/components/ui/Button';
import { ArrowDownIcon, ArrowUpIcon, PlusIcon, TrashIcon } from '@/components/ui/Icons';
import type { Adjustment, Invoice, LineItem } from '@/lib/invoice';
import type { InvoiceTotals } from '@/lib/calc';
import { formatAmount } from '@/lib/format';
import { t } from '@/lib/i18n';
import { Panel } from './Panel';

export interface LineItemsProps {
  invoice: Invoice;
  totals: InvoiceTotals;
  locale: string;
  onAddItem: () => void;
  onUpdateItem: (id: string, patch: Partial<LineItem>) => void;
  onRemoveItem: (id: string) => void;
  onMoveItem: (id: string, direction: -1 | 1) => void;
  onToggleOption: (patch: Partial<Invoice['options']>) => void;
}

/** A percentage/amount pair: a number input plus a mode switch. */
function AdjustmentInput({
  label,
  hideLabel,
  adjustment,
  currencyCode,
  onChange,
}: {
  label: string;
  hideLabel?: boolean;
  adjustment: Adjustment;
  currencyCode: string;
  onChange: (next: Adjustment) => void;
}) {
  return (
    <div className="flex min-w-0 items-end gap-1">
      <TextField
        label={label}
        hideLabel={hideLabel}
        numeric
        inputMode="decimal"
        value={adjustment.value}
        placeholder="0"
        maxLength={12}
        className="min-w-0 flex-1"
        onChange={(event) => onChange({ ...adjustment, value: event.target.value })}
      />
      <button
        type="button"
        // Two states, so a toggle beats a select: one tap, and the current
        // mode is the label.
        onClick={() =>
          onChange({ ...adjustment, mode: adjustment.mode === 'percent' ? 'fixed' : 'percent' })
        }
        aria-label={`${label} is ${adjustment.mode === 'percent' ? 'a percentage' : 'a fixed amount'}. Switch to ${
          adjustment.mode === 'percent' ? 'a fixed amount' : 'a percentage'
        }.`}
        title={adjustment.mode === 'percent' ? 'Switch to a fixed amount' : 'Switch to a percentage'}
        className="mb-px h-11 w-9 shrink-0 cursor-pointer rounded-md border border-line bg-surface text-[13px] font-semibold text-ink-muted transition-colors duration-150 hover:border-line-strong hover:text-ink sm:h-9"
      >
        {adjustment.mode === 'percent' ? '%' : currencyCode.slice(0, 3)}
      </button>
    </div>
  );
}

export function LineItems({
  invoice,
  totals,
  locale,
  onAddItem,
  onUpdateItem,
  onRemoveItem,
  onMoveItem,
  onToggleOption,
}: LineItemsProps) {
  const { items, options, currency } = invoice;
  const showTax = options.perItemTax;
  const showDiscount = options.perItemDiscount;

  /**
   * Adding a line puts the caret in its description, so "Add item" and typing
   * are one continuous motion rather than add-then-reach-for-the-mouse.
   * The new line's id is minted in the reducer, so the focus is applied after
   * the render that brings it into the DOM.
   */
  const pendingFocus = useRef(false);
  const lastId = items[items.length - 1]?.id;

  const addItem = useCallback(() => {
    pendingFocus.current = true;
    onAddItem();
  }, [onAddItem]);

  useEffect(() => {
    if (!pendingFocus.current || !lastId) return;
    pendingFocus.current = false;
    // Both layouts render a field; only the one for the current breakpoint is
    // laid out, and offsetParent is how we tell which.
    const candidates = [`desc-lg-${lastId}`, `desc-sm-${lastId}`];
    for (const id of candidates) {
      const node = document.getElementById(id);
      if (node instanceof HTMLInputElement && node.offsetParent !== null) {
        node.focus();
        return;
      }
    }
  }, [lastId]);

  const columnCount = 3 + (showDiscount ? 1 : 0) + (showTax ? 1 : 0);
  const gridTemplate = [
    'minmax(0,1fr)',
    '4.5rem',
    '6.5rem',
    showDiscount ? '7rem' : null,
    showTax ? '7rem' : null,
    '6.5rem',
    '2.25rem',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <Panel
      title={t.sections.items}
      action={
        <span className="text-[11px] text-ink-subtle">
          {items.length} {items.length === 1 ? 'line' : 'lines'}
        </span>
      }
    >
      {/* Column headers: shown once on wide screens, where the grid exists. */}
      <div
        className="hidden items-end gap-2 pb-1 lg:grid"
        style={{ gridTemplateColumns: gridTemplate }}
        aria-hidden="true"
      >
        <span className="text-[11px] font-medium uppercase tracking-[0.06em] text-ink-subtle">
          {t.fields.description}
        </span>
        <span className="text-right text-[11px] font-medium uppercase tracking-[0.06em] text-ink-subtle">
          {t.fields.quantity}
        </span>
        <span className="text-right text-[11px] font-medium uppercase tracking-[0.06em] text-ink-subtle">
          {t.fields.unitPrice}
        </span>
        {showDiscount ? (
          <span className="text-right text-[11px] font-medium uppercase tracking-[0.06em] text-ink-subtle">
            {t.fields.discount}
          </span>
        ) : null}
        {showTax ? (
          <span className="text-right text-[11px] font-medium uppercase tracking-[0.06em] text-ink-subtle">
            {t.fields.tax}
          </span>
        ) : null}
        <span className="text-right text-[11px] font-medium uppercase tracking-[0.06em] text-ink-subtle">
          {t.fields.amount}
        </span>
        <span />
      </div>

      <ul className="flex flex-col gap-3 lg:gap-1.5">
        {items.map((item, index) => {
          const line = totals.items[index];
          const isLast = index === items.length - 1;
          const amount = line ? formatAmount(line.net, currency, locale) : '';

          return (
            <li
              key={item.id}
              className="rounded-md border border-line p-3 lg:border-0 lg:p-0"
            >
              {/* Wide layout: one grid row per line. */}
              <div
                className="hidden items-end gap-2 lg:grid"
                style={{ gridTemplateColumns: gridTemplate }}
              >
                <TextField
                  label={`${t.fields.description}, line ${index + 1}`}
                  hideLabel
                  value={item.description}
                  id={`desc-lg-${item.id}`}
                  placeholder="Service or product"
                  maxLength={400}
                  onChange={(event) => onUpdateItem(item.id, { description: event.target.value })}
                />
                <TextField
                  label={`${t.fields.quantity}, line ${index + 1}`}
                  hideLabel
                  numeric
                  inputMode="decimal"
                  value={item.quantity}
                  placeholder="1"
                  maxLength={10}
                  onChange={(event) => onUpdateItem(item.id, { quantity: event.target.value })}
                />
                <TextField
                  label={`${t.fields.unitPrice}, line ${index + 1}`}
                  hideLabel
                  numeric
                  inputMode="decimal"
                  value={item.unitPrice}
                  placeholder="0.00"
                  maxLength={16}
                  onChange={(event) => onUpdateItem(item.id, { unitPrice: event.target.value })}
                />
                {showDiscount ? (
                  <AdjustmentInput
                    label={`${t.fields.discount}, line ${index + 1}`}
                    hideLabel
                    adjustment={item.discount}
                    currencyCode={currency}
                    onChange={(discount) => onUpdateItem(item.id, { discount })}
                  />
                ) : null}
                {showTax ? (
                  <AdjustmentInput
                    label={`${t.fields.tax}, line ${index + 1}`}
                    hideLabel
                    adjustment={item.tax}
                    currencyCode={currency}
                    onChange={(tax) => onUpdateItem(item.id, { tax })}
                  />
                ) : null}
                <output
                  className="tabular h-9 truncate px-1 text-right text-sm leading-9 font-medium"
                  aria-label={`Amount for line ${index + 1}`}
                >
                  {amount}
                </output>
                <IconButton
                  label={`${t.actions.removeItem} ${index + 1}`}
                  variant="danger"
                  size="sm"
                  className="mb-px justify-self-end"
                  disabled={items.length === 1 && !item.description && !item.unitPrice}
                  onClick={() => onRemoveItem(item.id)}
                >
                  <TrashIcon size={14} />
                </IconButton>
              </div>

              {/* Narrow layout: a stacked card per line. */}
              <div className="flex flex-col gap-3 lg:hidden">
                <div className="flex items-start justify-between gap-2">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-subtle">
                    Line {index + 1}
                  </span>
                  <div className="-mt-1 flex items-center gap-0.5">
                    <IconButton
                      label={`Move line ${index + 1} up`}
                      size="sm"
                      disabled={index === 0}
                      onClick={() => onMoveItem(item.id, -1)}
                    >
                      <ArrowUpIcon size={14} />
                    </IconButton>
                    <IconButton
                      label={`Move line ${index + 1} down`}
                      size="sm"
                      disabled={isLast}
                      onClick={() => onMoveItem(item.id, 1)}
                    >
                      <ArrowDownIcon size={14} />
                    </IconButton>
                    <IconButton
                      label={`${t.actions.removeItem} ${index + 1}`}
                      variant="danger"
                      size="sm"
                      disabled={items.length === 1 && !item.description && !item.unitPrice}
                      onClick={() => onRemoveItem(item.id)}
                    >
                      <TrashIcon size={14} />
                    </IconButton>
                  </div>
                </div>

                <TextField
                  label={t.fields.description}
                  id={`desc-sm-${item.id}`}
                  value={item.description}
                  placeholder="Service or product"
                  maxLength={400}
                  onChange={(event) => onUpdateItem(item.id, { description: event.target.value })}
                />

                <div className="grid grid-cols-2 gap-3">
                  <TextField
                    label={t.fields.quantity}
                    numeric
                    inputMode="decimal"
                    value={item.quantity}
                    placeholder="1"
                    maxLength={10}
                    onChange={(event) => onUpdateItem(item.id, { quantity: event.target.value })}
                  />
                  <TextField
                    label={t.fields.unitPrice}
                    numeric
                    inputMode="decimal"
                    value={item.unitPrice}
                    placeholder="0.00"
                    maxLength={16}
                    onChange={(event) => onUpdateItem(item.id, { unitPrice: event.target.value })}
                  />
                </div>

                {showDiscount || showTax ? (
                  <div className="grid grid-cols-2 gap-3">
                    {showDiscount ? (
                      <AdjustmentInput
                        label={t.fields.discount}
                        adjustment={item.discount}
                        currencyCode={currency}
                        onChange={(discount) => onUpdateItem(item.id, { discount })}
                      />
                    ) : null}
                    {showTax ? (
                      <AdjustmentInput
                        label={t.fields.tax}
                        adjustment={item.tax}
                        currencyCode={currency}
                        onChange={(tax) => onUpdateItem(item.id, { tax })}
                      />
                    ) : null}
                  </div>
                ) : null}

                <FieldShell label={t.fields.amount} htmlFor={`amount-${item.id}`}>
                  <output
                    id={`amount-${item.id}`}
                    className="tabular flex h-11 items-center justify-end rounded-md border border-line bg-surface px-2.5 text-base font-medium sm:h-9 sm:text-sm"
                  >
                    {amount}
                  </output>
                </FieldShell>
              </div>
            </li>
          );
        })}
      </ul>

      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        <Button
          variant="secondary"
          size="sm"
          onClick={addItem}
          iconLeft={<PlusIcon size={14} />}
        >
          {t.actions.addItem}
        </Button>
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
          <Toggle
            label="Tax per line"
            checked={showTax}
            onChange={(next) => onToggleOption({ perItemTax: next })}
          />
          <Toggle
            label="Discount per line"
            checked={showDiscount}
            onChange={(next) => onToggleOption({ perItemDiscount: next })}
          />
        </div>
      </div>

      {columnCount > 3 ? (
        <p className="text-[11px] leading-snug text-ink-subtle">
          Per-line rates appear as their own column on the invoice.
        </p>
      ) : null}
    </Panel>
  );
}
