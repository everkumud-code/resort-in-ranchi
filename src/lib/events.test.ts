import { describe, expect, it } from "vitest";
import { classifyEvents, isEventPast, isEventToday, isEventUpcoming } from "./events";

const now = new Date("2026-09-29T12:00:00Z");
const ev = (id: string, startAt: string, endAt: string | null = null, sponsored = false, priority = 0) => ({
  id,
  startAt: new Date(startAt),
  endAt: endAt ? new Date(endAt) : null,
  sponsored,
  priority,
});

describe("isEventToday / isEventUpcoming / isEventPast", () => {
  it("a same-day event with no endAt is today, and past once the day is over", () => {
    const e = ev("a", "2026-09-29T06:00:00Z");
    expect(isEventToday(e, now)).toBe(true);
    expect(isEventPast(e, now)).toBe(false);
    expect(isEventPast(e, new Date("2026-09-30T00:00:01Z"))).toBe(true);
  });

  it("a multi-day event is today throughout its span, upcoming before, past after", () => {
    const e = ev("a", "2026-09-28T00:00:00Z", "2026-09-30T00:00:00Z");
    expect(isEventToday(e, now)).toBe(true);
    expect(isEventUpcoming(e, new Date("2026-09-27T00:00:00Z"))).toBe(true);
    expect(isEventPast(e, new Date("2026-10-01T00:00:00Z"))).toBe(true);
  });

  it("a future event is upcoming, not today", () => {
    const e = ev("a", "2026-10-05T10:00:00Z");
    expect(isEventUpcoming(e, now)).toBe(true);
    expect(isEventToday(e, now)).toBe(false);
  });
});

describe("classifyEvents", () => {
  it("splits into today / upcoming (chronological) and drops events already over", () => {
    const events = [
      ev("past", "2026-09-01T00:00:00Z"),
      ev("today", "2026-09-29T08:00:00Z"),
      ev("upcoming1", "2026-10-10T00:00:00Z"),
      ev("upcoming2", "2026-10-01T00:00:00Z"),
    ];
    const sections = classifyEvents(events, now);
    expect(sections.today.map((e) => e.id)).toEqual(["today"]);
    expect(sections.upcoming.map((e) => e.id)).toEqual(["upcoming2", "upcoming1"]);
    expect(sections.today.concat(sections.upcoming).some((e) => e.id === "past")).toBe(false);
  });

  it("a sponsored event also appears in Today/Upcoming — sponsorship adds a highlighted row, it never hides the event from the normal list", () => {
    const todayAndSponsored = ev("both", "2026-09-29T08:00:00Z", null, true);
    const upcomingAndSponsored = ev("later", "2026-10-15T00:00:00Z", null, true);
    const sections = classifyEvents([todayAndSponsored, upcomingAndSponsored], now);
    expect(sections.today.map((e) => e.id)).toEqual(["both"]);
    expect(sections.upcoming.map((e) => e.id)).toEqual(["later"]);
    expect(sections.sponsored.map((e) => e.id).sort()).toEqual(["both", "later"]);
  });

  it("a sponsored event that has already finished drops out of every section", () => {
    const sections = classifyEvents([ev("done", "2026-09-01T00:00:00Z", null, true)], now);
    expect(sections.sponsored).toEqual([]);
  });

  it("orders by priority first, then soonest start", () => {
    const events = [ev("low", "2026-10-01T00:00:00Z", null, true, 0), ev("high", "2026-10-10T00:00:00Z", null, true, 5)];
    expect(classifyEvents(events, now).sponsored.map((e) => e.id)).toEqual(["high", "low"]);
  });
});
