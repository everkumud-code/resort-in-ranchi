/**
 * Pure logic for sponsored listings pinned at fixed positions in browse
 * lists. Nothing here touches the database — see sponsoredListings.ts for
 * the lookup and PropertyCardGrid for rendering.
 */

/** The site's own listing — used to build its ad-space creative (see adCreative.ts). Not specially pinned any more; it's a normal SponsoredPlacement row like any other paid listing. */
export const PINNED_LISTING_SLUG = "aangan-resort-ranchi";

/**
 * A position is any 1-indexed slot on the first page of an unfiltered
 * browse list, up to this bound. An admin can assign any listing to any
 * position in this range, not just a fixed few — see PaidPlanPanel. Pinning
 * only ever applies to page 1, which currently holds PROPERTY_PAGE_SIZE (25)
 * organic items — a position beyond that never actually gets filled (see
 * pinListing's worst-case-length check), it's just reserved for later if the
 * page size ever grows.
 */
export const MAX_PINNED_POSITION = 100;

/** A listing with a sponsored placement — `positions` is whichever slots (1..MAX_PINNED_POSITION) an admin has assigned it. */
export interface Sponsor<T> {
  property: T;
  positions: number[];
}

export interface PinnedEntry<T> {
  property: T;
  /** True for a sponsored placement — rendered with a visible "Sponsored" label. */
  pinned: boolean;
  /** Unique per placement: the same listing can appear at several positions. */
  key: string;
}

/**
 * Inserts each sponsor at its own ticked positions across the concatenation
 * of `sections`, then splits the result back into the same number of
 * sections. When two sponsors tick the same position, the one earlier in
 * `sponsors` wins it; anyone who doesn't win a position they ticked simply
 * shows up organically instead of disappearing. A position is only used
 * when the (worst-case, every-sponsor-removed) list is long enough for it,
 * so a placement never dangles past the end.
 */
export function pinListing<T extends { id: string }>(
  sections: T[][],
  sponsors: Sponsor<T>[] | null
): PinnedEntry<T>[][] {
  const seen = new Set<string>();
  const list = (sponsors ?? []).filter((s) => !seen.has(s.property.id) && seen.add(s.property.id));
  const allSponsorIds = new Set(list.map((s) => s.property.id));

  // Worst-case count (every sponsor removed) decides which positions are structurally reachable.
  let worstCaseCount = 0;
  for (const items of sections) for (const property of items) if (!allSponsorIds.has(property.id)) worstCaseCount++;

  const candidatePositions = [...new Set(list.flatMap((s) => s.positions))].sort((a, b) => a - b);
  const takenPositions = new Set<number>();
  const placements: { position: number; sponsor: Sponsor<T> }[] = [];
  for (const position of candidatePositions) {
    if (position < 1 || worstCaseCount < position - 1) continue;
    const sponsor = list.find((s) => s.positions.includes(position) && !takenPositions.has(position));
    if (!sponsor) continue;
    takenPositions.add(position);
    placements.push({ position, sponsor });
  }

  const winningIds = new Set(placements.map((p) => p.sponsor.property.id));
  const flat: { section: number; entry: PinnedEntry<T> }[] = [];
  sections.forEach((items, section) => {
    for (const property of items) {
      if (winningIds.has(property.id)) continue;
      flat.push({ section, entry: { property, pinned: false, key: property.id } });
    }
  });

  for (const { position, sponsor } of placements) {
    const section = flat[Math.max(0, position - 2)]?.section ?? 0;
    flat.splice(position - 1, 0, {
      section,
      entry: { property: sponsor.property, pinned: true, key: `${sponsor.property.id}-pinned-${position}` },
    });
  }

  const result: PinnedEntry<T>[][] = sections.map(() => []);
  for (const { section, entry } of flat) result[section].push(entry);
  return result;
}
