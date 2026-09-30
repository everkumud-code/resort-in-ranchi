import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

/**
 * Explicit field whitelist for anything shown on a public page. This is the
 * data-safety boundary for the whole public site: sourceRecordId, source,
 * sourceUrl, sourceLastCheckedAt, mergedFromSourceRecordIds, rawCategory,
 * rawLocality, lastVerifiedAt, claimed, ownerVerified — none of that is
 * listed here, so it can never leak through a public query by accident.
 * Only `select` (never a bare `include`) is used for this reason: adding a
 * new internal field to the schema later can't silently become publicly
 * visible.
 *
 * `verificationStatus` and `claimed` are the deliberate exceptions.
 * `verificationStatus` is never rendered as its raw enum value; every
 * caller must pass it through `getPublicTrustTier()` first, which collapses
 * it to the honest 3-way public label (Verified / Owner Verified / Discovery
 * listing). `claimed` is a plain boolean with nothing sensitive in it — it
 * only decides whether the "Claim this listing" CTA is shown.
 */
export const publicPropertySelect = {
  id: true,
  slug: true,
  name: true,
  shortDescription: true,
  fullDescription: true,
  address: true,
  city: true,
  state: true,
  pincode: true,
  latitude: true,
  longitude: true,
  phone: true,
  whatsapp: true,
  email: true,
  website: true,
  googleMapsUrl: true,
  googleRating: true,
  reviewCount: true,
  priceMin: true,
  priceMax: true,
  priceLabel: true,
  rooms: true,
  eventCapacityMin: true,
  eventCapacityMax: true,
  featured: true,
  verificationStatus: true,
  claimed: true,
  generatedIdentityMarkUrl: true,
  commercialTier: true,
  category: { select: { id: true, name: true, slug: true } },
  locality: { select: { id: true, name: true, slug: true } },
  facilities: { select: { facility: { select: { name: true, slug: true } } } },
  venueSpaces: {
    select: { id: true, name: true, type: true, capacityMin: true, capacityMax: true, description: true, imageUrl: true },
  },
  images: {
    select: { id: true, url: true, altText: true, caption: true, sortOrder: true, kind: true, tag: true, isHero: true },
    // The hero image always comes first, so it is the page's main picture.
    orderBy: [{ isHero: "desc" }, { sortOrder: "asc" }],
  },
  badges: { select: { badge: { select: { id: true, label: true, description: true } } } },
} satisfies Prisma.PropertySelect;

export type PublicProperty = Prisma.PropertyGetPayload<{ select: typeof publicPropertySelect }>;

/** Lighter-weight shape for list/card views — no venue spaces or facilities. */
export const publicPropertyCardSelect = {
  id: true,
  slug: true,
  name: true,
  shortDescription: true,
  city: true,
  phone: true,
  website: true,
  googleRating: true,
  reviewCount: true,
  priceLabel: true,
  featured: true,
  verificationStatus: true,
  generatedIdentityMarkUrl: true,
  category: { select: { id: true, name: true, slug: true } },
  locality: { select: { id: true, name: true, slug: true } },
  // Only what's needed to pick a card thumbnail (see selectCardImage) — no
  // caption/sortOrder/id-for-editing noise a card view never uses.
  images: {
    select: { url: true, altText: true, kind: true },
    // Hero first: selectCardImage takes the first PHOTO, so the hero becomes the thumbnail.
    orderBy: [{ isHero: "desc" }, { sortOrder: "asc" }],
  },
  badges: { select: { badge: { select: { id: true, label: true, description: true } } } },
} satisfies Prisma.PropertySelect;

export type PublicPropertyCard = Prisma.PropertyGetPayload<{ select: typeof publicPropertyCardSelect }>;

/**
 * A property belongs to a category page when it is filed there (its primary
 * categoryId) or has bought that category as an extra (PropertyCategory).
 */
export function categoryMembershipWhere(categoryIds: string[]): Prisma.PropertyWhereInput {
  return {
    OR: [{ categoryId: { in: categoryIds } }, { extraCategories: { some: { categoryId: { in: categoryIds } } } }],
  };
}

