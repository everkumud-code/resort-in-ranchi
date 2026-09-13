import { describe, expect, it } from "vitest";
import {
  buildPropertyOrderBy,
  buildPropertyWhereClause,
  computePagination,
  parsePage,
} from "./properties";

describe("buildPropertyWhereClause", () => {
  it("returns an empty filter when nothing is set", () => {
    expect(buildPropertyWhereClause({})).toEqual({});
  });

  it("filters by case-insensitive name search", () => {
    const where = buildPropertyWhereClause({ search: "  Aangan  " });
    expect(where.name).toEqual({ contains: "Aangan", mode: "insensitive" });
  });

  it("ignores an empty/blank search string", () => {
    expect(buildPropertyWhereClause({ search: "   " })).toEqual({});
  });

  it("filters by category slug", () => {
    const where = buildPropertyWhereClause({ categorySlug: "resorts" });
    expect(where.category).toEqual({ slug: "resorts" });
  });

  it("filters by locality slug", () => {
    const where = buildPropertyWhereClause({ localitySlug: "lalpur" });
    expect(where.locality).toEqual({ slug: "lalpur" });
  });

  it("filters by verification status", () => {
    const where = buildPropertyWhereClause({ verificationStatus: "NEEDS_REVIEW" });
    expect(where.verificationStatus).toBe("NEEDS_REVIEW");
  });

  it("filters by publish status", () => {
    const where = buildPropertyWhereClause({ status: "PUBLISHED" });
    expect(where.status).toBe("PUBLISHED");
  });

  it("filters by a missing field", () => {
    const where = buildPropertyWhereClause({ missingField: "phone" });
    expect(where.phone).toBeNull();
  });

  it("filters by claimed=true", () => {
    expect(buildPropertyWhereClause({ claimed: true })).toEqual({ claimed: true });
  });

  it("never adds a claimed=false clause — the filter is a quick link for 'claimed only', not a toggle", () => {
    expect(buildPropertyWhereClause({ claimed: false })).toEqual({});
    expect(buildPropertyWhereClause({ claimed: null })).toEqual({});
  });

  it("filters by featured=true", () => {
    expect(buildPropertyWhereClause({ featured: true })).toEqual({ featured: true });
  });

  it("never adds a featured=false clause", () => {
    expect(buildPropertyWhereClause({ featured: false })).toEqual({});
    expect(buildPropertyWhereClause({ featured: null })).toEqual({});
  });

  it("filters by commercial tier", () => {
    expect(buildPropertyWhereClause({ commercialTier: "PREMIUM" })).toEqual({ commercialTier: "PREMIUM" });
  });

  it("omits the commercial tier clause when not set", () => {
    expect(buildPropertyWhereClause({ commercialTier: null })).toEqual({});
  });

  it("combines multiple filters, including status and verificationStatus together", () => {
    const where = buildPropertyWhereClause({
      search: "hotel",
      categorySlug: "hotels",
      localitySlug: "ranchi",
      status: "DRAFT",
      verificationStatus: "DISCOVERED",
    });
    expect(where).toMatchObject({
      name: { contains: "hotel", mode: "insensitive" },
      category: { slug: "hotels" },
      locality: { slug: "ranchi" },
      status: "DRAFT",
      verificationStatus: "DISCOVERED",
    });
  });
});

describe("buildPropertyOrderBy", () => {
  it("defaults to newest first", () => {
    expect(buildPropertyOrderBy(undefined)).toEqual({ createdAt: "desc" });
    expect(buildPropertyOrderBy(null)).toEqual({ createdAt: "desc" });
  });

  it("sorts by name ascending", () => {
    expect(buildPropertyOrderBy("name")).toEqual({ name: "asc" });
  });

  it("sorts by status", () => {
    expect(buildPropertyOrderBy("status")).toEqual({ status: "asc" });
  });
});

describe("parsePage", () => {
  it("defaults to page 1 for missing/invalid input", () => {
    expect(parsePage(undefined)).toBe(1);
    expect(parsePage("abc")).toBe(1);
    expect(parsePage("0")).toBe(1);
    expect(parsePage("-3")).toBe(1);
  });

  it("parses a valid page number", () => {
    expect(parsePage("4")).toBe(4);
  });

  it("truncates a fractional page number", () => {
    expect(parsePage("2.9")).toBe(2);
  });
});

describe("computePagination", () => {
  it("computes skip/take for a normal page", () => {
    const result = computePagination(2, 100, 25);
    expect(result).toEqual({ skip: 25, take: 25, page: 2, totalPages: 4 });
  });

  it("clamps a page number beyond the last page", () => {
    const result = computePagination(99, 30, 25);
    expect(result.page).toBe(2);
    expect(result.totalPages).toBe(2);
  });

  it("clamps a page number below 1", () => {
    const result = computePagination(0, 30, 25);
    expect(result.page).toBe(1);
  });

  it("returns exactly one page when there are no results", () => {
    const result = computePagination(1, 0, 25);
    expect(result).toEqual({ skip: 0, take: 25, page: 1, totalPages: 1 });
  });
});
