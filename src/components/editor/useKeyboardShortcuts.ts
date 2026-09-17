'use client';

import { useEffect } from 'react';

/**
 * Keyboard shortcuts.
 *
 * Three, all of them conventional: Cmd/Ctrl+Enter downloads, Cmd/Ctrl+S saves,
 * Escape backs out. Nothing here is the only way to do anything — every one has
 * a visible button — so there is nothing to learn unless you want to.
 */
export function useKeyboardShortcuts({
  onDownload,
  onSave,
  onEscape,
}: {
  onDownload: () => void;
  onSave: () => void;
  onEscape?: () => void;
}) {
  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      const meta = event.metaKey || event.ctrlKey;

      if (meta && event.key === 'Enter') {
        event.preventDefault();
        onDownload();
        return;
      }

      // Cmd/Ctrl+S would otherwise offer to save the web page, which is never
      // what someone editing an invoice means by it.
      if (meta && (event.key === 's' || event.key === 'S')) {
        event.preventDefault();
        onSave();
        return;
      }

      if (event.key === 'Escape' && onEscape) onEscape();
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onDownload, onSave, onEscape]);
}
