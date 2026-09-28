import { prisma } from "@/lib/prisma";
import { publicPropertyCardSelect, publishedOnly, type PublicPropertyCard } from "./properties";
import { PINNED_LISTING_SLUG } from "./pinnedListing";

/** The pinned listing's card data, or null when it isn't currently published (then nothing is pinned). */
export async function getPinnedListing(): Promise<PublicPropertyCard | null> {
  return prisma.property.findFirst({
    where: publishedOnly({ slug: PINNED_LISTING_SLUG }),
    select: publicPropertyCardSelect,
  });
}
