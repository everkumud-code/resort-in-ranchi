import { prisma } from "@/lib/prisma";
import { SLUG_PATTERN } from "@/lib/validation/shared";
import { publicPropertySelect, publicPropertyCardSelect, publishedOnly, type PublicProperty, type PublicPropertyCard } from "./properties";
import { MAX_COMPARE_PROPERTIES } from "./compareConstants";

export { MAX_COMPARE_PROPERTIES, MIN_COMPARE_PROPERTIES } from "./compareConstants";

type QueryParam = string | string[] | undefined;

function toArray(value: QueryParam): string[] {
  return Array.isArray(value) ? value : value ? [value] : [];
}

/**
 * Sanitizes visitor-supplied slugs from the repeated `?property=` query
 * param: drops blank/whitespace-only values, drops anything that doesn't
 * even look like a real slug (SLUG_PATTERN — the same rule slugs are
 * validated against everywhere else in this codebase), de-dupes, and caps
 * at MAX_COMPARE_PROPERTIES. This is the ONLY thing that decides how many
 * slugs are even looked up — a client claiming 20 properties in the URL
 * never reaches the database with more than 4.
 */
export function sanitizeCompareSlugs(requested: QueryParam): string[] {
  const result: string[] = [];
  for (const raw of toArray(requested)) {
    const slug = raw.trim();
    if (!slug) continue;
    if (!SLUG_PATTERN.test(slug)) continue;
    if (result.includes(slug)) continue;
    result.push(slug);
    if (result.length >= MAX_COMPARE_PROPERTIES) break;
  }
  return result;
}

/**
 * Pure ordering/lookup step, separate from the database call so it's
 * directly unit-testable: given the sanitized slugs (in the order the
 * visitor selected them) and whatever rows the DB actually returned for
 * `slug IN (...)` + `status = PUBLISHED`, produces the properties in the
 * requested order — and simply OMITS any slug with no matching row. A row
 * is missing exactly when the slug doesn't exist, isn't published, or
 * belongs to a protected/identity-conflict/NEEDS_REVIEW record — all of
 * which are structurally never PUBLISHED (see bulkPublish.ts) — there is no
 * separate ID-based exclusion list here; publishedOnly() is the sole gate.
 */
export function mapSlugsToProperties<T extends { slug: string }>(slugs: string[], rows: T[]): T[] {
  const bySlug = new Map(rows.map((r) => [r.slug, r]));
  const result: T[] = [];
  for (const slug of slugs) {
    const row = bySlug.get(slug);
    if (row) result.push(row);
  }
  return result;
}

/** Resolves sanitized slugs to real, published properties in exactly one query — never one query per property. */
export async function getComparableProperties(slugs: string[]): Promise<PublicProperty[]> {
  if (slugs.length === 0) return [];
  const rows = await prisma.property.findMany({
    where: publishedOnly({ slug: { in: slugs } }),
    select: publicPropertySelect,
  });
  return mapSlugsToProperties(slugs, rows);
}

/**
 * "Not provided" for anything null/empty/absent — never a bare 0, never an
 * ambiguous "N/A", never an invented or inferred value. Numbers are passed
 * through as-is when present (a real 0 price/rooms count would be a real
 * fact, not currently possible given today's data, but this function
 * doesn't assume that — it only ever fills in for null/undefined/blank).
 */
export function formatCompareValue(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return "Not provided";
  if (typeof value === "string" && value.trim() === "") return "Not provided";
  return String(value);
}

/**
 * A prominent, honest "you might also want to compare" suggestion —
 * reuses the exact same `featured` merchandising flag that already drives
 * the homepage's "Featured listings" section and default sort order (see
 * properties.ts), rather than inventing a separate mechanism. Whatever is
 * currently featured is suggested; it is never hardcoded to a specific
 * property by name or id here.
 */
export async function getCompareSuggestion(excludeSlugs: string[]): Promise<PublicPropertyCard | null> {
  return prisma.property.findFirst({
    where: publishedOnly({ featured: true, slug: { notIn: excludeSlugs } }),
    select: publicPropertyCardSelect,
    orderBy: { createdAt: "desc" },
  });
}

/**
 * Pure eligibility check, kept separate from the DB fetch so it's directly
 * testable: a suggestion is only ever shown when it exists, isn't already
 * part of the visitor's own selection, and there's room left to add it
 * (never silently replaces or exceeds the visitor's MAX_COMPARE_PROPERTIES
 * choices).
 */
export function compareSuggestionEligible(params: { suggestionSlug: string | null; selectedSlugs: string[] }): boolean {
  if (!params.suggestionSlug) return false;
  if (params.selectedSlugs.includes(params.suggestionSlug)) return false;
  if (params.selectedSlugs.length >= MAX_COMPARE_PROPERTIES) return false;
  return true;
}

/**
 * Additive only — always carries forward every slug the visitor already
 * selected, appending the suggestion rather than replacing the query
 * string. Following this link is the only way the suggestion is ever added;
 * nothing here auto-injects it into an existing comparison.
 */
export function buildAddToCompareHref(selectedSlugs: string[], suggestionSlug: string): string {
  const params = new URLSearchParams();
  for (const slug of selectedSlugs) params.append("property", slug);
  params.append("property", suggestionSlug);
  return `/compare?${params.toString()}`;
}
