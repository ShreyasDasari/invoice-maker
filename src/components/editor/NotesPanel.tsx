'use client';

import { TextAreaField } from '@/components/ui/Field';
import type { Invoice } from '@/lib/invoice';
import { t } from '@/lib/i18n';
import { Panel } from './Panel';

/** Free text: payment instructions, thanks, terms. */
export function NotesPanel({
  invoice,
  onPatch,
}: {
  invoice: Invoice;
  onPatch: (patch: Partial<Invoice>) => void;
}) {
  return (
    <Panel title={t.sections.notes}>
      <TextAreaField
        label={t.fields.notes}
        value={invoice.notes}
        placeholder="Bank details, payment instructions, thank you…"
        rows={3}
        maxLength={1200}
        onChange={(event) => onPatch({ notes: event.target.value })}
      />
      <TextAreaField
        label={t.fields.terms}
        value={invoice.terms}
        placeholder="Late payments are subject to a 2% monthly charge."
        rows={2}
        maxLength={1200}
        onChange={(event) => onPatch({ terms: event.target.value })}
      />
    </Panel>
  );
}
