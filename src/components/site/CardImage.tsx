import type { CardImageResult } from "@/lib/public/properties";
import CategoryIcon from "./CategoryIcon";

/**
 * The card's image area — always the same aspect ratio and rounded-top
 * corners regardless of which tier `image.kind` is, so cards line up evenly
 * in a grid whether or not a property has real photos yet. The "placeholder"
 * tier never renders an <img> at all (drawn from the category icon + brand
 * tokens instead), so there is no broken-image icon and nothing to fetch.
 */
export default function CardImage({ image, categorySlug }: { image: CardImageResult; categorySlug: string }) {
  if (image.kind === "photo") {
    return (
      <div className="aspect-[4/3] w-full overflow-hidden rounded-t-lg bg-brand-cream">
        {/* eslint-disable-next-line @next/next/no-img-element -- first-party external URL, not a Next-optimized local asset */}
        <img src={image.url!} alt={image.alt} className="h-full w-full object-cover" />
      </div>
    );
  }

  if (image.kind === "illustrative") {
    return (
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-t-lg bg-brand-cream">
        {/* eslint-disable-next-line @next/next/no-img-element -- first-party external URL, not a Next-optimized local asset */}
        <img src={image.url!} alt={image.alt} className="h-full w-full object-cover" />
        <span className="absolute left-2 top-2 rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-medium tracking-wide text-brand-dark/70 uppercase shadow-sm">
          Illustrative
        </span>
      </div>
    );
  }

  if (image.kind === "logo") {
    return (
      <div className="flex aspect-[4/3] w-full items-center justify-center overflow-hidden rounded-t-lg bg-brand-cream p-8">
        {/* eslint-disable-next-line @next/next/no-img-element -- first-party external URL, not a Next-optimized local asset */}
        <img src={image.url!} alt={image.alt} className="max-h-full max-w-full object-contain" />
      </div>
    );
  }

  // "placeholder" — drawn, never fetched: a soft on-brand backdrop with the
  // property's category icon, honest that no real image exists yet.
  return (
    <div
      role="img"
      aria-label={image.alt}
      className="flex aspect-[4/3] w-full items-center justify-center rounded-t-lg bg-gradient-to-br from-brand-cream to-brand/10"
    >
      <span className="flex h-16 w-16 items-center justify-center rounded-full bg-white/70">
        <CategoryIcon slug={categorySlug} className="h-8 w-8 text-brand/50" />
      </span>
    </div>
  );
}
