import type { Prisma } from "@prisma/client";

/**
 * The trust filter reuses the exact same 3-way public collapse as
 * getPublicTrustTier() — "verified" bundles VERIFIED + OWNER_VERIFIED (the
 * product spec always treats these as one visitor-facing tier), everything
 * else is "discovery". No new verification state is introduced here.
 */
export const TRUST_FILTER_VALUES = ["verified", "discovery"] as const;
export type TrustFilterValue = (typeof TRUST_FILTER_VALUES)[number];

export const TRUST_FILTER_LABELS: Record<TrustFilterValue, string> = {
  verified: "Verified / Owner Verified",
  discovery: "Discovery listings",
};

export type QueryParam = string | string[] | undefined;

function toArray(value: QueryParam): string[] {
  if (Array.isArray(value)) return value;
  return value ? [value] : [];
}

/** "" / missing / anything not in TRUST_FILTER_VALUES all mean "no trust filter" (All listings) — never an error, never a made-up state. */
export function sanitizeTrustParam(value: QueryParam): TrustFilterValue | undefined {
  const first = toArray(value)[0];
  return (TRUST_FILTER_VALUES as readonly string[]).includes(first ?? "") ? (first as TrustFilterValue) : undefined;
}

/**
 * Drops any requested facility slug that doesn't match a real Facility row
 * — a stray/garbage `?facility=` value is silently ignored rather than
 * being applied as a filter guaranteed to match nothing (or erroring).
 * De-dupes and preserves the order the visitor requested them in.
 */
export function sanitizeFacilitySlugs(requested: QueryParam, validSlugs: string[]): string[] {
  const validSet = new Set(validSlugs);
  const result: string[] = [];
  for (const slug of toArray(requested)) {
    if (validSet.has(slug) && !result.includes(slug)) result.push(slug);
  }
  return result;
}

/** Adds the slug if absent, removes it if present — used to build each facility pill's toggle link. */
export function toggleFacilitySlug(current: string[], slug: string): string[] {
  return current.includes(slug) ? current.filter((s) => s !== slug) : [...current, slug];
}

export interface FacilityTrustFilterParams {
  facilitySlugs: string[];
  trust?: TrustFilterValue;
}

/**
 * A property must have EVERY requested facility (AND semantics — one
 * `facilities.some` clause per slug, combined via Prisma's implicit AND of
 * multiple where keys) — "parking AND wifi", not "parking OR wifi". Only
 * ever filters on facilities actually linked via PropertyFacility; never
 * assumes or infers one.
 */
export function buildFacilityTrustWhere(params: FacilityTrustFilterParams): Prisma.PropertyWhereInput {
  const where: Prisma.PropertyWhereInput = {};

  if (params.facilitySlugs.length > 0) {
    where.AND = params.facilitySlugs.map((slug) => ({
      facilities: { some: { facility: { slug } } },
    }));
  }

  if (params.trust === "verified") {
    where.verificationStatus = { in: ["VERIFIED", "OWNER_VERIFIED"] };
  } else if (params.trust === "discovery") {
    where.verificationStatus = { notIn: ["VERIFIED", "OWNER_VERIFIED"] };
  }

  return where;
}

export function hasActiveFacilityOrTrustFilter(params: FacilityTrustFilterParams): boolean {
  return params.facilitySlugs.length > 0 || Boolean(params.trust);
}

/**
 * True whenever a category/location page's URL carries ANY filter or sort
 * param (its own scoping param, sort, facility, or trust) — used by both
 * pages' generateMetadata to noindex every filtered/sorted variant, so the
 * bare category/location URL stays the only indexable one. Pulled out as
 * its own pure function so this SEO rule is directly unit-testable.
 * `scoping` is whichever param scopes the OTHER dimension on that page (the
 * category page passes its `location` param here; the location page passes
 * its `category` param).
 */
export function hasAnyFilterOrSort(params: { scoping?: QueryParam; sort?: QueryParam; facility?: QueryParam; trust?: QueryParam }): boolean {
  return Boolean(
    params.scoping ||
      params.sort ||
      (Array.isArray(params.facility) ? params.facility.length > 0 : params.facility) ||
      params.trust
  );
}

/**
 * Generic querystring builder shared by every filter/pagination link on the
 * public site (search, category, location, Pagination) — a drop-in
 * replacement for the small per-page `qs()` helpers that already existed
 * (identical behavior for plain string params: falsy values are omitted,
 * one `key=value` per entry), extended to also support an array value as
 * repeated `key=value&key=value2` params, which facility filters need.
 */
export function buildQueryString(params: Record<string, QueryParam>): string {
  const usp = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined) continue;
    if (Array.isArray(value)) {
      for (const v of value) if (v) usp.append(key, v);
    } else if (value) {
      usp.set(key, value);
    }
  }
  const s = usp.toString();
  return s ? `?${s}` : "";
}
