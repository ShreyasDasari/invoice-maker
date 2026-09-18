'use client';

/**
 * The editor's single source of truth.
 *
 * A reducer over one `Invoice`, plus the side effects that make the tool feel
 * like it remembers you: a debounced autosave of the draft, recall of the
 * saved business profile and preferences, and hydration from a share link.
 *
 * The invoice starts as `null` and is filled in after mount. That is
 * deliberate: today's date and any saved draft only exist in the browser, so
 * rendering them on the server would either mismatch on hydration or show a
 * stranger's timezone. The editor shows a skeleton for that first frame.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import {
  type Adjustment,
  type Branding,
  type BusinessParty,
  type CustomerParty,
  type Invoice,
  type LineItem,
  createInvoice,
  createLineItem,
  todayISO,
  addDaysISO,
  TEMPLATE_IDS,
} from '@/lib/invoice';
import { isValidHex, safeHex } from '@/lib/templates';
import { FONT_CHOICES } from '@/lib/fonts';
import { computeTotals, type InvoiceTotals } from '@/lib/calc';
import { toFixed } from '@/lib/money';
import { currencyDecimals } from '@/lib/currency';
import { dateStyleForLocale, type DateFormatId } from '@/lib/format';
import { nextFromHistory } from '@/lib/numbering';
import {
  type Preferences,
  type RecentInvoice,
  loadDraft,
  loadPreferences,
  loadProfile,
  loadRecent,
  restoreLogo,
  saveDraft,
  savePreferences,
  saveProfile,
  saveRecent,
  storageAvailable,
  deleteRecent,
} from '@/lib/storage';
import { decodeInvoice, tokenFromHash } from '@/lib/share';
import { validateInvoice, type Issue } from '@/lib/validation';
import { track } from '@/lib/analytics';

/** How long after the last keystroke the draft is written. */
const AUTOSAVE_DELAY_MS = 500;

type Action =
  | { type: 'replace'; invoice: Invoice }
  | { type: 'patch'; patch: Partial<Invoice> }
  | { type: 'patchBusiness'; patch: Partial<BusinessParty> }
  | { type: 'patchCustomer'; patch: Partial<CustomerParty> }
  | { type: 'patchBranding'; patch: Partial<Branding> }
  | { type: 'patchOptions'; patch: Partial<Invoice['options']> }
  | { type: 'addItem' }
  | { type: 'updateItem'; id: string; patch: Partial<LineItem> }
  | { type: 'removeItem'; id: string }
  | { type: 'moveItem'; id: string; direction: -1 | 1 }
  | { type: 'setSharedTax'; tax: Adjustment }
  | { type: 'setIssueDate'; date: string; dueInDays: number };

function touch(invoice: Invoice): Invoice {
  return { ...invoice, updatedAt: new Date().toISOString() };
}

export function invoiceReducer(state: Invoice, action: Action): Invoice {
  switch (action.type) {
    case 'replace':
      return action.invoice;

    case 'patch':
      return touch({ ...state, ...action.patch });

    case 'patchBusiness':
      return touch({ ...state, business: { ...state.business, ...action.patch } });

    case 'patchCustomer':
      return touch({ ...state, customer: { ...state.customer, ...action.patch } });

    case 'patchBranding':
      return touch({ ...state, branding: { ...state.branding, ...action.patch } });

    case 'patchOptions':
      return touch({ ...state, options: { ...state.options, ...action.patch } });

    case 'addItem': {
      // A new line inherits the shared tax rate so totals stay consistent.
      const shared = state.options.perItemTax ? undefined : state.items[0]?.tax;
      const item = createLineItem(shared ? { tax: { ...shared } } : {});
      return touch({ ...state, items: [...state.items, item] });
    }

    case 'updateItem':
      return touch({
        ...state,
        items: state.items.map((item) =>
          item.id === action.id ? { ...item, ...action.patch } : item,
        ),
      });

    case 'removeItem': {
      const remaining = state.items.filter((item) => item.id !== action.id);
      // Never leave the table empty; an invoice always has at least one line.
      return touch({
        ...state,
        items: remaining.length > 0 ? remaining : [createLineItem()],
      });
    }

    case 'moveItem': {
      const index = state.items.findIndex((item) => item.id === action.id);
      const target = index + action.direction;
      if (index < 0 || target < 0 || target >= state.items.length) return state;
      const items = [...state.items];
      const moved = items[index]!;
      items[index] = items[target]!;
      items[target] = moved;
      return touch({ ...state, items });
    }

    case 'setSharedTax':
      // One rate for the whole invoice: mirrored onto every line so the calc
      // engine has a single rule for both modes.
      return touch({
        ...state,
        items: state.items.map((item) => ({ ...item, tax: { ...action.tax } })),
      });

    case 'setIssueDate':
      return touch({
        ...state,
        issueDate: action.date,
        dueDate: addDaysISO(action.date, action.dueInDays),
      });

    default:
      return state;
  }
}

