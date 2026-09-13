"use client";

import Link from "next/link";
import { useCompare } from "./CompareProvider";
import { MIN_COMPARE_PROPERTIES } from "@/lib/public/compareConstants";

/**
 * Sticky bottom tray — appears only once at least one property is
 * selected, disappears entirely otherwise. No slide/fade animation (so
 * there's nothing that needs a prefers-reduced-motion guard); it simply
 * mounts/unmounts with the selection.
 */
export default function CompareTray() {
  const { items, remove, clear } = useCompare();
  if (items.length === 0) return null;

  const canCompare = items.length >= MIN_COMPARE_PROPERTIES;
  const params = new URLSearchParams();
  for (const item of items) params.append("property", item.slug);
  const compareHref = `/compare?${params.toString()}`;

  return (
    <div
      role="region"
      aria-label="Comparison tray"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-brand/15 bg-white/95 shadow-[0_-4px_12px_rgba(0,0,0,0.06)] backdrop-blur-sm"
    >
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3 px-4 py-3">
        <p className="shrink-0 text-sm font-medium text-brand-dark">
          {items.length} of 4 selected
        </p>

        <ul className="flex min-w-0 flex-1 flex-wrap gap-2">
          {items.map((item) => (
            <li
              key={item.slug}
              className="flex items-center gap-1.5 rounded-full border border-brand/15 bg-brand-cream px-2.5 py-1 text-xs text-brand-dark"
            >
              <span className="max-w-[120px] truncate">{item.name}</span>
              <button
                type="button"
                onClick={() => remove(item.slug)}
                aria-label={`Remove ${item.name} from comparison`}
                className="text-brand/50 hover:text-brand-dark"
              >
                ×
              </button>
            </li>
          ))}
        </ul>

        <div className="flex shrink-0 items-center gap-3">
          <button type="button" onClick={clear} className="text-xs text-brand/60 hover:text-brand-dark hover:underline">
            Clear comparison
          </button>
          {canCompare ? (
            <Link
              href={compareHref}
              className="rounded-md bg-brand-orange px-4 py-2 text-sm font-semibold text-white hover:brightness-95"
            >
              Compare ({items.length})
            </Link>
          ) : (
            <span
              aria-disabled="true"
              title="Select at least 2 properties to compare"
              className="cursor-not-allowed rounded-md bg-brand/15 px-4 py-2 text-sm font-semibold text-brand/50"
            >
              Compare
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
