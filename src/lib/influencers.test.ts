import { describe, expect, it } from "vitest";
import { averageInfluencerRating, isValidRatingScore } from "./influencers";

describe("averageInfluencerRating", () => {
  it("is null when nothing has been rated — never a fabricated 0", () => {
    expect(averageInfluencerRating([])).toBeNull();
  });

  it("averages the scores, rounded to one decimal", () => {
    expect(averageInfluencerRating([{ criterionId: "a", score: 4 }, { criterionId: "b", score: 5 }])).toBe(4.5);
    expect(averageInfluencerRating([{ criterionId: "a", score: 4 }, { criterionId: "b", score: 4 }, { criterionId: "c", score: 5 }])).toBe(4.3);
  });
});

describe("isValidRatingScore", () => {
  it("accepts only whole numbers 1 through 5", () => {
    expect(isValidRatingScore(1)).toBe(true);
    expect(isValidRatingScore(5)).toBe(true);
    expect(isValidRatingScore(0)).toBe(false);
    expect(isValidRatingScore(6)).toBe(false);
    expect(isValidRatingScore(3.5)).toBe(false);
  });
});
