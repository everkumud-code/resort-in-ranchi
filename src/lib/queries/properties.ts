import type { Prisma } from "@prisma/client";

export const PROPERTY_PAGE_SIZE = 25;

export type PropertySort = "name" | "newest" | "status";

export interface PropertyFilters {
  search?: string | null;
  categorySlug?: string | null;
  localitySlug?: string | null;
  status?: string | null;
  verificationStatus?: string | null;
  /** Bonus filter used from the data-quality page: properties missing one particular contact field. */
  missingField?: "phone" | "website" | "address" | "email" | null;
  /** Dashboard quick-link filters (?claimed=true / ?featured=true) — booleans, so only ever applied when explicitly true; there is no "claimed=false" link anywhere. */
  claimed?: boolean | null;
  featured?: boolean | null;
  /** Used from the vendors/commercial-status page. */
  commercialTier?: string | null;
}

/** Pure — builds a Prisma `where` clause from validated filter inputs. */
export function buildPropertyWhereClause(filters: PropertyFilters): Prisma.PropertyWhereInput {
  const where: Prisma.PropertyWhereInput = {};

  if (filters.search && filters.search.trim() !== "") {
    where.name = { contains: filters.search.trim(), mode: "insensitive" };
  }
  if (filters.categorySlug) {
    where.category = { slug: filters.categorySlug };
  }
  if (filters.localitySlug) {
    where.locality = { slug: filters.localitySlug };
  }
  if (filters.status) {
    where.status = filters.status as Prisma.PropertyWhereInput["status"];
  }
  if (filters.verificationStatus) {
    where.verificationStatus = filters.verificationStatus as Prisma.PropertyWhereInput["verificationStatus"];
  }
  if (filters.missingField) {
    where[filters.missingField] = null;
  }
  if (filters.claimed) {
    where.claimed = true;
  }
  if (filters.featured) {
    where.featured = true;
  }
  if (filters.commercialTier) {
    where.commercialTier = filters.commercialTier as Prisma.PropertyWhereInput["commercialTier"];
  }

  return where;
}

/** Pure — maps a sort key to a Prisma orderBy clause. */
export function buildPropertyOrderBy(sort: PropertySort | null | undefined): Prisma.PropertyOrderByWithRelationInput {
  switch (sort) {
    case "name":
      return { name: "asc" };
    case "status":
      return { status: "asc" };
    case "newest":
    default:
      return { createdAt: "desc" };
  }
}

export function parsePage(raw: string | undefined): number {
  const n = Number(raw);
  return Number.isFinite(n) && n >= 1 ? Math.trunc(n) : 1;
}

export function computePagination(page: number, totalCount: number, pageSize = PROPERTY_PAGE_SIZE) {
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);
  return {
    skip: (safePage - 1) * pageSize,
    take: pageSize,
    page: safePage,
    totalPages,
  };
}
