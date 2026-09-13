"use client";

import { useCompare, type CompareItem } from "./CompareProvider";

/**
 * Deliberately NOT inside PropertyCard's <Link> — rendered as a sibling
 * positioned over the image, so this is never a nested-interactive-control
 * (a checkbox inside an <a>), which is both invalid and breaks keyboard/
 * screen-reader navigation of the card.
 */
export default function CompareCheckbox({ item }: { item: CompareItem }) {
  const { isSelected, toggle, isFull } = useCompare();
  const selected = isSelected(item.slug);
  const disabled = isFull && !selected;

  return (
    <label
      className={`absolute right-2 top-2 z-10 flex items-center gap-1.5 rounded-full bg-white/90 px-2 py-1 text-xs font-medium shadow-sm backdrop-blur-sm transition-colors ${
        disabled ? "cursor-not-allowed text-brand/40" : "cursor-pointer text-brand-dark hover:bg-white"
      } ${selected ? "text-brand-orange" : ""}`}
    >
      <input
        type="checkbox"
        checked={selected}
        disabled={disabled}
        onChange={() => toggle(item)}
        aria-label={selected ? `Remove ${item.name} from comparison` : `Add ${item.name} to comparison`}
        className="h-3.5 w-3.5 accent-brand-orange"
      />
      Compare
    </label>
  );
}