export interface InvoiceStore {
  /** Null until the browser has had a chance to restore a draft. */
  invoice: Invoice | null;
  ready: boolean;
  totals: InvoiceTotals | null;
  issues: Issue[];
  locale: string;
  dateStyle: DateFormatId;
  recent: RecentInvoice[];
  profile: BusinessParty | null;
  /** False in private modes, so the UI can stop promising to remember. */
  canPersist: boolean;
  /** True briefly after the draft is written, for the saved indicator. */
  savedAt: string | null;
  /** Set when an invoice was opened from a share link. */
  fromSharedLink: boolean;

  dispatch: (action: Action) => void;
  setInvoice: (invoice: Invoice) => void;
  newInvoice: () => void;
  duplicate: (source: Invoice) => void;
  openRecent: (id: string) => void;
  removeRecent: (id: string) => void;
  /** Puts a deleted entry back, for Undo. */
  restoreRecent: (entry: RecentInvoice) => void;
  commitToRecent: () => void;
  saveBusinessProfile: () => void;
  applyProfile: () => void;
  setDateStyle: (style: DateFormatId) => void;
}

const StoreContext = createContext<InvoiceStore | null>(null);

/** Preferences worth carrying from one invoice to the next. */
function preferencesFrom(invoice: Invoice, dueInDays: number): Partial<Preferences> {
  return {
    currency: invoice.currency,
    template: invoice.template,
    paperSize: invoice.paperSize,
    accentColor: invoice.branding.accentColor,
    fontStyle: invoice.branding.fontStyle,
    lastInvoiceNumber: invoice.invoiceNumber,
    dueInDays,
  };
}

