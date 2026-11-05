import { getAdForSpot } from "@/lib/promo/store";
import type { PromoSpotKey } from "@/lib/promo/catalog";
import PromoCard from "./PromoCard";

/**
 * A fixed promo spot. Renders nothing at all (no empty box, no spacing) when
 * the spot has no active ad, so switching an ad off never leaves a gap.
 * `className` is applied to the wrapper and carries the spacing for the page
 * it sits on. Put at most one of these on a page.
 */
export default async function PromoAd({ spot, className = "" }: { spot: PromoSpotKey; className?: string }) {
  const ad = await getAdForSpot(spot);
  if (!ad) return null;
  return (
    <aside aria-label={`Sponsored: ${ad.brand}`} data-promo-spot={spot} className={className}>
      <PromoCard ad={ad} spot={spot} />
    </aside>
  );
}
