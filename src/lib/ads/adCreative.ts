import { prisma } from "@/lib/prisma";

export interface AdCreative {
  sponsorLabel: string;
  name: string;
  description: string;
  ctaLabel: string;
  href: string;
  /** Null when no real photo exists — AdSlot then draws a plain on-brand background instead of inventing one. */
  imageUrl: string | null;
  imageAlt: string;
}

/**
 * The site's one currently-configured advertiser — Aangan Resort — built
 * entirely from its own real, already-published data (name, category,
 * locality, an existing PHOTO already used on its own listing page). Never
 * invents a rating, price, or availability claim, and never touches Aangan
 * Palace or Aangan Resort's own Property row. Returns null if Aangan Resort
 * isn't published, so a slot with no real creative simply doesn't render —
 * never a broken image or an invented replacement.
 */
export async function getAanganResortAdCreative(): Promise<AdCreative | null> {
  const property = await prisma.property.findFirst({
    where: { slug: "aangan-resort", status: "PUBLISHED" },
    select: {
      name: true,
      slug: true,
      shortDescription: true,
      category: { select: { name: true } },
      locality: { select: { name: true } },
      images: {
        where: { kind: "PHOTO" },
        orderBy: { sortOrder: "asc" },
        take: 1,
        select: { url: true, altText: true },
      },
    },
  });
  if (!property) return null;

  const photo = property.images[0] ?? null;
  const contextLabel = property.locality ? `${property.category.name} · ${property.locality.name}` : property.category.name;

  return {
    sponsorLabel: "Sponsored",
    name: property.name,
    description: property.shortDescription ?? contextLabel,
    ctaLabel: `Explore ${property.name}`,
    href: `/property/${property.slug}`,
    imageUrl: photo?.url ?? null,
    imageAlt: photo?.altText ?? property.name,
  };
}
