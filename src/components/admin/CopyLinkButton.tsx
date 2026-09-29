"use client";

import { useState } from "react";

/** Copies an absolute URL to the clipboard — used wherever an admin needs to paste a link elsewhere (e.g. into another post). */
export default function CopyLinkButton({ url, label = "Copy link" }: { url: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt("Copy this link", url);
    }
  }

  return (
    <button type="button" onClick={copy} className="text-slate-500 hover:text-slate-900 hover:underline">
      {copied ? "Copied ✓" : label}
    </button>
  );
}
