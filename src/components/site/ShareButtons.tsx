"use client";

import { useState } from "react";

/** WhatsApp share + copy link (and the phone's own share sheet when available) — shared links bring visitors back to the listing. */
export default function ShareButtons({ url, title }: { url: string; title: string }) {
  const [copied, setCopied] = useState(false);
  const whatsappHref = `https://wa.me/?text=${encodeURIComponent(`${title} — ${url}`)}`;

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt("Copy this link", url);
    }
  }

  async function nativeShare() {
    try {
      await navigator.share({ title, url });
    } catch {
      // Dismissed or unsupported — nothing to do.
    }
  }

  const canNativeShare = typeof navigator !== "undefined" && typeof navigator.share === "function";
  const buttonClass = "rounded-full border border-brand/20 px-3 py-1 text-xs font-medium text-brand-dark hover:border-brand/50";

  return (
    <div className="mt-4 flex flex-wrap items-center gap-2" aria-label="Share this listing">
      <span className="text-xs text-brand/60">Share:</span>
      <a href={whatsappHref} target="_blank" rel="noopener noreferrer" className={buttonClass}>
        WhatsApp
      </a>
      <button type="button" onClick={copyLink} className={buttonClass}>
        {copied ? "Link copied ✓" : "Copy link"}
      </button>
      {canNativeShare && (
        <button type="button" onClick={nativeShare} className={buttonClass}>
          More…
        </button>
      )}
    </div>
  );
}
