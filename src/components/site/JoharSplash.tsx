"use client";

import { useEffect, useState } from "react";

/**
 * A once-per-browser-session welcome splash — "Johar" (the traditional
 * Jharkhand greeting) in large type, resortinranchi.com as the tagline
 * below, dismissable by the close button, the "Enter" button, or clicking
 * the backdrop. Shown on both the public site and the admin panel (see
 * their layouts) with its own sessionStorage key per surface, so dismissing
 * it on one doesn't hide it on the other.
 */
export default function JoharSplash({
  storageKey = "johar-splash-dismissed",
  subtitle,
  buttonLabel = "Enter site",
}: {
  storageKey?: string;
  subtitle?: string;
  buttonLabel?: string;
}) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // sessionStorage doesn't exist during SSR, so this can't be a lazy
    // useState initializer — it has to run client-side in an effect,
    // reading real external state (has this session already seen it) and
    // syncing it into React state, which is exactly what effects are for.
    try {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- syncing from an SSR-unavailable external store, not a derived-state anti-pattern
      if (!sessionStorage.getItem(storageKey)) setVisible(true);
    } catch {
      // Storage unavailable (private mode, blocked) — just don't show the splash rather than error.
    }
  }, [storageKey]);

  const dismiss = () => {
    setVisible(false);
    try {
      sessionStorage.setItem(storageKey, "1");
    } catch {
      // Nothing to persist if storage is unavailable — it'll just show again next load.
    }
  };

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Welcome"
      className="fixed inset-0 z-[100] flex items-center justify-center bg-brand-dark/80 backdrop-blur-sm"
      onClick={dismiss}
    >
      <div
        className="relative mx-4 w-full max-w-md rounded-2xl border border-white/10 bg-gradient-to-br from-brand via-brand-dark to-black p-8 text-center shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={dismiss}
          aria-label="Close"
          className="absolute top-3 right-3 flex h-8 w-8 items-center justify-center rounded-full text-white/70 transition hover:bg-white/10 hover:text-white"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="h-5 w-5">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>

        <p className="font-serif text-6xl font-semibold text-white sm:text-7xl">Johar</p>
        <p className="mt-3 text-sm font-semibold tracking-[0.2em] text-brand-gold uppercase">resortinranchi.com</p>
        {subtitle && <p className="mt-3 text-sm text-white/80">{subtitle}</p>}

        <button
          type="button"
          onClick={dismiss}
          className="mt-6 rounded-full bg-white px-6 py-2.5 text-sm font-semibold text-brand-dark shadow-sm transition hover:brightness-95"
        >
          {buttonLabel}
        </button>
      </div>
    </div>
  );
}
