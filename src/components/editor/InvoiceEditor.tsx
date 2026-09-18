'use client';

/**
 * The editor.
 *
 * Wide screens get inputs on the left and the live invoice on the right, both
 * scrolling independently. Phones get one column and a two-way switch between
 * Edit and Preview — not the desktop layout squeezed, which would make the
 * preview unreadable and the inputs cramped.
 */

import { useCallback, useState } from 'react';
import { EditorSkeleton, PreviewSkeleton } from '@/components/ui/Skeleton';
import { Button } from '@/components/ui/Button';
import { CheckIcon, EyeIcon, PencilIcon, PlusIcon } from '@/components/ui/Icons';
import { InvoicePreview } from '@/components/preview/InvoicePreview';
import { FitToPageMeasurer } from '@/components/preview/FitToPageMeasurer';
import { PrintSheet } from '@/components/preview/PrintSheet';
import { useInvoiceStore } from '@/state/invoice-store';
import { useToast } from '@/components/ui/Toast';
import { t } from '@/lib/i18n';
import { BusinessDetails, CustomerDetails } from './PartyDetails';
import { InvoiceDetails } from './InvoiceDetails';
import { LineItems } from './LineItems';
import { TotalsPanel } from './TotalsPanel';
import { NotesPanel } from './NotesPanel';
import { DesignPanel } from './DesignPanel';
import { ActionBar } from './ActionBar';
import { useInvoiceActions } from './useInvoiceActions';
import { useKeyboardShortcuts } from './useKeyboardShortcuts';

type MobileTab = 'edit' | 'preview';

export function InvoiceEditor() {
  const store = useInvoiceStore();
  const toast = useToast();
  const [tab, setTab] = useState<MobileTab>('edit');
  const { invoice, totals, ready } = store;

  // While the saved draft is being read, hold the layout with skeletons so
  // nothing jumps when the real invoice arrives.
  if (!ready || !invoice || !totals) {
    return (
      <div className="mx-auto grid w-full max-w-[1600px] gap-10 px-4 py-6 sm:px-6 lg:grid-cols-2 lg:gap-12 lg:py-8">
        <EditorSkeleton />
        <div className="hidden lg:block">
          <PreviewSkeleton />
        </div>
      </div>
    );
  }

  return (
    <EditorBody
      tab={tab}
      setTab={setTab}
      store={store}
      toastSuccess={toast.success}
      invoice={invoice}
      totals={totals}
    />
  );
}

/**
 * Split out so the hooks below run only once the invoice exists, rather than
 * being guarded by conditionals inside a single component.
 */
