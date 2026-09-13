import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { getServerSnapshot, getSnapshot, parse } from "./CompareProvider";
import { MAX_COMPARE_PROPERTIES } from "@/lib/public/compareConstants";

describe("PHASE 3F — getServerSnapshot is referentially stable (regression for the 'should be cached' warning)", () => {
  it("returns the exact same array reference on every call — the root cause of the original warning was a fresh [] literal each call", () => {
    const first = getServerSnapshot();
    const second = getServerSnapshot();
    const third = getServerSnapshot();
    expect(first).toBe(second);
    expect(second).toBe(third);
  });

  it("returns an empty array — the server never has localStorage to read from", () => {
    expect(getServerSnapshot()).toEqual([]);
  });
});

describe("PHASE 3F — getSnapshot stays referentially stable across repeated calls with no change", () => {
  it("returns the same reference when called twice back to back (no write in between)", () => {
    const first = getSnapshot();
    const second = getSnapshot();
    expect(first).toBe(second);
  });
});

describe("PHASE 3F — parse() never allocates a fresh empty array for equivalent 'nothing selected' inputs", () => {
  it("parse(null) and parse('[]') return the same shared empty-array reference", () => {
    expect(parse(null)).toBe(parse("[]"));
  });

  it("parse('') (falsy) also returns the shared empty reference", () => {
    expect(parse("")).toBe(parse(null));
  });

  it("invalid JSON never throws — degrades to the shared empty reference", () => {
    expect(() => parse("not valid json{")).not.toThrow();
    expect(parse("not valid json{")).toBe(parse(null));
  });

  it("valid JSON that isn't an array degrades to the shared empty reference", () => {
    expect(parse('{"a":1}')).toBe(parse(null));
  });
});

describe("PHASE 3F — compare behaviour preserved: 4-property limit and item shape filtering", () => {
  it("truncates a stored selection longer than MAX_COMPARE_PROPERTIES", () => {
    const stored = Array.from({ length: 10 }, (_, i) => ({ slug: `slug-${i}`, name: `Name ${i}`, thumbnailUrl: null }));
    const result = parse(JSON.stringify(stored));
    expect(result).toHaveLength(MAX_COMPARE_PROPERTIES);
    expect(result[0]).toEqual({ slug: "slug-0", name: "Name 0", thumbnailUrl: null });
  });

  it("drops malformed entries (missing slug/name) while keeping valid ones", () => {
    const stored = [
      { slug: "valid-one", name: "Valid One", thumbnailUrl: null },
      { name: "Missing slug" },
      { slug: "missing-name" },
      null,
      "not-an-object",
      { slug: "valid-two", name: "Valid Two", thumbnailUrl: "https://example.com/a.jpg" },
    ];
    const result = parse(JSON.stringify(stored));
    expect(result).toEqual([
      { slug: "valid-one", name: "Valid One", thumbnailUrl: null },
      { slug: "valid-two", name: "Valid Two", thumbnailUrl: "https://example.com/a.jpg" },
    ]);
  });

  it("preserves a real selection exactly (order and fields), not just the empty case", () => {
    const stored = [
      { slug: "aangan-resort", name: "Aangan Resort", thumbnailUrl: "https://example.com/aangan.jpg" },
      { slug: "hotel-the-raso", name: "Hotel The Raso", thumbnailUrl: null },
    ];
    expect(parse(JSON.stringify(stored))).toEqual(stored);
  });
});

describe("PHASE 3F — cross-tab sync and useSyncExternalStore wiring unchanged", () => {
  const src = readFileSync(resolve(process.cwd(), "src/components/site/CompareProvider.tsx"), "utf8");

  it("still subscribes to the native storage event for cross-tab sync", () => {
    expect(src).toMatch(/window\.addEventListener\("storage", listener\)/);
    expect(src).toMatch(/window\.removeEventListener\("storage", listener\)/);
  });

  it("still wires useSyncExternalStore with subscribe/getSnapshot/getServerSnapshot in that order", () => {
    expect(src).toMatch(/useSyncExternalStore\(subscribe, getSnapshot, getServerSnapshot\)/);
  });

  it("still persists to the same localStorage key (rir_compare_v1) — no storage migration introduced", () => {
    expect(src).toMatch(/STORAGE_KEY = "rir_compare_v1"/);
  });

  it("writeItems still forces the cache to re-read on the next getSnapshot() call after a write", () => {
    expect(src).toMatch(/cachedRaw = undefined;/);
  });
});
