import CategoryIcon from "./CategoryIcon";
import { getMonogram } from "@/lib/public/monogram";

/**
 * The property page's hero block for a listing with no real photo and no
 * illustrative image — a drawn, on-brand banner (initials + category icon)
 * so the top of the page is never empty. Deliberately not a photograph and
 * not presented as the business's logo: the caption says plainly that no
 * photos have been added yet.
 */
export default function PropertyHeroFallback({ name, categorySlug }: { name: string; categorySlug: string }) {
  const monogram = getMonogram(name);
  return (
    <div className="mt-6">
      <div
        role="img"
        aria-label={`${name} — no photo available yet`}
        className="flex aspect-video w-full flex-col items-center justify-center gap-2 rounded-lg bg-gradient-to-br from-brand-cream to-brand/10"
      >
        {monogram && (
          <span
            aria-hidden="true"
            className="flex h-24 w-24 items-center justify-center rounded-full bg-white/70 font-serif text-4xl font-semibold text-brand/60"
          >
            {monogram}
          </span>
        )}
        <CategoryIcon slug={categorySlug} className="h-8 w-8 text-brand/40" />
      </div>
      <p className="mt-1 text-xs text-brand/60">Photos for this listing haven&apos;t been added yet.</p>
    </div>
  );
}
