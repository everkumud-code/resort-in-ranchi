import { z } from "zod";
import { checkbox, optionalText, requiredText, slugField } from "./shared";
import { parseList } from "@/lib/blog/blog";

/** A FormData URL field: "" -> null, otherwise must be a valid http(s) URL. */
const optionalHttpUrl = z.preprocess(
  (v) => {
    if (typeof v !== "string") return null;
    const trimmed = v.trim();
    return trimmed === "" ? null : trimmed;
  },
  z
    .string()
    .url("Must be a valid URL (including https://)")
    .refine((u) => /^https?:\/\//i.test(u), "Must start with http:// or https://")
    .nullable()
);

const listField = (label: string, max: number) =>
  z.preprocess(
    (v) => parseList(typeof v === "string" ? v : "", max),
    z.array(z.string().max(80, `Each ${label} must be 80 characters or fewer`))
  );

export const BLOG_STATUS_VALUES = ["DRAFT", "PUBLISHED"] as const;

/** Blog post form — every SEO field the editor offers. Content is Markdown. */
export const blogPostSchema = z.object({
  title: requiredText("Title").pipe(z.string().max(200, "Title must be 200 characters or fewer")),
  slug: slugField,
  excerpt: optionalText,
  content: z.preprocess((v) => (typeof v === "string" ? v : ""), z.string().max(200_000, "Content is too long")),
  authorName: optionalText,
  coverImageUrl: optionalHttpUrl,
  coverImageAlt: optionalText,
  focusKeyword: optionalText,
  keywords: listField("keyword", 20),
  tags: listField("tag", 15),
  metaTitle: optionalText,
  metaDescription: optionalText,
  canonicalUrl: optionalHttpUrl,
  noindex: checkbox,
  status: z.preprocess((v) => (v === "PUBLISHED" ? "PUBLISHED" : "DRAFT"), z.enum(BLOG_STATUS_VALUES)),
});

export type BlogPostInput = z.infer<typeof blogPostSchema>;

/**
 * publishedAt is set once, the first time a post goes live, and kept when
 * it's unpublished and republished — so a post's public date never jumps.
 */
export function resolvePublishedAt(
  status: (typeof BLOG_STATUS_VALUES)[number],
  existing: Date | null,
  now: Date = new Date()
): Date | null {
  if (status !== "PUBLISHED") return existing;
  return existing ?? now;
}
