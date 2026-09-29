import { describe, expect, it } from "vitest";
import { formatEventDateRange } from "./EventCard";

describe("formatEventDateRange", () => {
  it("always shows IST wall-clock time, not UTC", () => {
    // 11:30 UTC is 17:00 IST.
    const startAt = new Date("2026-10-16T11:30:00.000Z");
    expect(formatEventDateRange(startAt, null)).toBe("16 Oct · 5:00 pm");
  });

  it("shows a time range for a same-day event", () => {
    const startAt = new Date("2026-10-16T11:30:00.000Z"); // 17:00 IST
    const endAt = new Date("2026-10-16T17:30:00.000Z"); // 23:00 IST
    expect(formatEventDateRange(startAt, endAt)).toBe("16 Oct · 5:00 pm–11:00 pm");
  });

  it("shows a date range for a multi-day event", () => {
    const startAt = new Date("2026-10-14T00:00:00.000Z");
    const endAt = new Date("2026-10-16T00:00:00.000Z");
    expect(formatEventDateRange(startAt, endAt)).toBe("14 Oct – 16 Oct");
  });
});
