'use client';

/**
 * "From" and "Bill to".
 *
 * One component for both parties: the fields are near-identical, and a shared
 * implementation means an improvement to one is an improvement to both. What
 * differs (the logo, the shipping address, saving a profile) is passed in.
 */

import { useState } from 'react';
import { TextAreaField, TextField } from '@/components/ui/Field';
import { Button } from '@/components/ui/Button';
import { CheckIcon, PlusIcon } from '@/components/ui/Icons';
import type { BusinessParty, CustomerParty } from '@/lib/invoice';
import { issueFor, type Issue } from '@/lib/validation';
import { t } from '@/lib/i18n';
import { Panel } from './Panel';
import { LogoUploader } from './LogoUploader';

interface BusinessProps {
  business: BusinessParty;
  issues: readonly Issue[];
  canPersist: boolean;
  savedProfile: boolean;
  onPatch: (patch: Partial<BusinessParty>) => void;
  onSaveProfile: () => void;
}

export function BusinessDetails({
  business,
  issues,
  canPersist,
  savedProfile,
  onPatch,
  onSaveProfile,
}: BusinessProps) {
  // Validation waits for blur: flagging an email as invalid on the third
  // keystroke is noise, not help.
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const errorFor = (field: string) =>
    touched[field] ? issueFor(issues, field)?.message : undefined;
  const markTouched = (field: string) => setTouched((prev) => ({ ...prev, [field]: true }));
  const [extras, setExtras] = useState(
    Boolean(business.website.trim() || business.taxId.trim() || business.phone.trim()),
  );

  return (
    <Panel
      title={t.sections.from}
      action={
        canPersist ? (
          <Button
            size="sm"
            variant="ghost"
            onClick={onSaveProfile}
            iconLeft={savedProfile ? <CheckIcon size={13} /> : undefined}
            disabled={!business.name.trim()}
            title={
              business.name.trim()
                ? 'Keep these details on this device for your next invoice'
                : 'Add a business name first'
            }
          >
            {savedProfile ? t.actions.savedProfile : t.actions.saveProfile}
          </Button>
        ) : undefined
      }
    >
      <LogoUploader
        logo={business.logo}
        businessName={business.name}
        onChange={(logo) => onPatch({ logo })}
      />

      <TextField
        label={t.fields.businessName}
        value={business.name}
        placeholder="Your Business"
        autoComplete="organization"
        maxLength={120}
        onChange={(event) => onPatch({ name: event.target.value })}
      />

      <TextAreaField
        label={t.fields.address}
        value={business.address}
        placeholder={'123 Street\nCity, State 00000'}
        autoComplete="street-address"
        rows={3}
        maxLength={400}
        onChange={(event) => onPatch({ address: event.target.value })}
      />

      <TextField
        label={t.fields.email}
        type="email"
        inputMode="email"
        autoComplete="email"
        value={business.email}
        placeholder="you@business.com"
        maxLength={160}
        error={errorFor('business.email')}
        onBlur={() => markTouched('business.email')}
        onChange={(event) => onPatch({ email: event.target.value })}
      />

      {extras ? (
        <>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <TextField
              label={t.fields.phone}
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              value={business.phone}
              placeholder="+1 555 000 0000"
              maxLength={40}
              onChange={(event) => onPatch({ phone: event.target.value })}
            />
            <TextField
              label={t.fields.website}
              type="url"
              inputMode="url"
              autoComplete="url"
              value={business.website}
              placeholder="business.com"
              maxLength={120}
              onChange={(event) => onPatch({ website: event.target.value })}
            />
          </div>
          <div className="grid grid-cols-[minmax(0,7rem)_1fr] gap-3">
            <TextField
              label="Label"
              value={business.taxIdLabel}
              placeholder="VAT No."
              maxLength={24}
              hint="VAT, GST, ABN…"
              onChange={(event) => onPatch({ taxIdLabel: event.target.value })}
            />
            <TextField
              label={t.fields.taxId}
              value={business.taxId}
              placeholder="Registration number"
              maxLength={60}
              onChange={(event) => onPatch({ taxId: event.target.value })}
            />
          </div>
        </>
      ) : (
        <Button
          size="sm"
          variant="ghost"
          className="self-start"
          iconLeft={<PlusIcon size={13} />}
          onClick={() => setExtras(true)}
        >
          Phone, website, tax ID
        </Button>
      )}
    </Panel>
  );
}

interface CustomerProps {
  customer: CustomerParty;
  issues: readonly Issue[];
  onPatch: (patch: Partial<CustomerParty>) => void;
}

export function CustomerDetails({ customer, issues, onPatch }: CustomerProps) {
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const errorFor = (field: string) =>
    touched[field] ? issueFor(issues, field)?.message : undefined;
  const [extras, setExtras] = useState(
    Boolean(customer.phone.trim() || customer.taxId.trim() || customer.shippingAddress.trim()),
  );

  return (
    <Panel title={t.sections.to}>
      <TextField
        label={t.fields.customerName}
        value={customer.name}
        placeholder="Customer Name"
        maxLength={120}
        onChange={(event) => onPatch({ name: event.target.value })}
      />

      <TextAreaField
        label={t.fields.address}
        value={customer.address}
        placeholder="Client address"
        rows={3}
        maxLength={400}
        onChange={(event) => onPatch({ address: event.target.value })}
      />

      <TextField
        label={t.fields.email}
        type="email"
        inputMode="email"
        value={customer.email}
        placeholder="client@company.com"
        maxLength={160}
        error={errorFor('customer.email')}
        onBlur={() => setTouched((prev) => ({ ...prev, 'customer.email': true }))}
        onChange={(event) => onPatch({ email: event.target.value })}
      />

      {extras ? (
        <>
          <TextField
            label={t.fields.phone}
            type="tel"
            inputMode="tel"
            value={customer.phone}
            placeholder="+1 555 000 0000"
            maxLength={40}
            onChange={(event) => onPatch({ phone: event.target.value })}
          />
          <TextAreaField
            label={t.fields.shippingAddress}
            value={customer.shippingAddress}
            placeholder="Only if it differs from the billing address"
            rows={2}
            maxLength={400}
            onChange={(event) => onPatch({ shippingAddress: event.target.value })}
          />
          <div className="grid grid-cols-[minmax(0,7rem)_1fr] gap-3">
            <TextField
              label="Label"
              value={customer.taxIdLabel}
              placeholder="VAT No."
              maxLength={24}
              onChange={(event) => onPatch({ taxIdLabel: event.target.value })}
            />
            <TextField
              label={t.fields.taxId}
              value={customer.taxId}
              placeholder="Registration number"
              maxLength={60}
              onChange={(event) => onPatch({ taxId: event.target.value })}
            />
          </div>
        </>
      ) : (
        <Button
          size="sm"
          variant="ghost"
          className="self-start"
          iconLeft={<PlusIcon size={13} />}
          onClick={() => setExtras(true)}
        >
          Phone, shipping address, tax ID
        </Button>
      )}
    </Panel>
  );
}
