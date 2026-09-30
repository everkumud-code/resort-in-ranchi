import { describe, expect, it } from "vitest";
import { pinListing, PINNED_POSITIONS, type Sponsor } from "./pinnedListing";

const item = (id: string) => ({ id });
const many = (n: number, prefix = "p") => Array.from({ length: n }, (_, i) => item(`${prefix}${i + 1}`));
const ids = (entries: { property: { id: string } }[]) => entries.map((e) => e.property.id);
const sponsor = (id: string, positions: number[] = [...PINNED_POSITIONS]): Sponsor<{ id: string }> => ({
  property: item(id),
  positions,
});

describe("pinListing", () => {
  const pinned = [sponsor("aangan")];

  it("puts the pinned listing at positions 2, 12 and 22 of a long list", () => {
    const [list] = pinListing([many(25)], pinned);
    for (const position of PINNED_POSITIONS) {
      expect(list[position - 1].pinned).toBe(true);
      expect(list[position - 1].property.id).toBe("aangan");
    }
    expect(list.filter((e) => e.pinned)).toHaveLength(3);
    expect(list).toHaveLength(28);
  });

  it("gives every placement a unique React key", () => {
    const [list] = pinListing([many(25)], pinned);
    expect(new Set(list.map((e) => e.key)).size).toBe(list.length);
  });

  it("keeps the organic order of everything else", () => {
    const [list] = pinListing([many(25)], pinned);
    expect(ids(list.filter((e) => !e.pinned))).toEqual(ids(many(25).map((property) => ({ property }))));
  });

  it("only uses positions the list is long enough for — never dangles past the end", () => {
    const [short] = pinListing([many(5)], pinned);
    expect(short.filter((e) => e.pinned)).toHaveLength(1);
    expect(short[1].pinned).toBe(true);
    const [medium] = pinListing([many(15)], pinned);
    expect(medium.filter((e) => e.pinned)).toHaveLength(2);
    expect(medium[11].pinned).toBe(true);
  });

  it("does not pin into an empty list", () => {
    const [empty] = pinListing([[]], pinned);
    expect(empty).toEqual([]);
  });

  it("removes the pinned listing from the organic items so it only shows at fixed positions", () => {
    const [list] = pinListing([[item("a"), item("aangan"), item("b"), item("c")]], pinned);
    expect(list.filter((e) => e.property.id === "aangan").every((e) => e.pinned)).toBe(true);
    expect(ids(list)).toEqual(["a", "aangan", "b", "c"]);
  });

  it("spans sections: placements take the section of the item before them and sections are preserved", () => {
    const [exact, extra] = pinListing([many(8, "e"), many(20, "s")], pinned);
    expect(exact.map((e) => e.property.id).slice(0, 2)).toEqual(["e1", "aangan"]);
    const all = [...exact, ...extra];
    expect(all[11].pinned).toBe(true);
    expect(all[21].pinned).toBe(true);
    expect(exact.filter((e) => !e.pinned)).toHaveLength(8);
    expect(extra.filter((e) => !e.pinned)).toHaveLength(20);
  });

  it("leaves everything organic when nothing is pinned", () => {
    const [list] = pinListing([many(3)], null);
    expect(list.every((e) => !e.pinned)).toBe(true);
    expect(ids(list)).toEqual(["p1", "p2", "p3"]);
  });
});

describe("pinListing — per-listing tickable positions", () => {
  const organic = many(25);

  it("only pins a sponsor at the positions it's ticked for", () => {
    const [list] = pinListing([organic], [sponsor("a", [2, 22])]);
    expect(list[1].pinned).toBe(true);
    expect(list[1].property.id).toBe("a");
    expect(list[11].pinned).toBe(false);
    expect(list[21].pinned).toBe(true);
    expect(list[21].property.id).toBe("a");
    expect(list.filter((e) => e.pinned)).toHaveLength(2);
  });

  it("leaves a slot organic when no sponsor has ticked it", () => {
    const [list] = pinListing([organic], [sponsor("a", [2])]);
    expect(list.filter((e) => e.pinned)).toHaveLength(1);
    expect(list[11].pinned).toBe(false);
    expect(list[21].pinned).toBe(false);
  });

  it("a sponsor with no ticked positions shows up organically instead of disappearing", () => {
    const [list] = pinListing([[{ id: "a" }, ...organic]], [sponsor("a", [])]);
    expect(list.filter((e) => e.pinned)).toHaveLength(0);
    expect(list.some((e) => e.property.id === "a")).toBe(true);
  });
});

describe("pinListing with several sponsors", () => {
  it("gives each sponsor only its own ticked slot", () => {
    const organic = many(25);
    const [list] = pinListing([organic], [sponsor("a", [2]), sponsor("b", [12]), sponsor("c", [22])]);
    expect([list[1], list[11], list[21]].map((e) => e.property.id)).toEqual(["a", "b", "c"]);
  });

  it("the earlier sponsor in the list wins a slot both tick, the later one falls back to organic", () => {
    const organic = [...many(1, "x"), { id: "b" }, ...many(23, "y")];
    const [list] = pinListing([organic], [sponsor("a", [2]), sponsor("b", [2])]);
    expect(list[1].property.id).toBe("a");
    expect(list[1].pinned).toBe(true);
    expect(list.some((e) => e.property.id === "b" && !e.pinned)).toBe(true);
  });

  it("never lists a sponsor organically at any position it won, and ignores duplicate entries for the same sponsor", () => {
    const a = sponsor("a", [2, 22]);
    const b = sponsor("b", [12]);
    const organic = many(25);
    const [list] = pinListing([[{ id: "a" }, ...organic, { id: "b" }]], [a, a, b]);
    expect(list.filter((e) => !e.pinned).some((e) => e.property.id === "a" || e.property.id === "b")).toBe(false);
    expect(new Set(list.map((e) => e.key)).size).toBe(list.length);
  });

  it("an empty sponsor list changes nothing", () => {
    const organic = many(25);
    const [list] = pinListing([organic], []);
    expect(list.every((e) => !e.pinned)).toBe(true);
    expect(list).toHaveLength(25);
  });
});
