import Link from "next/link";
import { resolveAdLadder, type AdLadderName } from "@/lib/ads/adFormats";
import type { AdCreative } from "@/lib/ads/adCreative";

/** Full-bleed image with a "Sponsored" badge and a bottom scrim for name/description — used for banner and rail shapes, where the box is wide-and-short or narrow-and-tall rather than roomy enough for a separate text block. */
function BannerOrRailCreative({ creative }: { creative: AdCreative }) {
  return (
    <div className="relative h-full w-full overflow-hidden rounded-lg bg-brand-cream">
      {creative.imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element -- first-party external URL, not a Next-optimized local asset
        <img src={creative.imageUrl} alt={creative.imageAlt} className="h-full w-full object-cover" />
      ) : (
        <div className="h-full w-full bg-gradient-to-br from-brand-cream to-brand/10" />
      )}
      <span className="absolute left-2 top-2 z-10 rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-medium tracking-wide text-brand-dark/70 uppercase shadow-sm">
        {creative.sponsorLabel}
      </span>
      <div className="absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-black/70 via-black/30 to-transparent px-3 py-2">
        <p className="truncate text-sm font-semibold text-white">{creative.name}</p>
        <p className="truncate text-xs text-white/85">{creative.description}</p>
      </div>
    </div>
  );
}

/** Image on top, a real text block below — used for the "card" shape, which has enough room for the two to sit separately rather than overlaid. */
function CardCreative({ creative }: { creative: AdCreative }) {
  return (
    <div className="flex h-full w-full flex-col overflow-hidden rounded-lg border border-brand/10 bg-white">
      <div className="relative w-full flex-[3] overflow-hidden bg-brand-cream">
        {creative.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- first-party external URL, not a Next-optimized local asset
          <img src={creative.imageUrl} alt={creative.imageAlt} className="h-full w-full object-cover" />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-brand-cream to-brand/10" />
        )}
        <span className="absolute left-2 top-2 rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-medium tracking-wide text-brand-dark/70 uppercase shadow-sm">
          {creative.sponsorLabel}
        </span>
      </div>
      <div className="flex flex-[2] flex-col justify-center gap-1 p-3">
        <p className="truncate font-serif text-sm font-semibold text-brand-dark">{creative.name}</p>
        <p className="line-clamp-2 text-xs text-brand-dark/70">{creative.description}</p>
        <span className="text-xs font-semibold text-brand-teal">{creative.ctaLabel} &rarr;</span>
      </div>
    </div>
  );
}

export interface AdSlotProps {
  ladder: AdLadderName;
  creative: AdCreative;
}

/**
 * A reusable, responsive ad placement. Renders one box per breakpoint step
 * in the chosen ladder (see adFormats.ts); each step's literal Tailwind
 * class shows it only in its own width range, so exactly one is ever
 * visible — no layout shift, and never more than one format forced onto a
 * screen too narrow for it. All steps share the same creative (name/photo/
 * href), so there is only ever one distinct image URL per slot regardless
 * of how many hidden steps exist in the DOM.
 */
export default function AdSlot({ ladder, creative }: AdSlotProps) {
  const steps = resolveAdLadder(ladder);
  return (
    <div aria-label="Advertisement" className="ad-slot">
      {steps.map(({ step, format }) => (
        <div
          key={step.formatId}
          className={`${step.visibilityClass} mx-auto w-full`}
          style={{ maxWidth: format.width, aspectRatio: `${format.width} / ${format.height}` }}
        >
          <Link
            href={creative.href}
            className="block h-full w-full transition hover:opacity-95"
            title={`${creative.sponsorLabel}: ${creative.name}`}
          >
            {format.shape === "card" ? <CardCreative creative={creative} /> : <BannerOrRailCreative creative={creative} />}
          </Link>
        </div>
      ))}
    </div>
  );
}
