import { describe, expect, it } from "vitest";
import {
  AD_FORMATS,
  AD_LADDERS,
  buildStepVisibilityClass,
  resolveAdLadder,
  type AdLadderName,
} from "./adFormats";

describe("AD_FORMATS catalog covers every requested ad size", () => {
  const expectedSizes: [number, number][] = [
    [1200, 630],
    [970, 250],
    [728, 90],
    [468, 60],
    [320, 100],
    [300, 250],
    [336, 280],
    [300, 600],
    [160, 600],
    [120, 600],
    [120, 240],
  ];

  it("has exactly one catalog entry per requested pixel size", () => {
    const actualSizes = Object.values(AD_FORMATS).map((f): [number, number] => [f.width, f.height]);
    for (const size of expectedSizes) {
      expect(actualSizes).toContainEqual(size);
    }
    expect(actualSizes).toHaveLength(expectedSizes.length);
  });

  it("every format's own id matches its key in the catalog", () => {
    for (const [key, format] of Object.entries(AD_FORMATS)) {
      expect(format.id).toBe(key);
    }
  });
});

describe("AD_LADDERS never forces every format onto every screen", () => {
  it("no single ladder uses every catalog format — each is a curated subset", () => {
    for (const steps of Object.values(AD_LADDERS)) {
      expect(steps.length).toBeLessThan(Object.keys(AD_FORMATS).length);
    }
  });

  it("the rail ladder renders nothing below 'lg' — no sidebar rail exists on mobile/tablet", () => {
    expect(AD_LADDERS.rail[0].breakpoint).toBe("lg");
  });

  it("only the homepage 'hero' ladder ever reaches the full 1200x630 hero format", () => {
    for (const [name, steps] of Object.entries(AD_LADDERS) as [AdLadderName, typeof AD_LADDERS.hero][]) {
      const usesHero = steps.some((s) => s.formatId === "hero");
      expect(usesHero).toBe(name === "hero");
    }
  });

  it("the banner ladder (category/location/search) caps out at leaderboard, never the full hero size", () => {
    const formatIds = AD_LADDERS.banner.map((s) => s.formatId);
    expect(formatIds).toContain("leaderboard");
    expect(formatIds).not.toContain("hero");
  });
});

describe("hand-authored visibilityClass strings never drift from the pure logic that defines them", () => {
  for (const [ladderName, steps] of Object.entries(AD_LADDERS)) {
    for (let i = 0; i < steps.length; i++) {
      it(`${ladderName}[${i}] (${steps[i].breakpoint} -> ${steps[i].formatId})'s literal class matches buildStepVisibilityClass`, () => {
        expect(steps[i].visibilityClass).toBe(buildStepVisibilityClass(steps, i));
      });
    }
  }

  it("every visibility class is a fully literal string (no template-interpolation artifacts like 'undefined')", () => {
    for (const steps of Object.values(AD_LADDERS)) {
      for (const step of steps) {
        expect(step.visibilityClass).not.toMatch(/undefined|null|\$\{/);
      }
    }
  });

  it("exactly one step's visibility class ever applies at a given width — no two adjacent steps can both show 'block' unqualified for the same range", () => {
    for (const steps of Object.values(AD_LADDERS)) {
      // Every non-first step must start with "hidden" (off by default) and
      // only a breakpoint prefix turns it on — otherwise it would show at
      // every width simultaneously with an earlier step.
      for (let i = 1; i < steps.length; i++) {
        expect(steps[i].visibilityClass.split(" ")[0]).toBe("hidden");
      }
    }
  });
});

describe("resolveAdLadder", () => {
  it("resolves every step to its real format from the catalog", () => {
    const resolved = resolveAdLadder("banner");
    expect(resolved).toHaveLength(AD_LADDERS.banner.length);
    for (const { step, format } of resolved) {
      expect(format).toBe(AD_FORMATS[step.formatId]);
    }
  });
});
