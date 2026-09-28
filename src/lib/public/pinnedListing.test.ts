import { describe, expect, it } from "vitest";
import { pinListing, PINNED_POSITIONS } from "./pinnedListing";

const item = (id: string) => ({ id });
const many = (n: number, prefix = "p") => Array.from({ length: n }, (_, i) => item(`${prefix}${i + 1}`));
const ids = (entries: { property: { id: string } }[]) => entries.map((e) => e.property.id);

describe("pinListing", () => {
  const pinned = item("aangan");

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

describe("pinListing with several sponsors", () => {
  const a = { id: "a" };
  const b = { id: "b" };
  const c = { id: "c" };
  const organic = Array.from({ length: 25 }, (_, i) => ({ id: `p${i + 1}` }));

  it("shares the slots between sponsors in order, wrapping around", () => {
    const [list] = pinListing([organic], [a, b]);
    expect(list[1].property.id).toBe("a");
    expect(list[11].property.id).toBe("b");
    expect(list[21].property.id).toBe("a");
  });

  it("gives three sponsors one slot each", () => {
    const [list] = pinListing([organic], [a, b, c]);
    expect([list[1], list[11], list[21]].map((e) => e.property.id)).toEqual(["a", "b", "c"]);
  });

  it("never lists a sponsor organically and ignores duplicates", () => {
    const [list] = pinListing([[a, ...organic, b]], [a, a, b]);
    expect(list.filter((e) => !e.pinned).some((e) => e.property.id === "a" || e.property.id === "b")).toBe(false);
    expect(new Set(list.map((e) => e.key)).size).toBe(list.length);
  });

  it("an empty sponsor list changes nothing", () => {
    const [list] = pinListing([organic], []);
    expect(list.every((e) => !e.pinned)).toBe(true);
    expect(list).toHaveLength(25);
  });
});
