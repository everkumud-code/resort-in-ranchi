import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import { SITE_URL } from "@/lib/public/site";
import { UMBRELLA_CATEGORY_ROUTES } from "@/lib/public/categoryRoutes";
import { isThinPublicListing } from "@/lib/public/properties";

/**
 * Only pages with real, published content are listed — per the product
 * spec's SEO rules ("do not automatically index thin pages"). A category or
 * location with zero published properties, or an umbrella page with none of
 * its underlying categories populated, is left out entirely.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [categories, locations, properties] = await Promise.all([
    prisma.category.findMany({
      select: { slug: true, updatedAt: true, _count: { select: { properties: { where: { status: "PUBLISHED" } } } } },
    }),
    prisma.location.findMany({
      select: { slug: true, updatedAt: true, _count: { select: { properties: { where: { status: "PUBLISHED" } } } } },
    }),
    prisma.property.findMany({
      where: { status: "PUBLISHED" },
      select: {
        slug: true,
        updatedAt: true,
        address: true,
        phone: true,
        website: true,
        shortDescription: true,
        fullDescription: true,
      },
    }),
  ]);

  const entries: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, changeFrequency: "daily", priority: 1 },
    { url: `${SITE_URL}/about`, changeFrequency: "monthly", priority: 0.3 },
    { url: `${SITE_URL}/contact`, changeFrequency: "monthly", priority: 0.3 },
    { url: `${SITE_URL}/list-your-business`, changeFrequency: "monthly", priority: 0.4 },
    { url: `${SITE_URL}/privacy`, changeFrequency: "yearly", priority: 0.1 },
  ];

  for (const c of categories) {
    if (c._count.properties > 0) {
      entries.push({ url: `${SITE_URL}/${c.slug}`, lastModified: c.updatedAt, changeFrequency: "weekly", priority: 0.8 });
    }
  }

  for (const l of locations) {
    if (l._count.properties > 0) {
      entries.push({
        url: `${SITE_URL}/locations/${l.slug}`,
        lastModified: l.updatedAt,
        changeFrequency: "weekly",
        priority: 0.7,
      });
    }
  }

  for (const route of Object.values(UMBRELLA_CATEGORY_ROUTES)) {
    const categorySlugSet = new Set(route.categorySlugs);
    const populated = categories.some((c) => categorySlugSet.has(c.slug) && c._count.properties > 0);
    if (populated) {
      entries.push({ url: `${SITE_URL}/${route.slug}`, changeFrequency: "weekly", priority: 0.6 });
    }
  }

  for (const p of properties) {
    // Thin Discovery listings (no contact info, no real description) stay
    // publicly viewable but are left out of the sitemap — same threshold
    // used for the property page's own noindex decision.
    if (isThinPublicListing(p)) continue;
    entries.push({ url: `${SITE_URL}/property/${p.slug}`, lastModified: p.updatedAt, changeFrequency: "weekly", priority: 0.6 });
  }

  return entries;
}
