'use client';

/** Invoice number, dates, currency and terms. */

import { useState } from 'react';
import { SelectField, TextField } from '@/components/ui/Field';
import { Button } from '@/components/ui/Button';
import { PlusIcon } from '@/components/ui/Icons';
import type { Invoice } from '@/lib/invoice';
import { addDaysISO } from '@/lib/invoice';
import { issueFor, type Issue } from '@/lib/validation';
import { t } from '@/lib/i18n';
import { Panel } from './Panel';
import { CurrencySelect } from './CurrencySelect';

/** The terms people actually use, each with the day count it implies. */
const TERMS: { label: string; days: number | null }[] = [
  { label: 'Due on receipt', days: 0 },
  { label: 'Net 7', days: 7 },
  { label: 'Net 14', days: 14 },
  { label: 'Net 30', days: 30 },
  { label: 'Net 60', days: 60 },
  { label: 'Custom', days: null },
];

export function InvoiceDetails({
  invoice,
  issues,
  onPatch,
}: {
  invoice: Invoice;
  issues: readonly Issue[];
  onPatch: (patch: Partial<Invoice>) => void;
}) {
  const [showPo, setShowPo] = useState(Boolean(invoice.poNumber.trim()));
  const numberError = issueFor(issues, 'invoiceNumber')?.message;
  const issueDateError = issueFor(issues, 'issueDate')?.message;
  const dueDateIssue = issueFor(issues, 'dueDate');

  /**
   * Choosing terms moves the due date with it — that is the whole point of
   * terms — but a custom due date is never overwritten behind the user's back.
   */
  const applyTerms = (label: string) => {
    const match = TERMS.find((term) => term.label === label);
    if (!match || match.days === null) {
      onPatch({ paymentTerms: label === 'Custom' ? '' : label });
      return;
    }
    onPatch({ paymentTerms: label, dueDate: addDaysISO(invoice.issueDate, match.days) });
  };

  const termValue = TERMS.some((term) => term.label === invoice.paymentTerms)
    ? invoice.paymentTerms
    : 'Custom';

  return (
    <Panel title={t.sections.details}>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <TextField
          label={t.fields.invoiceNumber}
          value={invoice.invoiceNumber}
          required
          maxLength={40}
          error={numberError}
          hint="Counts up on your next invoice"
          onChange={(event) => onPatch({ invoiceNumber: event.target.value })}
        />
        <CurrencySelect value={invoice.currency} onChange={(currency) => onPatch({ currency })} />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <TextField
          label={t.fields.issueDate}
          type="date"
          value={invoice.issueDate}
          error={issueDateError}
          onChange={(event) => onPatch({ issueDate: event.target.value })}
        />
        <TextField
          label={t.fields.dueDate}
          type="date"
          value={invoice.dueDate}
          error={dueDateIssue?.level === 'error' ? dueDateIssue.message : undefined}
          hint={dueDateIssue?.level === 'warning' ? dueDateIssue.message : undefined}
          onChange={(event) => onPatch({ dueDate: event.target.value })}
        />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <SelectField
          label={t.fields.paymentTerms}
          value={termValue}
          onChange={(event) => applyTerms(event.target.value)}
        >
          {TERMS.map((term) => (
            <option key={term.label} value={term.label}>
              {term.label}
            </option>
          ))}
        </SelectField>

        {termValue === 'Custom' ? (
          <TextField
            label="Terms text"
            value={invoice.paymentTerms}
            placeholder="50% upfront, balance on delivery"
            maxLength={80}
            onChange={(event) => onPatch({ paymentTerms: event.target.value })}
          />
        ) : null}
      </div>

      {/* A purchase order number matters to some finance teams and to nobody
          else, so it stays folded away until asked for. */}
      {showPo ? (
        <TextField
          label={t.fields.poNumber}
          value={invoice.poNumber}
          placeholder="PO-12345"
          maxLength={40}
          className="sm:max-w-[calc(50%-0.375rem)]"
          onChange={(event) => onPatch({ poNumber: event.target.value })}
        />
      ) : (
        <Button
          size="sm"
          variant="ghost"
          className="self-start"
          iconLeft={<PlusIcon size={13} />}
          onClick={() => setShowPo(true)}
        >
          PO number
        </Button>
      )}
    </Panel>
  );
}
