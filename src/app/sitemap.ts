import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import { SITE_URL } from "@/lib/public/site";
import { UMBRELLA_CATEGORY_ROUTES } from "@/lib/public/categoryRoutes";
import { isThinPublicListing } from "@/lib/public/properties";
import { publishedPostWhere } from "@/lib/blog/queries";
import { tagSlug } from "@/lib/blog/blog";
import { getComboIndex } from "@/lib/public/comboQueries";
import { comboPath } from "@/lib/public/comboPages";
import { listPublishedEvents } from "@/lib/eventQueries";
import { isEventPast } from "@/lib/events";

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
        // Real photos only (hero first) so search engines can index the listing's pictures.
        images: { where: { kind: "PHOTO" }, orderBy: [{ isHero: "desc" }, { sortOrder: "asc" }], take: 3, select: { url: true } },
      },
    }),
  ]);

  const entries: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, changeFrequency: "daily", priority: 1 },
    { url: `${SITE_URL}/guides/ranchi-hospitality`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${SITE_URL}/about`, changeFrequency: "monthly", priority: 0.3 },
    { url: `${SITE_URL}/contact`, changeFrequency: "monthly", priority: 0.3 },
    { url: `${SITE_URL}/list-your-business`, changeFrequency: "monthly", priority: 0.4 },
    { url: `${SITE_URL}/privacy`, changeFrequency: "yearly", priority: 0.1 },
  ];

  for (const c of categories) {
    if (c._count.properties > 0) entries.push({ url: `${SITE_URL}/${c.slug}`, lastModified: c.updatedAt, changeFrequency: "weekly", priority: 0.8 });
  }
  for (const l of locations) {
    if (l._count.properties > 0) entries.push({ url: `${SITE_URL}/locations/${l.slug}`, lastModified: l.updatedAt, changeFrequency: "weekly", priority: 0.7 });
  }
  for (const route of Object.values(UMBRELLA_CATEGORY_ROUTES)) {
    const categorySlugSet = new Set(route.categorySlugs);
    const populated = categories.some((c) => categorySlugSet.has(c.slug) && c._count.properties > 0);
    if (populated) entries.push({ url: `${SITE_URL}/${route.slug}`, changeFrequency: "weekly", priority: 0.6 });
  }
  // "Category in area" landing pages — only combinations with at least one real listing.
  try {
    for (const combo of await getComboIndex()) {
      entries.push({ url: `${SITE_URL}${comboPath(combo.categorySlug, combo.locationSlug)}`, changeFrequency: "weekly", priority: 0.7 });
    }
  } catch {
    // Never let the combo index take the whole sitemap down.
  }
  for (const p of properties) {
    if (isThinPublicListing(p)) continue;
    entries.push({
      url: `${SITE_URL}/property/${p.slug}`,
      lastModified: p.updatedAt,
      changeFrequency: "weekly",
      priority: 0.6,
      ...(p.images.length > 0 ? { images: p.images.map((i) => i.url) } : {}),
    });
  }

  // Published, indexable blog posts. Never lets a blog query failure take the whole sitemap down.
  try {
    const posts = await prisma.blogPost.findMany({
      where: { ...publishedPostWhere(), noindex: false },
      select: { slug: true, updatedAt: true, tags: true },
      orderBy: { publishedAt: "desc" },
    });
    if (posts.length > 0) {
      entries.push({ url: `${SITE_URL}/blog`, changeFrequency: "weekly", priority: 0.6 });
      const tagSlugs = new Set<string>();
      for (const post of posts) {
        entries.push({ url: `${SITE_URL}/blog/${post.slug}`, lastModified: post.updatedAt, changeFrequency: "monthly", priority: 0.6 });
        for (const tag of post.tags) {
          const slug = tagSlug(tag);
          if (slug) tagSlugs.add(slug);
        }
      }
      for (const slug of tagSlugs) entries.push({ url: `${SITE_URL}/blog/tag/${slug}`, changeFrequency: "weekly", priority: 0.4 });
    }
  } catch {
    // Blog table unavailable — omit blog URLs rather than failing the sitemap.
  }

  // Published events still live (not yet over) — never lets an unmigrated table fail the sitemap.
  try {
    const events = await listPublishedEvents();
    if (events.length > 0) {
      entries.push({ url: `${SITE_URL}/events`, changeFrequency: "daily", priority: 0.6 });
      entries.push({ url: `${SITE_URL}/events/create`, changeFrequency: "monthly", priority: 0.3 });
      for (const event of events) {
        if (!isEventPast(event)) entries.push({ url: `${SITE_URL}/events/${event.slug}`, changeFrequency: "daily", priority: 0.5 });
      }
    }
  } catch {
    // Never let the events index take the whole sitemap down.
  }

  // Published influencers.
  try {
    const influencers = await prisma.influencer.findMany({ where: { status: "PUBLISHED" }, select: { slug: true, updatedAt: true } });
    if (influencers.length > 0) {
      entries.push({ url: `${SITE_URL}/influencers`, changeFrequency: "weekly", priority: 0.5 });
      for (const inf of influencers) {
        entries.push({ url: `${SITE_URL}/influencers/${inf.slug}`, lastModified: inf.updatedAt, changeFrequency: "monthly", priority: 0.4 });
      }
    }
  } catch {
    // Influencer table unavailable — omit rather than failing the sitemap.
  }

  return entries;
}
