const SKIPPED_WORDS = new Set(["the", "and", "of", "a", "an", "&"]);

/**
 * Pure — up to two initials from a business name, used as a generated
 * identity mark when a listing has no real photo or logo. Deliberately never
 * presented as the business's official logo; it only gives every card/hero a
 * distinct, honest visual anchor instead of an anonymous blank box.
 */
export function getMonogram(name: string): string {
  const words = name
    .split(/\s+/)
    .map((w) => w.replace(/[^\p{L}\p{N}]/gu, ""))
    .filter((w) => w.length > 0);
  const significant = words.filter((w) => !SKIPPED_WORDS.has(w.toLowerCase()));
  const source = significant.length > 0 ? significant : words;
  if (source.length === 0) return "";
  const initials = source.length === 1 ? Array.from(source[0]).slice(0, 2) : [Array.from(source[0])[0], Array.from(source[1])[0]];
  return initials.join("").toUpperCase();
}
