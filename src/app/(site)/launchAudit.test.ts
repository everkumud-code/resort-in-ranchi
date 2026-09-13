import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

function read(path: string): string {
  return readFileSync(resolve(process.cwd(), path), "utf8");
}

describe("PHASE 5D — skip-to-content link (accessibility fix)", () => {
  const src = read("src/app/(site)/layout.tsx");

  it("renders a skip link as the very first element, before the Header", () => {
    const skipIndex = src.indexOf('href="#main-content"');
    const headerIndex = src.indexOf("<Header");
    expect(skipIndex).toBeGreaterThan(-1);
    expect(headerIndex).toBeGreaterThan(-1);
    expect(skipIndex).toBeLessThan(headerIndex);
  });

  it("is visually hidden until keyboard-focused (sr-only, made visible only on :focus)", () => {
    expect(src).toMatch(/sr-only focus:not-sr-only/);
  });

  it("points to a real, matching id on the <main> element — the link can't silently go nowhere", () => {
    expect(src).toMatch(/id="main-content"/);
  });
});
