/**
 * Pure logic for the pinned (sponsored) listing shown at fixed positions in
 * browse lists. Nothing here touches the database — see
 * pinnedListingQuery.ts for the lookup and PropertyCardGrid for rendering.
 */

/** The listing pinned in every browse list — a real, published Property. */
export const PINNED_LISTING_SLUG = "aangan-resort";

/** 1-indexed positions on the first page of an unfiltered browse list. */
export const PINNED_POSITIONS: readonly number[] = [2, 12, 22];

export interface PinnedEntry<T> {
  property: T;
  /** True for a sponsored placement — rendered with a visible "Sponsored" label. */
  pinned: boolean;
  /** Unique per placement: the same listing can appear at several positions. */
  key: string;
}

/**
 * Inserts `pinned` at each 1-indexed position in `positions` across the
 * concatenation of `sections`, then splits the result back into the same
 * number of sections. A position is only used when the list already holds
 * at least position-1 other items, so a placement never dangles past the
 * end. The pinned listing is removed from the organic items first, so it
 * only ever shows at its fixed positions. A placement takes the section of
 * the item just before it. With `pinned === null` every entry is organic.
 */
export function pinListing<T extends { id: string }>(
  sections: T[][],
  pinned: T | null,
  positions: readonly number[] = PINNED_POSITIONS
): PinnedEntry<T>[][] {
  const flat: { section: number; entry: PinnedEntry<T> }[] = [];
  sections.forEach((items, section) => {
    for (const property of items) {
      if (pinned && property.id === pinned.id) continue;
      flat.push({ section, entry: { property, pinned: false, key: property.id } });
    }
  });

  if (pinned) {
    for (const position of [...positions].sort((a, b) => a - b)) {
      if (position < 1 || flat.length < position - 1) continue;
      const section = flat[Math.max(0, position - 2)]?.section ?? 0;
      flat.splice(position - 1, 0, {
        section,
        entry: { property: pinned, pinned: true, key: `${pinned.id}-pinned-${position}` },
      });
    }
  }

  const result: PinnedEntry<T>[][] = sections.map(() => []);
  for (const { section, entry } of flat) result[section].push(entry);
  return result;
}
