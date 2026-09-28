import { prisma } from "@/lib/prisma";
import { publicPropertyCardSelect, publishedOnly, type PublicPropertyCard } from "./properties";
import { getPinnedListing } from "./pinnedListingQuery";
import { isPlacementActive, placementAppliesTo } from "@/lib/validation/planEntitlements";

/**
 * The sponsored listings for one browse list, in slot order.
 *
 * `contextSlugs` are the category slugs the list is about; null means a list
 * not tied to a category (a location page), where only sponsors that bought
 * every category apply. The always-pinned house listing (Aangan Resort) comes
 * first; paid placements follow, only while enabled, inside their paid period,
 * and only for a listing that is currently published.
 */
export async function getSponsoredListings(contextSlugs: string[] | null): Promise<PublicPropertyCard[]> {
  const now = new Date();
  const house = await getPinnedListing();

  const placements = await prisma.sponsoredPlacement.findMany({
    where: { enabled: true, property: { status: "PUBLISHED" } },
    select: {
      propertyId: true,
      enabled: true,
      allCategories: true,
      categorySlugs: true,
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

  const ids = applicable.map((p) => p.propertyId).filter((id) => id !== house?.id);
  const cards =
    ids.length > 0
      ? await prisma.property.findMany({ where: publishedOnly({ id: { in: ids } }), select: publicPropertyCardSelect })
      : [];
  const byId = new Map(cards.map((c) => [c.id, c]));
  const paid = ids.map((id) => byId.get(id)).filter((c): c is PublicPropertyCard => Boolean(c));

  return house ? [house, ...paid] : paid;
}
