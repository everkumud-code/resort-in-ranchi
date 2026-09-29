import { z } from "zod";
import { optionalEmail, optionalHttpUrl, optionalText, requiredText, slugField } from "./shared";

export const influencerSchema = z.object({
  name: requiredText("Name").pipe(z.string().max(120, "Name must be 120 characters or fewer")),
  slug: slugField,
  photoUrl: optionalHttpUrl,
  videoUrl: optionalHttpUrl,
  bio: optionalText,
  category: optionalText,
  instagramUrl: optionalHttpUrl,
  youtubeUrl: optionalHttpUrl,
  websiteUrl: optionalHttpUrl,
  contactEmail: optionalEmail,
  contactPhone: optionalText,
  featured: z.preprocess((v) => v === "on" || v === "true" || v === true, z.boolean()),
  order: z.preprocess((v) => {
    if (typeof v !== "string" || v.trim() === "") return 0;
    const n = Number(v);
    return Number.isFinite(n) ? Math.trunc(n) : NaN;
  }, z.number().int()),
  status: z.preprocess((v) => (v === "PUBLISHED" ? "PUBLISHED" : "DRAFT"), z.enum(["DRAFT", "PUBLISHED"])),
});

export type InfluencerInput = z.infer<typeof influencerSchema>;

export const criterionNameSchema = requiredText("Criterion name").pipe(z.string().max(60, "60 characters or fewer"));
