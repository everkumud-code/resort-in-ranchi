/** Pure rating math for influencers — every score is an admin-set 1–5 value against a defined criterion, never a public/crowd-sourced review. */

export interface InfluencerRatingLike {
  criterionId: string;
  score: number;
}

/** Average of an influencer's scores, rounded to one decimal; null when nothing has been rated yet (never a fabricated 0). */
export function averageInfluencerRating(ratings: InfluencerRatingLike[]): number | null {
  if (ratings.length === 0) return null;
  const sum = ratings.reduce((total, r) => total + r.score, 0);
  return Math.round((sum / ratings.length) * 10) / 10;
}

export const RATING_SCORE_MIN = 1;
export const RATING_SCORE_MAX = 5;

export function isValidRatingScore(score: number): boolean {
  return Number.isInteger(score) && score >= RATING_SCORE_MIN && score <= RATING_SCORE_MAX;
}
