import { z } from "zod";
import { optionalText, requiredText } from "./shared";

export const trustBadgeNameSchema = requiredText("Badge label").pipe(z.string().max(40, "40 characters or fewer"));
export const trustBadgeDescriptionSchema = optionalText;

/**
 * The six badges requested at launch. Seeded once (see
 * scripts/seed-trust-badges.ts); an admin can add more later from
 * /admin/badges. `description` is shown on hover/title wherever the badge
 * appears publicly, so a badge never reads as an unexplained, unfalsifiable
 * claim — especially "Guaranteed", which needs a real, defined meaning
 * before it is ever assigned (see the admin badges page's own warning).
 */
export const DEFAULT_TRUST_BADGES: { key: string; label: string; description: string }[] = [
  { key: "verified", label: "Verified", description: "Confirmed by our team against a real source." },
  { key: "trusted", label: "Trusted", description: "Given this status by our team based on our own review." },
  {
    key: "guaranteed",
    label: "Guaranteed",
    description: "Not yet defined — decide exactly what ResortInRanchi commits to before using this badge.",
  },
  { key: "in-association-with-rir", label: "In Association with RIR", description: "An official ResortInRanchi partnership or collaboration." },
  { key: "rir-verified", label: "RIR Verified", description: "Verified directly by the ResortInRanchi team." },
  { key: "rir-trusted", label: "RIR Trusted", description: "Marked as trusted by the ResortInRanchi team." },
];
