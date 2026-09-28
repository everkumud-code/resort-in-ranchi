import { describe, expect, it } from "vitest";
import { getMonogram } from "./monogram";

describe("getMonogram", () => {
  it("uses the first letters of the first two significant words", () => {
    expect(getMonogram("Aangan Resort")).toBe("AR");
    expect(getMonogram("Ranchi Gymkhana Club")).toBe("RG");
  });

  it("skips filler words like 'The' and '&'", () => {
    expect(getMonogram("The Food Court")).toBe("FC");
    expect(getMonogram("Raj Villa & Banquet Hall")).toBe("RV");
  });

  it("uses the first two letters of a single-word name", () => {
    expect(getMonogram("Skyline")).toBe("SK");
  });

  it("returns an empty string for a name with no usable characters — never invents one", () => {
    expect(getMonogram("  ")).toBe("");
    expect(getMonogram("&")).toBe("");
  });
});
