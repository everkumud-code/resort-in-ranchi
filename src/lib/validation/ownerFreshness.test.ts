import { describe, expect, it } from "vitest";
import { computeOwnerFreshness, daysSince } from "./ownerFreshness";

const now = new Date("2026-09-28T12:00:00Z");

describe("ownerFreshness", () => {
  it("counts whole days and never goes negative", () => {
    expect(daysSince(new Date("2026-09-28T01:00:00Z"), now)).toBe(0);
    expect(daysSince(new Date("2026-09-25T12:00:00Z"), now)).toBe(3);
    expect(daysSince(new Date("2026-10-05T00:00:00Z"), now)).toBe(0);
  });

  it("marks a listing stale from 30 days without an update", () => {
    expect(computeOwnerFreshness(new Date("2026-08-30T12:00:00Z"), now)).toEqual({ days: 29, stale: false });
    expect(computeOwnerFreshness(new Date("2026-08-29T12:00:00Z"), now)).toEqual({ days: 30, stale: true });
  });
});
