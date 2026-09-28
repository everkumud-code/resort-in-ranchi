import { describe, expect, it } from "vitest";
import { blogPostSchema, resolvePublishedAt } from "./blogPost";

const base = { title: "Best Resorts in Ranchi", slug: "best-resorts-in-ranchi", content: "Body" };

describe("blogPostSchema", () => {
  it("accepts a minimal post and defaults to a draft", () => {
    const parsed = blogPostSchema.parse(base);
    expect(parsed.status).toBe("DRAFT");
    expect(parsed.noindex).toBe(false);
    expect(parsed.tags).toEqual([]);
    expect(parsed.excerpt).toBeNull();
  });

  it("requires a title and a valid slug", () => {
    expect(blogPostSchema.safeParse({ ...base, title: "  " }).success).toBe(false);
    expect(blogPostSchema.safeParse({ ...base, slug: "Not A Slug" }).success).toBe(false);
  });

  it("parses tags and keywords from comma-separated text, de-duplicated", () => {
    const parsed = blogPostSchema.parse({ ...base, tags: "Resorts, resorts, Ranchi", keywords: "a,b\nc" });
    expect(parsed.tags).toEqual(["Resorts", "Ranchi"]);
    expect(parsed.keywords).toEqual(["a", "b", "c"]);
  });

  it("accepts only http(s) URLs for the cover image and canonical URL", () => {
    expect(blogPostSchema.safeParse({ ...base, coverImageUrl: "https://x.test/a.jpg" }).success).toBe(true);
    expect(blogPostSchema.safeParse({ ...base, coverImageUrl: "javascript:alert(1)" }).success).toBe(false);
    expect(blogPostSchema.safeParse({ ...base, canonicalUrl: "not a url" }).success).toBe(false);
    expect(blogPostSchema.parse({ ...base, canonicalUrl: "" }).canonicalUrl).toBeNull();
  });

  it("only ever resolves status to DRAFT or PUBLISHED", () => {
    expect(blogPostSchema.parse({ ...base, status: "PUBLISHED" }).status).toBe("PUBLISHED");
    expect(blogPostSchema.parse({ ...base, status: "anything" }).status).toBe("DRAFT");
  });

  it("reads the noindex checkbox", () => {
    expect(blogPostSchema.parse({ ...base, noindex: "on" }).noindex).toBe(true);
  });
});

describe("resolvePublishedAt", () => {
  const now = new Date("2026-09-28T10:00:00Z");
  const earlier = new Date("2026-01-01T00:00:00Z");

  it("stamps the first publish time", () => {
    expect(resolvePublishedAt("PUBLISHED", null, now)).toEqual(now);
  });
  it("keeps the original date when republished", () => {
    expect(resolvePublishedAt("PUBLISHED", earlier, now)).toEqual(earlier);
  });
  it("leaves a draft without a date, and keeps an existing date when unpublished", () => {
    expect(resolvePublishedAt("DRAFT", null, now)).toBeNull();
    expect(resolvePublishedAt("DRAFT", earlier, now)).toEqual(earlier);
  });
});
