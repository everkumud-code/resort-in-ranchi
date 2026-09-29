/**
 * Pure classification/ordering logic for the homepage's Today's / Sponsored /
 * Upcoming Events sections and the /events page. Nothing here touches the
 * database — see eventQueries.ts for the actual reads.
 */

export interface EventLike {
  id: string;
  startAt: Date;
  endAt: Date | null;
  sponsored: boolean;
  priority: number;
}

function isSameCalendarDay(a: Date, b: Date): boolean {
  return a.getUTCFullYear() === b.getUTCFullYear() && a.getUTCMonth() === b.getUTCMonth() && a.getUTCDate() === b.getUTCDate();
}

/** An event's own effective end — a single-day event with no endAt ends when its day does. */
function effectiveEnd(event: EventLike): Date {
  if (event.endAt) return event.endAt;
  const end = new Date(event.startAt);
  end.setUTCHours(23, 59, 59, 999);
  return end;
}

export function isEventPast(event: EventLike, now: Date = new Date()): boolean {
  return effectiveEnd(event).getTime() < now.getTime();
}

/** True when `now` falls anywhere from the event's start through its effective end, or it starts today. */
export function isEventToday(event: EventLike, now: Date = new Date()): boolean {
  if (isSameCalendarDay(event.startAt, now)) return true;
  return event.startAt.getTime() <= now.getTime() && now.getTime() <= effectiveEnd(event).getTime();
}

export function isEventUpcoming(event: EventLike, now: Date = new Date()): boolean {
  return event.startAt.getTime() > now.getTime() && !isEventToday(event, now);
}

const byPriorityThenSoonest = <T extends EventLike>(a: T, b: T) => b.priority - a.priority || a.startAt.getTime() - b.startAt.getTime();

export interface EventSections<T extends EventLike> {
  sponsored: T[];
  today: T[];
  upcoming: T[];
}

/**
 * Splits a set of (already-published) events into the homepage's three
 * sections. Sponsored is its own section regardless of date, as long as the
 * event hasn't already finished — a sponsored event never keeps showing
 * after it's over. An event that is both sponsored and happening today
 * appears in both sections (paid visibility is additive, not exclusive).
 */
export function classifyEvents<T extends EventLike>(events: T[], now: Date = new Date()): EventSections<T> {
  const live = events.filter((e) => !isEventPast(e, now));
  return {
    sponsored: live.filter((e) => e.sponsored).sort(byPriorityThenSoonest),
    today: live.filter((e) => isEventToday(e, now)).sort(byPriorityThenSoonest),
    upcoming: live.filter((e) => isEventUpcoming(e, now)).sort(byPriorityThenSoonest),
  };
}