/** Same as categoryMembershipWhere, keyed by category slug (used by the location page's category filter). */
export function categorySlugMembershipWhere(slug: string): Prisma.PropertyWhereInput {
  return { OR: [{ category: { slug } }, { extraCategories: { some: { category: { slug } } } }] };
}

/** Every public property query starts here — only ever PUBLISHED listings. */
export function publishedOnly(extra: Prisma.PropertyWhereInput = {}): Prisma.PropertyWhereInput {
  return { status: "PUBLISHED", ...extra };
}

export async function getPublishedPropertyBySlug(slug: string): Promise<PublicProperty | null> {
  return prisma.property.findFirst({
    where: publishedOnly({ slug }),
    select: publicPropertySelect,
  });
}

export interface ListPropertiesOptions {
  where?: Prisma.PropertyWhereInput;
  orderBy?: Prisma.PropertyOrderByWithRelationInput | Prisma.PropertyOrderByWithRelationInput[];
  skip?: number;
  take?: number;
}

export async function listPublicProperties(
  options: ListPropertiesOptions
): Promise<{ items: PublicPropertyCard[]; totalCount: number }> {
  const where = publishedOnly(options.where);
  const [items, totalCount] = await Promise.all([
    prisma.property.findMany({
      where,
      select: publicPropertyCardSelect,
      orderBy: options.orderBy ?? buildPublicOrderBy(),
      skip: options.skip,
      take: options.take,
    }),
    prisma.property.count({ where }),
  ]);
  return { items, totalCount };
}

/**
 * The only sort options Step 5 implements — deliberately just these three.
 * "Highest rated" / "Most reviewed" / "Recently verified" are deferred
 * until there's real rating/review data and are NOT implemented here;
 * `verificationStatus`/`lastVerifiedAt` are never used in public sort
 * behavior at all, per the data-safety boundary.
 */
export type PublicSort = "recommended" | "newest" | "name";

export function buildPublicOrderBy(
  sort?: string | null
): Prisma.PropertyOrderByWithRelationInput | Prisma.PropertyOrderByWithRelationInput[] {
  switch (sort) {
    case "name":
      return { name: "asc" };
    case "newest":
      return { createdAt: "desc" };
    case "recommended":
    default:
      return [{ featured: "desc" }, { createdAt: "desc" }];
  }
}

