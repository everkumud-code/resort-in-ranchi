import { describe, expect, it } from "vitest";
import robots from "./robots";

describe("PHASE 4 — robots.ts disallows every private/utility surface", () => {
  const rules = robots().rules;
  const disallow = Array.isArray(rules) ? rules.flatMap((r) => r.disallow ?? []) : (rules.disallow ?? []);

  it("disallows /admin (admin console, never public)", () => {
    expect(disallow).toContain("/admin");
  });

  it("disallows /owner (owner dashboard/listing editor — authentication-gated, same treatment as /admin)", () => {
    expect(disallow).toContain("/owner");
  });

  it("disallows /search (a filter surface, not unique indexable content)", () => {
    expect(disallow).toContain("/search");
  });

  it("still points to the real sitemap", () => {
    expect(robots().sitemap).toMatch(/\/sitemap\.xml$/);
  });
});
