export const OWNER_STALE_AFTER_DAYS = 30;

/** Whole days between `updatedAt` and `now` (never negative). */
export function daysSince(updatedAt: Date, now: Date = new Date()): number {
  return Math.max(0, Math.floor((now.getTime() - updatedAt.getTime()) / (24 * 60 * 60 * 1000)));
}

export interface OwnerFreshness {
  days: number;
  stale: boolean;
}

/** How fresh a listing is for the vendor dashboard reminder: stale once it has gone OWNER_STALE_AFTER_DAYS without an update. */
export function computeOwnerFreshness(updatedAt: Date, now: Date = new Date()): OwnerFreshness {
  const days = daysSince(updatedAt, now);
  return { days, stale: days >= OWNER_STALE_AFTER_DAYS };
}
