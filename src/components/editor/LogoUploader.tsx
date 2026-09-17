'use client';

import { useId, useRef, useState } from 'react';
import { ImageIcon, TrashIcon } from '@/components/ui/Icons';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { normaliseLogo, validateLogoFile } from '@/lib/validation';
import { t } from '@/lib/i18n';

/**
 * Logo upload.
 *
 * The file never leaves the browser. It is validated by type and size, then
 * redrawn through a canvas at print-appropriate size — so what ends up in the
 * PDF is pixels this browser rendered, with any metadata or malformed payload
 * in the original discarded.
 */
export function LogoUploader({
  logo,
  businessName,
  onChange,
}: {
  logo: string | null;
  businessName: string;
  onChange: (next: string | null) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const inputId = useId();
  const [busy, setBusy] = useState(false);
  const toast = useToast();

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    const problem = validateLogoFile(file);
    if (problem) {
      toast.error(problem);
      return;
    }
    setBusy(true);
    try {
      onChange(await normaliseLogo(file));
    } catch {
      toast.error(t.errors.logoFailed);
    } finally {
      setBusy(false);
      // Reset so picking the same file again still fires a change.
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <div className="flex items-center gap-3">
      <input
        ref={inputRef}
        id={inputId}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        // Visually hidden and opened by the button beside it, but it is still
        // a real control and needs a name of its own.
        aria-label="Business logo image file"
        className="sr-only"
        onChange={(event) => void handleFile(event.target.files?.[0])}
      />

      {logo ? (
        <div className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-md border border-line bg-white p-1.5">
          {/* eslint-disable-next-line @next/next/no-img-element -- a local data URL, nothing to optimise */}
          <img
            src={logo}
            alt={businessName.trim() ? `${businessName.trim()} logo` : 'Business logo'}
            className="max-h-full max-w-full object-contain"
          />
        </div>
      ) : (
        <div
          className="grid size-16 shrink-0 place-items-center rounded-md border border-dashed border-line-strong text-ink-subtle"
          aria-hidden="true"
        >
          <ImageIcon size={18} />
        </div>
      )}

      <div className="flex min-w-0 flex-col items-start gap-1.5">
        <Button
          size="sm"
          loading={busy}
          loadingLabel="Processing"
          onClick={() => inputRef.current?.click()}
          iconLeft={<ImageIcon size={14} />}
        >
          {logo ? 'Replace logo' : t.actions.uploadLogo}
        </Button>
        {logo ? (
          <Button size="sm" variant="danger" onClick={() => onChange(null)} iconLeft={<TrashIcon size={13} />}>
            {t.actions.removeLogo}
          </Button>
        ) : (
          <p className="text-[11px] leading-snug text-ink-subtle">PNG, JPG or WebP. Max 4 MB.</p>
        )}
      </div>
    </div>
  );
}
