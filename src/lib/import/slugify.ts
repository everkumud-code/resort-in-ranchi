const COMBINING_DIACRITICS = new RegExp("[\\u0300-\\u036f]", "g");

/**
 * Turn arbitrary text into a URL-safe slug segment.
 * "Aangan Resort & Spa" -> "aangan-resort-and-spa"
 */
export function slugify(input: string): string {
  return input
    .normalize("NFKD")
    .replace(COMBINING_DIACRITICS, "")
    .toLowerCase()
    .trim()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

/**
 * Produce a slug that does not collide with any slug already in `taken`.
 * Appends -2, -3, ... on collision. Adds the winning slug to `taken`.
 */
export function uniqueSlug(base: string, taken: Set<string>): string {
  const root = slugify(base) || "listing";
  let candidate = root;
  let suffix = 2;
  while (taken.has(candidate)) {
    candidate = `${root}-${suffix}`;
    suffix += 1;
  }
  taken.add(candidate);
  return candidate;
}
