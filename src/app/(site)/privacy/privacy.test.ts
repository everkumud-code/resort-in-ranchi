import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

function read(path: string): string {
  return readFileSync(resolve(process.cwd(), path), "utf8");
}

const src = read("src/app/(site)/privacy/page.tsx");

describe("PHASE 6 — privacy policy honestly discloses the Lead Partner sharing exception", () => {
  it("no longer makes the old unqualified 'we do not share with any third party' claim", () => {
    expect(src).not.toMatch(/We do not sell, rent, or share this information with any third party, and we do not use it for advertising\./);
  });

  it("discloses that a small number of categories may share enquiry details with a partner venue", () => {
    expect(src).toMatch(/partner venue/);
    expect(src).toMatch(/the enquiry page tells you before you submit/);
  });

  it("still states the narrower non-sharing guarantee for every other, undisclosed case", () => {
    expect(src).toMatch(/Outside of that one, disclosed case, we do not sell, rent, or share/);
  });

  it("mentions Add Your Property submissions as a collected data source", () => {
    expect(src).toMatch(/Add Your Property submissions/);
  });
});
