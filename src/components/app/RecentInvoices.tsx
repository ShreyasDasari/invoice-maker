'use client';

/**
 * Recent invoices.
 *
 * The repeat-use path: open last month's invoice, duplicate it, change a date,
 * download. Everything listed here came from this browser, and deleting an
 * entry deletes it — with an Undo, because a mis-tap should not cost an invoice.
 */

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button, IconButton } from '@/components/ui/Button';
import { CopyIcon, FileTextIcon, PencilIcon, PlusIcon, TrashIcon } from '@/components/ui/Icons';
import { Skeleton } from '@/components/ui/Skeleton';
import { useToast } from '@/components/ui/Toast';
import { useInvoiceStore } from '@/state/invoice-store';
import { formatDate, formatMoney, relativeTime } from '@/lib/format';
import { parseDec } from '@/lib/money';
import type { RecentInvoice } from '@/lib/storage';
import { t } from '@/lib/i18n';

export function RecentInvoices() {
  const store = useInvoiceStore();
  const router = useRouter();
  const toast = useToast();
  const [deleted, setDeleted] = useState<RecentInvoice | null>(null);

  const { recent, ready, locale, dateStyle, openRecent, duplicate, newInvoice } = store;

  const handleOpen = useCallback(
    (id: string) => {
      openRecent(id);
      router.push('/');
    },
    [openRecent, router],
  );

  const handleDuplicate = useCallback(
    (entry: RecentInvoice) => {
      duplicate(entry.invoice);
      router.push('/');
    },
    [duplicate, router],
  );

  const handleDelete = useCallback(
    (entry: RecentInvoice) => {
      store.removeRecent(entry.id);
      setDeleted(entry);
      toast.success(t.toast.invoiceDeleted, {
        label: t.actions.undo,
        onClick: () => {
          store.restoreRecent(entry);
          setDeleted(null);
        },
      });
    },
    [store, toast],
  );

  if (!ready) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <Skeleton className="mb-6 h-6 w-40" />
        <div className="flex flex-col gap-2">
          {[0, 1, 2].map((row) => (
            <Skeleton key={row} className="h-[4.5rem] w-full" />
          ))}
        </div>
      </div>
    );
  }

  const visible = recent.filter((entry) => entry.id !== deleted?.id);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-ink">Recent invoices</h1>
          <p className="mt-0.5 text-[13px] text-ink-muted">
            {visible.length > 0 ? t.toast.savedLocally : t.privacy.localOnly}
          </p>
        </div>
        <Button variant="primary" onClick={() => { newInvoice(); router.push('/'); }} iconLeft={<PlusIcon size={15} />}>
          {t.actions.newInvoice}
        </Button>
      </div>

      {visible.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-md border border-dashed border-line py-16 text-center">
          <FileTextIcon size={22} className="text-ink-subtle" />
          <div>
            <p className="text-sm font-medium text-ink">{t.empty.recentTitle}</p>
            <p className="mt-0.5 text-[13px] text-ink-muted">{t.empty.recentBody}</p>
          </div>
          <Link
            href="/"
            className="mt-1 inline-flex h-9 items-center rounded-md bg-primary px-3.5 text-[13px] font-medium text-primary-ink transition-colors hover:bg-primary-hover"
          >
            {t.nav.create}
          </Link>
        </div>
      ) : (
        <ul className="flex flex-col divide-y divide-line rounded-md border border-line">
          {visible.map((entry) => (
            <li key={entry.id} className="flex items-center gap-3 p-3.5">
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline gap-2">
                  <span className="tabular truncate text-sm font-semibold text-ink">
                    {entry.invoiceNumber}
                  </span>
                  <span className="truncate text-[13px] text-ink-muted">
                    {entry.customerName.trim() || 'No customer'}
                  </span>
                </div>
                <p className="mt-0.5 text-[11px] text-ink-subtle">
                  {formatDate(entry.issueDate, dateStyle)} · {relativeTime(entry.updatedAt)}
                </p>
              </div>

              <span className="tabular shrink-0 text-sm font-medium text-ink">
                {formatMoney(parseDec(entry.total), entry.currency, locale)}
              </span>

              <div className="flex shrink-0 items-center gap-0.5">
                <IconButton label={`${t.actions.edit} ${entry.invoiceNumber}`} onClick={() => handleOpen(entry.id)}>
                  <PencilIcon size={15} />
                </IconButton>
                <IconButton
                  label={`${t.actions.duplicate} ${entry.invoiceNumber}`}
                  onClick={() => handleDuplicate(entry)}
                >
                  <CopyIcon size={15} />
                </IconButton>
                <IconButton
                  label={`${t.actions.delete} ${entry.invoiceNumber}`}
                  variant="danger"
                  onClick={() => handleDelete(entry)}
                >
                  <TrashIcon size={15} />
                </IconButton>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