export function InvoiceStoreProvider({ children }: { children: ReactNode }) {
  // A throwaway seed: real state arrives from the effect below, but the
  // reducer needs a non-null value to be typed simply.
  const [invoice, dispatch] = useReducer(invoiceReducer, null as unknown as Invoice);
  const [ready, setReady] = useState(false);
  const [locale, setLocale] = useState('en-US');
  const [dateStyle, setDateStyleState] = useState<DateFormatId>('iso');
  const [recent, setRecent] = useState<RecentInvoice[]>([]);
  const [profile, setProfile] = useState<BusinessParty | null>(null);
  const [canPersist, setCanPersist] = useState(true);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [fromSharedLink, setFromSharedLink] = useState(false);
  const dueInDaysRef = useRef(7);

  // --- One-time hydration from the browser --------------------------------
  useEffect(() => {
    let cancelled = false;

    async function hydrate() {
      const persists = storageAvailable();
      const prefs = loadPreferences() ?? {};
      const savedProfile = loadProfile();
      const savedRecent = loadRecent();

      const detectedLocale =
        prefs.locale || (typeof navigator !== 'undefined' ? navigator.language : 'en-US') || 'en-US';
      const detectedStyle = prefs.dateStyle ?? dateStyleForLocale(detectedLocale);
      dueInDaysRef.current = prefs.dueInDays ?? 7;

      // A share link always wins: the recipient asked to see that invoice.
      const token = typeof window !== 'undefined' ? tokenFromHash(window.location.hash) : null;
      let restored: Invoice | null = null;
      let shared = false;

      if (token) {
        const decoded = await decodeInvoice(token);
        if (decoded) {
          restored = decoded;
          shared = true;
          // Drop the payload from the address bar so a refresh is not a reload
          // of someone else's invoice, and the URL is not accidentally reshared.
          window.history.replaceState(null, '', window.location.pathname);
        }
      }

      if (!restored) restored = loadDraft();

      if (!restored) {
        const usedNumbers = savedRecent.map((entry) => entry.invoiceNumber);
        restored = createInvoice({
          today: todayISO(),
          currency: prefs.currency,
          dueInDays: dueInDaysRef.current,
          invoiceNumber: prefs.lastInvoiceNumber
            ? nextFromHistory([prefs.lastInvoiceNumber, ...usedNumbers])
            : nextFromHistory(usedNumbers),
        });
        if (prefs.template) restored.template = prefs.template;
        if (prefs.paperSize) restored.paperSize = prefs.paperSize;
        if (prefs.accentColor) restored.branding.accentColor = prefs.accentColor;
        if (prefs.fontStyle) restored.branding.fontStyle = prefs.fontStyle;
        if (savedProfile) restored.business = { ...savedProfile };
        track('invoice_created');
      }

      restored = restoreLogo(restored, savedProfile);

      /*
       * A design chosen on the templates page arrives as query parameters.
       * It only ever touches the look of the invoice — never its contents — so
       * arriving from the gallery restyles the draft rather than replacing it.
       */
      if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search);
        const template = params.get('template');
        const accent = params.get('accent');
        const font = params.get('font');

        if (template && (TEMPLATE_IDS as readonly string[]).includes(template)) {
          restored = { ...restored, template: template as Invoice['template'] };
        }
        if (accent && isValidHex(accent)) {
          restored = {
            ...restored,
            branding: { ...restored.branding, accentColor: safeHex(accent) },
          };
        }
        if (font && FONT_CHOICES.some((choice) => choice.id === font)) {
          restored = {
            ...restored,
            branding: { ...restored.branding, fontStyle: font as Invoice['branding']['fontStyle'] },
          };
        }

        // Clear them so a refresh does not re-apply a choice the user has since
        // changed in the editor.
        if (template || accent || font) {
          window.history.replaceState(null, '', window.location.pathname);
        }
      }

      if (cancelled) return;
      setCanPersist(persists);
      setLocale(detectedLocale);
      setDateStyleState(detectedStyle);
      setProfile(savedProfile);
      setRecent(savedRecent);
      setFromSharedLink(shared);
      dispatch({ type: 'replace', invoice: restored });
      setReady(true);
    }

    void hydrate();
    return () => {
      cancelled = true;
    };
  }, []);

  // --- Debounced autosave --------------------------------------------------
  useEffect(() => {
    if (!ready || !invoice) return;
    const handle = window.setTimeout(() => {
      saveDraft(invoice);
      savePreferences(preferencesFrom(invoice, dueInDaysRef.current));
      setSavedAt(new Date().toISOString());
    }, AUTOSAVE_DELAY_MS);
    return () => window.clearTimeout(handle);
  }, [invoice, ready]);

  const totals = useMemo(() => (invoice ? computeTotals(invoice) : null), [invoice]);
  const issues = useMemo(() => (invoice ? validateInvoice(invoice) : []), [invoice]);

  const setInvoice = useCallback((next: Invoice) => {
    dispatch({ type: 'replace', invoice: next });
  }, []);

  /**
   * Hand an invoice to the editor.
   *
   * The store is mounted per route, so an invoice chosen on /recent would be
   * discarded the moment we navigate to the editor. Writing it to the draft
   * synchronously is what makes it survive: the editor hydrates from there.
   */
  const handOff = useCallback((next: Invoice) => {
    saveDraft(next);
    dispatch({ type: 'replace', invoice: next });
    setFromSharedLink(false);
  }, []);

  const newInvoice = useCallback(() => {
    const used = recent.map((entry) => entry.invoiceNumber);
    const next = createInvoice({
      today: todayISO(),
      currency: invoice?.currency,
      dueInDays: dueInDaysRef.current,
      invoiceNumber: nextFromHistory(invoice ? [invoice.invoiceNumber, ...used] : used),
    });
    if (invoice) {
      next.template = invoice.template;
      next.paperSize = invoice.paperSize;
      next.branding = { ...invoice.branding };
      next.business = { ...invoice.business };
    } else if (profile) {
      next.business = { ...profile };
    }
    handOff(next);
    track('invoice_created');
  }, [handOff, invoice, profile, recent]);

  const duplicate = useCallback(
    (source: Invoice) => {
      const used = recent.map((entry) => entry.invoiceNumber);
      const today = todayISO();
      const next: Invoice = {
        ...source,
        id: createInvoice().id,
        invoiceNumber: nextFromHistory([source.invoiceNumber, ...used]),
        issueDate: today,
        dueDate: addDaysISO(today, dueInDaysRef.current),
        items: source.items.map((item) => ({ ...createLineItem(), ...item, id: createLineItem().id })),
        amountPaid: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      handOff(restoreLogo(next, profile));
      track('invoice_duplicated');
    },
    [handOff, profile, recent],
  );

  const openRecent = useCallback(
    (id: string) => {
      const entry = recent.find((item) => item.id === id);
      if (!entry) return;
      handOff(restoreLogo(entry.invoice, profile));
    },
    [handOff, profile, recent],
  );

  const removeRecent = useCallback((id: string) => {
    setRecent(deleteRecent(id));
  }, []);

  const restoreRecent = useCallback((entry: RecentInvoice) => {
    setRecent(saveRecent(entry.invoice, entry.total));
  }, []);

  /** Record the invoice as finished — called when it is downloaded or printed. */
  const commitToRecent = useCallback(() => {
    if (!invoice || !totals) return;
    const total = toFixed(totals.total, currencyDecimals(invoice.currency));
    setRecent(saveRecent(invoice, total));
  }, [invoice, totals]);

  const saveBusinessProfile = useCallback(() => {
    if (!invoice) return;
    saveProfile(invoice.business);
    setProfile({ ...invoice.business });
    track('profile_saved');
  }, [invoice]);

  const applyProfile = useCallback(() => {
    if (!profile) return;
    dispatch({ type: 'patchBusiness', patch: { ...profile } });
  }, [profile]);

  const setDateStyle = useCallback((style: DateFormatId) => {
    setDateStyleState(style);
    savePreferences({ dateStyle: style });
  }, []);

  const value = useMemo<InvoiceStore>(
    () => ({
      invoice: ready ? invoice : null,
      ready,
      totals: ready ? totals : null,
      issues,
      locale,
      dateStyle,
      recent,
      profile,
      canPersist,
      savedAt,
      fromSharedLink,
      dispatch,
      setInvoice,
      newInvoice,
      duplicate,
      openRecent,
      removeRecent,
      restoreRecent,
      commitToRecent,
      saveBusinessProfile,
      applyProfile,
      setDateStyle,
    }),
    [
      invoice, ready, totals, issues, locale, dateStyle, recent, profile, canPersist,
      savedAt, fromSharedLink, setInvoice, newInvoice, duplicate, openRecent,
      removeRecent, restoreRecent, commitToRecent, saveBusinessProfile, applyProfile,
      setDateStyle,
    ],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useInvoiceStore(): InvoiceStore {
  const store = useContext(StoreContext);
  if (!store) throw new Error('useInvoiceStore must be used inside InvoiceStoreProvider');
  return store;
}

/** The invoice once it exists, for components rendered only when ready. */
export function useInvoice(): { invoice: Invoice; totals: InvoiceTotals } {
  const { invoice, totals } = useInvoiceStore();
  if (!invoice || !totals) throw new Error('Invoice is not ready yet');
  return { invoice, totals };
}