export async function getFeaturedProperties(limit: number): Promise<PublicPropertyCard[]> {
  return prisma.property.findMany({
    where: publishedOnly({ featured: true }),
    select: publicPropertyCardSelect,
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

export async function getRecentProperties(limit: number): Promise<PublicPropertyCard[]> {
  return prisma.property.findMany({
    where: publishedOnly(),
    select: publicPropertyCardSelect,
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

/**
 * A listing counts as "sponsored" for competitor-suppression purposes when
 * it's admin-featured or on a paid plan (Premium/Lead Partner) — see
 * getRelatedProperties, which uses this to decide whether to show any
 * competitor at all below it.
 */
export function isSponsoredListing(property: { featured: boolean; commercialTier: string }): boolean {
  return property.featured || property.commercialTier !== "FREE";
}

/**
 * Same-category "you might also consider" listings shown below a property's
 * own detail page. A sponsored/featured/paid listing never shows a
 * competitor below it — that protection is part of what "sponsored" buys.
 * A free listing does show related properties, with featured/paid ones
 * surfaced first (the paid listing's exposure on free pages, in exchange).
 */
export async function getRelatedProperties(
  property: Pick<PublicProperty, "id" | "category" | "featured" | "commercialTier">,
  limit: number
): Promise<PublicPropertyCard[]> {
  if (isSponsoredListing(property)) return [];
  return prisma.property.findMany({
    where: publishedOnly({ categoryId: property.category.id, id: { not: property.id } }),
    select: publicPropertyCardSelect,
    orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
    take: limit,
  });
}

export interface PropertySearchParams {
  query?: string | null;
  categorySlug?: string | null;
  localitySlug?: string | null;
}

/**
 * Deterministic, Prisma-native matching only — no fuzzy search, no new
 * search engine/dependency. `q` matches the property's own name OR its
 * category's name OR its locality's name, so typing "Hotel" or "Ranchi"
 * surfaces relevant results without requiring the category/location
 * dropdowns to be used. `categorySlug`/`localitySlug` (from the dropdowns
 * or a category/location page's own filter) are exact-match, ANDed with
 * the `q` condition when both are present — they're different top-level
 * keys on the where object, so Prisma ANDs them naturally with no need
 * for an explicit AND wrapper.
 */
/**
 * A short, honest, factual description built only from fields already in
 * the database — used only when a property has no admin-written
 * shortDescription/fullDescription. Never invents features, amenities, or
 * marketing claims; states only what the database already asserts (name,
 * category, locality).
 */
export function buildFallbackDescription(name: string, categoryName: string, localityName: string | null): string {
  return localityName
    ? `${name} is listed in ${localityName}, Ranchi, under the ${categoryName} category.`
    : `${name} is listed in Ranchi under the ${categoryName} category.`;
}

/**
 * True when a public listing has neither a real way to contact/find it nor
 * any real (non-generated) description — i.e. a bare name+category+locality
 * discovery listing. Used to noindex/keep-minimal genuinely thin pages
 * rather than generating SEO-spam content to fill them out.
 */
export function isThinPublicListing(
  property: Pick<PublicProperty, "address" | "phone" | "website" | "shortDescription" | "fullDescription">
): boolean {
  const hasContact = Boolean(property.address || property.phone || property.website);
  const hasDescription = Boolean(property.shortDescription || property.fullDescription);
  return !hasContact && !hasDescription;
}

export type CardImageKind = "photo" | "logo" | "illustrative" | "placeholder";

export interface CardImageResult {
  kind: CardImageKind;
  /** Always null for "placeholder" — that tier is drawn (icon/pattern), never an <img>, so there's nothing to fetch and nothing that can 404. */
  url: string | null;
  alt: string;
}

/**
 * Picks what a property card's thumbnail area should show, strictly in this
 * priority order: a real PHOTO > an official/owner-supplied LOGO (a
 * PropertyImage of kind LOGO, or the generated identity mark) > an
 * ILLUSTRATIVE placeholder image > a drawn, on-brand placeholder with no
 * image at all. Never picks ILLUSTRATIVE and reports it as "photo" — callers
 * (CardImage) must render the "illustrative" kind visibly distinct from a
 * real photograph, never implying it depicts this specific property.
 */
export function selectCardImage(property: {
  name: string;
  generatedIdentityMarkUrl: string | null;
  images: { url: string; altText: string | null; kind: string }[];
}): CardImageResult {
  const photo = property.images.find((i) => i.kind === "PHOTO");
  if (photo) return { kind: "photo", url: photo.url, alt: photo.altText ?? property.name };

  const logoImage = property.images.find((i) => i.kind === "LOGO");
  if (logoImage) return { kind: "logo", url: logoImage.url, alt: logoImage.altText ?? `${property.name} logo` };
  if (property.generatedIdentityMarkUrl) {
    return { kind: "logo", url: property.generatedIdentityMarkUrl, alt: `${property.name} identity mark` };
  }

  const illustrative = property.images.find((i) => i.kind === "ILLUSTRATIVE");
  if (illustrative) {
    return {
      kind: "illustrative",
      url: illustrative.url,
      alt: illustrative.altText ?? `Illustrative image — not an actual photo of ${property.name}`,
    };
  }

  return { kind: "placeholder", url: null, alt: `${property.name} — no photo available yet` };
}

export function buildPublicSearchWhere(params: PropertySearchParams): Prisma.PropertyWhereInput {
  const where: Prisma.PropertyWhereInput = {};
  const q = params.query?.trim();

  if (q) {
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { category: { name: { contains: q, mode: "insensitive" } } },
      { locality: { name: { contains: q, mode: "insensitive" } } },
    ];
  }
  if (params.categorySlug) {
    where.category = { slug: params.categorySlug };
  }
  if (params.localitySlug) {
    where.locality = { slug: params.localitySlug };
  }
  return where;
}
