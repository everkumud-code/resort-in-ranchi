"use client";

import { createContext, useCallback, useContext, useMemo, useSyncExternalStore } from "react";
import { MAX_COMPARE_PROPERTIES } from "@/lib/public/compareConstants";

const STORAGE_KEY = "rir_compare_v1";

/** Only what the tray/checkboxes need to render — no contact info, no PII, just what's already public. */
export interface CompareItem {
  slug: string;
  name: string;
  thumbnailUrl: string | null;
}

interface CompareContextValue {
  items: CompareItem[];
  isSelected: (slug: string) => boolean;
  toggle: (item: CompareItem) => void;
  remove: (slug: string) => void;
  clear: () => void;
  isFull: boolean;
}

const CompareContext = createContext<CompareContextValue | null>(null);

/**
 * A module-scoped (not component-scoped) external-store adapter around
 * localStorage — the standard React pattern for useSyncExternalStore, and
 * the right tool here specifically because localStorage is itself a
 * process-wide singleton: every CompareCheckbox/CompareTray instance on the
 * page subscribes to the same store, and the native `storage` event means
 * selection even stays in sync across browser tabs, not just components.
 */
const listeners = new Set<() => void>();
let cachedRaw: string | null | undefined = undefined;
let cachedSnapshot: CompareItem[] = [];

/**
 * The server (and the pre-hydration client render) has no localStorage, so
 * this is always empty — but useSyncExternalStore requires getServerSnapshot
 * to return a referentially stable value across calls (React compares with
 * Object.is), or it warns "should be cached" and can loop. A literal `[]`
 * returned fresh on every call fails that check; this shared constant fixes
 * it at the root rather than suppressing the warning.
 */
const EMPTY_ITEMS: CompareItem[] = [];

/** Exported (along with getSnapshot/getServerSnapshot below) purely so the useSyncExternalStore referential-stability contract can be regression-tested directly, without rendering a component. */
export function parse(raw: string | null): CompareItem[] {
  if (!raw) return EMPTY_ITEMS;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return EMPTY_ITEMS;
    const items = parsed
      .filter((x): x is CompareItem => Boolean(x) && typeof x === "object" && typeof (x as CompareItem).slug === "string" && typeof (x as CompareItem).name === "string")
      .slice(0, MAX_COMPARE_PROPERTIES);
    return items.length > 0 ? items : EMPTY_ITEMS;
  } catch {
    return EMPTY_ITEMS;
  }
}

function readRaw(): string | null {
  try {
    return window.localStorage.getItem(STORAGE_KEY);
  } catch {
    // localStorage can be unavailable (private browsing, disabled storage)
    // — the feature degrades to "nothing persists", it never throws.
    return null;
  }
}

export function getSnapshot(): CompareItem[] {
  const raw = readRaw();
  if (raw !== cachedRaw) {
    cachedRaw = raw;
    cachedSnapshot = parse(raw);
  }
  return cachedSnapshot;
}

export function getServerSnapshot(): CompareItem[] {
  return EMPTY_ITEMS;
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  window.addEventListener("storage", listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
}

function writeItems(items: CompareItem[]): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // See readRaw() — degrade silently.
  }
  cachedRaw = undefined; // force the next getSnapshot() to re-read rather than serve a stale cache
  for (const listener of listeners) listener();
}

/**
 * Selection lives ONLY in the visitor's own browser (localStorage) — never
 * sent to the server while browsing, never a cookie, no PII (just slug,
 * public name, public thumbnail URL). Mounted once at the site layout so
 * selection survives navigation between search/category/location/property
 * pages.
 */
export function CompareProvider({ children }: { children: React.ReactNode }) {
  const items = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const isSelected = useCallback((slug: string) => items.some((i) => i.slug === slug), [items]);

  const toggle = useCallback((item: CompareItem) => {
    const current = getSnapshot();
    if (current.some((i) => i.slug === item.slug)) {
      writeItems(current.filter((i) => i.slug !== item.slug));
      return;
    }
    if (current.length >= MAX_COMPARE_PROPERTIES) return; // full — silently ignored, the checkbox is disabled in this state anyway
    writeItems([...current, item]);
  }, []);

  const remove = useCallback((slug: string) => {
    writeItems(getSnapshot().filter((i) => i.slug !== slug));
  }, []);

  const clear = useCallback(() => writeItems([]), []);

  const value = useMemo<CompareContextValue>(
    () => ({ items, isSelected, toggle, remove, clear, isFull: items.length >= MAX_COMPARE_PROPERTIES }),
    [items, isSelected, toggle, remove, clear]
  );

  return <CompareContext.Provider value={value}>{children}</CompareContext.Provider>;
}

export function useCompare(): CompareContextValue {
  const ctx = useContext(CompareContext);
  if (!ctx) throw new Error("useCompare must be used within a CompareProvider");
  return ctx;
}
