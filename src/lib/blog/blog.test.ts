import { describe, expect, it } from "vitest";
import { buildSeoChecklist, parseList, readingTimeMinutes, renderMarkdown, slugify, tagSlug } from "./blog";

describe("slugify", () => {
  it("lowercases, strips accents and punctuation, and joins with hyphens", () => {
    expect(slugify("  Best Resorts in Ranchi — 2026 Guide! ")).toBe("best-resorts-in-ranchi-2026-guide");
    expect(slugify("Café & Bar")).toBe("cafe-bar");
  });
  it("returns an empty string when nothing usable remains", () => {
    expect(slugify("राँची")).toBe("");
  });
  it("respects the max length without leaving a trailing hyphen", () => {
    expect(slugify("aaaa bbbb cccc", 10)).toBe("aaaa-bbbb");
  });
});

describe("parseList / tagSlug", () => {
  it("splits on commas and newlines, trims, and drops case-insensitive duplicates", () => {
    expect(parseList("Resorts, wedding venues\nresorts ,  Ranchi ,,")).toEqual(["Resorts", "wedding venues", "Ranchi"]);
  });
  it("handles empty input", () => {
    expect(parseList(null)).toEqual([]);
    expect(parseList("   ")).toEqual([]);
  });
  it("builds a URL-safe tag slug", () => {
    expect(tagSlug("Wedding Venues")).toBe("wedding-venues");
  });
});

describe("readingTimeMinutes", () => {
  it("is at least 1 minute and rounds up", () => {
    expect(readingTimeMinutes("")).toBe(1);
    expect(readingTimeMinutes("word ".repeat(201))).toBe(2);
  });
});

describe("renderMarkdown", () => {
  it("never lets raw HTML or script through", () => {
    const html = renderMarkdown("Hello <script>alert(1)</script> <img src=x onerror=alert(1)>");
    expect(html).not.toContain("<script");
    expect(html).not.toContain("<img");
    expect(html).toContain("&lt;script&gt;");
  });

  it("renders headings one level down (the page title is the h1)", () => {
    expect(renderMarkdown("# Top\n## Sub")).toBe("<h2>Top</h2>\n<h3>Sub</h3>");
  });

  it("renders bold, italic, code and lists", () => {
    const html = renderMarkdown("A **bold** and *soft* `x < y`\n\n- one\n- two\n\n1. first\n2. second");
    expect(html).toContain("<strong>bold</strong>");
    expect(html).toContain("<em>soft</em>");
    expect(html).toContain("<code>x &lt; y</code>");
    expect(html).toContain("<ul><li>one</li><li>two</li></ul>");
    expect(html).toContain("<ol><li>first</li><li>second</li></ol>");
  });

  it("only allows http(s), site-relative and mailto links", () => {
    expect(renderMarkdown("[ok](/resorts)")).toContain('<a href="/resorts">ok</a>');
    expect(renderMarkdown("[ext](https://example.com)")).toContain('rel="noopener noreferrer"');
    expect(renderMarkdown("[bad](javascript:alert(1))")).not.toContain("<a ");
    expect(renderMarkdown("[proto](//evil.com)")).not.toContain("<a ");
  });

  it("only allows safe image URLs", () => {
    expect(renderMarkdown("![Lawn](https://x.test/a.jpg)")).toContain('<img src="https://x.test/a.jpg" alt="Lawn"');
    expect(renderMarkdown("![x](javascript:alert(1))")).not.toContain("<img");
  });

  it("does not let quotes in a URL break out of the attribute", () => {
    const html = renderMarkdown('[x](/a"onmouseover="alert(1))');
    expect(html).not.toContain('onmouseover="');
  });

  it("renders blockquotes and fenced code", () => {
    expect(renderMarkdown("> wise words")).toBe("<blockquote><p>wise words</p></blockquote>");
    expect(renderMarkdown("```\n<b>\n```")).toBe("<pre><code>&lt;b&gt;</code></pre>");
  });
});

describe("buildSeoChecklist", () => {
  const good = {
    title: "Best Resorts in Ranchi for a Weekend Getaway",
    slug: "best-resorts-in-ranchi",
    excerpt: "A practical guide to the best resorts in Ranchi for families and weekend trips, with tips on when to book.",
    content: "Looking for the best resorts in Ranchi? " + "word ".repeat(300) + " See [all resorts](/resorts).",
    focusKeyword: "best resorts in ranchi",
    tags: ["resorts"],
    coverImageUrl: "https://x.test/a.jpg",
    coverImageAlt: "Resort lawn",
  };
  const byId = (input: Parameters<typeof buildSeoChecklist>[0]) => Object.fromEntries(buildSeoChecklist(input).map((c) => [c.id, c.ok]));

  it("passes every check for a well-optimised post", () => {
    expect(buildSeoChecklist(good).filter((c) => !c.ok)).toEqual([]);
  });

  it("flags a missing keyword, short description, short body, no internal link and missing alt text", () => {
    const result = byId({ ...good, focusKeyword: "", excerpt: "Short", content: "Just a few words.", coverImageAlt: "" });
    expect(result["keyword-set"]).toBe(false);
    expect(result["description-length"]).toBe(false);
    expect(result["word-count"]).toBe(false);
    expect(result["internal-link"]).toBe(false);
    expect(result["cover-alt"]).toBe(false);
    expect(result["keyword-title"]).toBeUndefined();
  });

  it("checks keyword placement in title, slug, description and intro", () => {
    const result = byId({ ...good, focusKeyword: "luxury villas", metaTitle: "Something unrelated to the topic at all" });
    expect(result["keyword-title"]).toBe(false);
    expect(result["keyword-slug"]).toBe(false);
    expect(result["keyword-description"]).toBe(false);
    expect(result["keyword-intro"]).toBe(false);
  });
});
