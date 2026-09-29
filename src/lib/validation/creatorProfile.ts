import { z } from "zod";
import { optionalEmail, optionalHttpUrl, optionalText, requiredText, slugField } from "./shared";

/**
 * What a signed-in creator may edit about their own profile — deliberately
 * excludes `featured` and `status` (admin-only levers) and `order` (homepage
 * album placement), the same boundary ownerEdit.ts draws for vendors.
 */
export const creatorProfileSchema = z.object({
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
});

export type CreatorProfileInput = z.infer<typeof creatorProfileSchema>;
