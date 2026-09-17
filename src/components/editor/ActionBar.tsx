'use client';

/**
 * Download, print and share.
 *
 * Download PDF is the one primary action on the screen, and it is never more
 * than a glance away: inline above the preview on a wide screen, pinned to the
 * bottom of a phone where the thumb already is.
 */

import { useEffect, useRef, useState } from 'react';
import { Button, IconButton } from '@/components/ui/Button';
import {
  ChevronDownIcon,
  DownloadIcon,
  LinkIcon,
  PrinterIcon,
  ShareIcon,
} from '@/components/ui/Icons';
import { t } from '@/lib/i18n';

export interface ActionBarProps {
  onDownload: () => void;
  onPrint: () => void;
  onCopyLink: () => void;
  onShareNative: () => void;
  downloading: boolean;
  sharing: boolean;
  canShareNative: boolean;
  /** Pinned to the bottom of the viewport on small screens. */
  variant: 'inline' | 'fixed';
}

export function ActionBar({
  onDownload,
  onPrint,
  onCopyLink,
  onShareNative,
  downloading,
  sharing,
  canShareNative,
  variant,
}: ActionBarProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  /**
   * Escape closes the share menu.
   *
   * Bound to the document rather than the menu: focus stays on the trigger
   * when the menu opens, so a keydown handler on the menu itself would never
   * hear it.
   */
  useEffect(() => {
    if (!menuOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.stopPropagation();
        setMenuOpen(false);
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [menuOpen]);

  if (variant === 'fixed') {
    return (
      <div
        className="no-print fixed inset-x-0 bottom-0 z-40 border-t border-line bg-canvas/95 backdrop-blur-sm lg:hidden"
        // Keeps the bar clear of the home indicator and gesture area.
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="flex items-center gap-2 px-4 py-3">
          {/* flex-1, not full width: a w-full primary would push the two icon
              buttons past the right edge of the bar. */}
          <Button
            variant="primary"
            size="lg"
            className="min-w-0 flex-1"
            loading={downloading}
            loadingLabel={t.actions.downloading}
            onClick={onDownload}
            iconLeft={<DownloadIcon size={16} />}
          >
            {t.actions.download}
          </Button>
          <IconButton label={t.actions.print} variant="secondary" onClick={onPrint}>
            <PrinterIcon size={16} />
          </IconButton>
          <IconButton
            label={t.actions.share}
            variant="secondary"
            disabled={sharing}
            onClick={canShareNative ? onShareNative : onCopyLink}
          >
            <ShareIcon size={16} />
          </IconButton>
        </div>
      </div>
    );
  }

  return (
    <div className="no-print flex items-center gap-2">
      <Button
        variant="primary"
        loading={downloading}
        loadingLabel={t.actions.downloading}
        onClick={onDownload}
        iconLeft={<DownloadIcon size={15} />}
      >
        {t.actions.download}
      </Button>

      <Button onClick={onPrint} iconLeft={<PrinterIcon size={15} />}>
        {t.actions.print}
      </Button>

      <div className="relative">
        <Button
          onClick={() => setMenuOpen((open) => !open)}
          aria-expanded={menuOpen}
          aria-haspopup="menu"
          iconLeft={<ShareIcon size={15} />}
          iconRight={<ChevronDownIcon size={13} />}
          disabled={sharing}
        >
          {t.actions.share}
        </Button>

        {menuOpen ? (
          <>
            {/* A click anywhere else closes the menu; Escape does too. */}
            <button
              type="button"
              aria-label={t.actions.close}
              className="fixed inset-0 z-40 cursor-default"
              onClick={() => setMenuOpen(false)}
            />
            <div
              ref={menuRef}
              role="menu"
              className="absolute right-0 top-full z-50 mt-1 w-56 overflow-hidden rounded-md border border-line bg-raised shadow-[var(--shadow-pop)] motion-safe:animate-[toast-in_150ms_var(--ease-out-quick)]"
            >
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setMenuOpen(false);
                  onCopyLink();
                }}
                className="flex w-full cursor-pointer items-center gap-2.5 px-3 py-2.5 text-left text-[13px] transition-colors hover:bg-surface"
              >
                <LinkIcon size={15} className="shrink-0 text-ink-subtle" />
                <span className="flex flex-col">
                  <span className="font-medium">{t.actions.copyLink}</span>
                  <span className="text-[11px] text-ink-subtle">
                    The invoice travels inside the link
                  </span>
                </span>
              </button>

              {canShareNative ? (
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setMenuOpen(false);
                    onShareNative();
                  }}
                  className="flex w-full cursor-pointer items-center gap-2.5 border-t border-line px-3 py-2.5 text-left text-[13px] transition-colors hover:bg-surface"
                >
                  <ShareIcon size={15} className="shrink-0 text-ink-subtle" />
                  <span className="font-medium">Share the PDF</span>
                </button>
              ) : null}
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
