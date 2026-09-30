"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

/**
 * Persistent, highlighted "go back" / "main menu" controls shown in the
 * admin header on every page — replaces having to hunt for a small text
 * link on each individual page. Back uses browser history (works from any
 * depth: a list, a detail page, a sub-panel); Dashboard always returns to
 * the block-based main menu.
 */
export default function AdminHeaderNav() {
  const router = useRouter();

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => router.back()}
        className="flex items-center gap-1 rounded-md border border-slate-300 bg-panel-green px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
      >
        ← Back
      </button>
      <Link
        href="/admin"
        className="flex items-center gap-1.5 rounded-md bg-slate-900 px-3 py-1.5 text-sm font-semibold text-white hover:bg-slate-700"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
          <path d="M3 11l9-8 9 8" />
          <path d="M5 10v10a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1V10" />
        </svg>
        Main menu
      </Link>
    </div>
  );
}
