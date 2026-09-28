import { describe, expect, it } from "vitest";
import { articleJsonLd, plainText, postMetaDescription, postMetaTitle } from "./seo";

const post = {
  title: "Best Resorts in Ranchi",
  slug: "best-resorts-in-ranchi",
  excerpt: null,
  content: "## Intro\n\nWe **love** [resorts](/resorts) here.",
  authorName: null,
  coverImageUrl: null,
  metaTitle: null,
  metaDescription: null,
  publishedAt: new Date("2026-09-28T00:00:00Z"),
};

describe("blog seo", () => {
  it("strips Markdown to plain text", () => {
    expect(plainText(post.content)).toBe("Intro We love resorts here.");
  });

  it("prefers the explicit meta title/description, then falls back", () => {
    expect(postMetaTitle(post)).toBe("Best Resorts in Ranchi");
    expect(postMetaTitle({ ...post, metaTitle: "Custom" })).toBe("Custom");
    expect(postMetaDescription(post)).toBe("Intro We love resorts here.");
    expect(postMetaDescription({ ...post, excerpt: "Excerpt" })).toBe("Excerpt");
    expect(postMetaDescription({ ...post, excerpt: "Excerpt", metaDescription: "Meta" })).toBe("Meta");
  });

  it("truncates a long fallback description", () => {
    expect(postMetaDescription({ ...post, content: "word ".repeat(100) }).length).toBeLessThanOrEqual(158);
  });

  it("builds Article JSON-LD with the site as publisher and author fallback", () => {
    const ld = articleJsonLd(post);
    expect(ld["@type"]).toBe("Article");
    expect(ld.headline).toBe("Best Resorts in Ranchi");
    expect(ld.datePublished).toBe("2026-09-28T00:00:00.000Z");
    expect((ld.author as { "@type": string })["@type"]).toBe("Organization");
    expect(ld).not.toHaveProperty("image");
  });

  it("includes the cover image and named author when present", () => {
    const ld = articleJsonLd({ ...post, coverImageUrl: "https://x.test/a.jpg", authorName: "Kumud" });
    expect(ld.image).toEqual(["https://x.test/a.jpg"]);
    expect((ld.author as { name: string }).name).toBe("Kumud");
  });
});