function EditorBody({
  tab,
  setTab,
  store,
  toastSuccess,
  invoice,
  totals,
}: {
  tab: MobileTab;
  setTab: (tab: MobileTab) => void;
  store: ReturnType<typeof useInvoiceStore>;
  toastSuccess: (message: string) => void;
  invoice: NonNullable<ReturnType<typeof useInvoiceStore>['invoice']>;
  totals: NonNullable<ReturnType<typeof useInvoiceStore>['totals']>;
}) {
  const { dispatch, issues, locale, dateStyle, canPersist, profile, commitToRecent, newInvoice } =
    store;

  /**
   * How far the document must shrink to fit one page, measured off a hidden
   * copy of the sheet. Held here so the preview and the PDF scale by the same
   * amount, which is what keeps the download matching what is on screen.
   */
  const [fitScale, setFitScale] = useState(1);

  const actions = useInvoiceActions({
    invoice,
    totals,
    locale,
    dateStyle,
    fitScale,
    onCommit: commitToRecent,
  });

  const saveNow = useCallback(() => {
    commitToRecent();
    toastSuccess(canPersist ? t.toast.savedLocally : t.errors.storageUnavailable);
  }, [canPersist, commitToRecent, toastSuccess]);

  useKeyboardShortcuts({ onDownload: actions.download, onSave: saveNow });

  const profileMatches =
    Boolean(profile) && profile?.name.trim() === invoice.business.name.trim();

  return (
    <>
      {/* Mobile switch between the form and the document. */}
      <div className="no-print glass-bar sticky top-[var(--header-height)] z-30 border-b border-line/70 lg:hidden">
        <div
          className="mx-auto flex max-w-[1600px] gap-1 px-4 py-2"
          role="tablist"
          aria-label="Editor view"
        >
          {(
            [
              { id: 'edit' as const, label: 'Edit', Icon: PencilIcon },
              { id: 'preview' as const, label: 'Preview', Icon: EyeIcon },
            ]
          ).map(({ id, label, Icon }) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={tab === id}
              onClick={() => setTab(id)}
              className={`flex h-10 flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-md text-[13px] font-medium transition-colors duration-150 ease-[var(--ease-out-quick)] ${
                tab === id
                  ? 'bg-primary text-primary-ink'
                  : 'bg-raised text-ink-muted hover:text-ink'
              }`}
            >
              <Icon size={14} />
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="mx-auto grid w-full max-w-[1600px] items-start gap-10 px-4 pb-32 pt-5 sm:px-6 lg:grid-cols-2 lg:gap-12 lg:pb-16 lg:pt-7">
        {/* Inputs */}
        <div
          role="tabpanel"
          aria-label="Invoice details"
          className={`no-print min-w-0 flex-col gap-6 ${tab === 'edit' ? 'flex' : 'hidden'} lg:flex`}
        >
          <BusinessDetails
            business={invoice.business}
            issues={issues}
            canPersist={canPersist}
            savedProfile={profileMatches}
            onPatch={(patch) => dispatch({ type: 'patchBusiness', patch })}
            onSaveProfile={() => {
              store.saveBusinessProfile();
              toastSuccess(t.toast.profileSaved);
            }}
          />

          <CustomerDetails
            customer={invoice.customer}
            issues={issues}
            onPatch={(patch) => dispatch({ type: 'patchCustomer', patch })}
          />

          <InvoiceDetails
            invoice={invoice}
            issues={issues}
            onPatch={(patch) => dispatch({ type: 'patch', patch })}
          />

          <LineItems
            invoice={invoice}
            totals={totals}
            locale={locale}
            onAddItem={() => dispatch({ type: 'addItem' })}
            onUpdateItem={(id, patch) => dispatch({ type: 'updateItem', id, patch })}
            onRemoveItem={(id) => dispatch({ type: 'removeItem', id })}
            onMoveItem={(id, direction) => dispatch({ type: 'moveItem', id, direction })}
            onToggleOption={(patch) => dispatch({ type: 'patchOptions', patch })}
          />

          <TotalsPanel
            invoice={invoice}
            totals={totals}
            locale={locale}
            onPatch={(patch) => dispatch({ type: 'patch', patch })}
            onToggleOption={(patch) => dispatch({ type: 'patchOptions', patch })}
            onSharedTaxChange={(tax) => dispatch({ type: 'setSharedTax', tax })}
          />

          <NotesPanel invoice={invoice} onPatch={(patch) => dispatch({ type: 'patch', patch })} />

          <DesignPanel
            invoice={invoice}
            fitScale={fitScale}
            onPatch={(patch) => dispatch({ type: 'patch', patch })}
            onPatchBranding={(patch) => dispatch({ type: 'patchBranding', patch })}
            onToggleOption={(patch) => dispatch({ type: 'patchOptions', patch })}
          />

          <div className="flex items-center justify-between gap-3 border-t border-line pt-5">
            <Button
              variant="ghost"
              size="sm"
              iconLeft={<PlusIcon size={14} />}
              onClick={newInvoice}
            >
              {t.actions.newInvoice}
            </Button>
            {canPersist ? (
              <span className="flex items-center gap-1.5 text-[11px] text-ink-subtle">
                <CheckIcon size={12} className="text-success" />
                {t.toast.savedLocally}
              </span>
            ) : null}
          </div>
        </div>

        {/* Preview */}
        <div
          role="tabpanel"
          aria-label="Invoice preview"
          className={`min-w-0 ${tab === 'preview' ? 'block' : 'hidden'} lg:sticky lg:top-[calc(var(--header-height)+1.75rem)] lg:block`}
        >
          <div className="no-print mb-3 hidden items-center justify-between gap-3 lg:flex">
            <span className="text-[11px] font-semibold uppercase tracking-[0.09em] text-ink-subtle">
              Preview
            </span>
            <ActionBar
              variant="inline"
              onDownload={actions.download}
              onPrint={actions.print}
              onCopyLink={actions.copyLink}
              onShareNative={actions.shareNative}
              downloading={actions.downloading}
              sharing={actions.sharing}
              canShareNative={actions.canShareNative}
            />
          </div>

          <div className="lg:max-h-[calc(100dvh-var(--header-height)-6rem)] lg:overflow-y-auto lg:pr-1">
            <InvoicePreview
              invoice={invoice}
              totals={totals}
              locale={locale}
              dateStyle={dateStyle}
              fitScale={fitScale}
            />
          </div>

          <p className="no-print mt-3 text-center text-[11px] text-ink-subtle lg:text-left">
            {t.privacy.localOnly}
          </p>
        </div>
      </div>

      {/* The copy that prints: a direct child of <body>, so no collapsed tab
          panel or scrolling container can hide or clip it. */}
      <PrintSheet
        invoice={invoice}
        totals={totals}
        locale={locale}
        dateStyle={dateStyle}
        fitScale={fitScale}
      />

      {/* Measured only while the option is on, so nothing is laid out twice
          for the invoices that do not need it. */}
      {invoice.options.fitToPage ? (
        <FitToPageMeasurer
          invoice={invoice}
          totals={totals}
          locale={locale}
          dateStyle={dateStyle}
          onScale={setFitScale}
        />
      ) : null}

      <ActionBar
        variant="fixed"
        onDownload={actions.download}
        onPrint={actions.print}
        onCopyLink={actions.copyLink}
        onShareNative={actions.shareNative}
        downloading={actions.downloading}
        sharing={actions.sharing}
        canShareNative={actions.canShareNative}
      />
    </>
  );
}
