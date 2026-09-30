import { prisma } from "@/lib/prisma";
import { publicPropertyCardSelect, publishedOnly, type PublicPropertyCard } from "./properties";
import { isPlacementActive, placementAppliesTo } from "@/lib/validation/planEntitlements";
import type { Sponsor } from "./pinnedListing";

/**
 * The sponsored listings for one browse list, each with whichever positions
 * an admin has assigned it (any slot, not a fixed set — see PaidPlanPanel).
 * `contextSlugs` are the category slugs the list is
 * about; null means a list not tied to a category (a location page), where
 * only sponsors that bought every category apply. Only placements that are
 * enabled, inside their paid period, and for a listing that is currently
 * published are included. Higher plans are listed first, so a tied position
 * (two sponsors ticking the same slot) is won by the higher-tier one.
 */
export async function getSponsoredListings(contextSlugs: string[] | null): Promise<Sponsor<PublicPropertyCard>[]> {
  const now = new Date();

  const placements = await prisma.sponsoredPlacement.findMany({
    where: { enabled: true, property: { status: "PUBLISHED" } },
    select: {
      propertyId: true,
      enabled: true,
      allCategories: true,
      categorySlugs: true,
      positions: true,
      startsAt: true,
      endsAt: true,
      // Higher plans first: Lead Partner, then Premium.
      property: { select: { commercialTier: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  const rank = (tier: string) => (tier === "LEAD_PARTNER" ? 0 : tier === "PREMIUM" ? 1 : 2);
  const applicable = placements
    .filter((p) => isPlacementActive(p, now) && placementAppliesTo(p, contextSlugs))
    .sort((a, b) => rank(a.property.commercialTier) - rank(b.property.commercialTier));

  const ids = applicable.map((p) => p.propertyId);
  if (ids.length === 0) return [];

  const cards = await prisma.property.findMany({ where: publishedOnly({ id: { in: ids } }), select: publicPropertyCardSelect });
  const byId = new Map(cards.map((c) => [c.id, c]));

  return applicable
    .map((p) => {
      const property = byId.get(p.propertyId);
      return property ? { property, positions: p.positions } : null;
    })
    .filter((s): s is Sponsor<PublicPropertyCard> => s !== null);
}
