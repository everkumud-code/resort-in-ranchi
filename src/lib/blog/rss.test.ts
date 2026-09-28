import { describe, expect, it } from "vitest";
import { buildRssFeed } from "./rss";

const base = { title: "Blog", description: "Desc", siteUrl: "https://x.test" };

describe("buildRssFeed", () => {
  it("lists each post with its link, date, summary and tags", () => {
    const xml = buildRssFeed({
      ...base,
      posts: [
        {
          title: "Best Resorts",
          slug: "best-resorts",
          excerpt: "A guide.",
          content: "Body",
          tags: ["Resorts"],
          publishedAt: new Date("2026-09-28T00:00:00Z"),
        },
      ],
    });
    expect(xml).toContain("<link>https://x.test/blog/best-resorts</link>");
    expect(xml).toContain("<pubDate>Mon, 28 Sep 2026 00:00:00 GMT</pubDate>");
    expect(xml).toContain("<description>A guide.</description>");
    expect(xml).toContain("<category>Resorts</category>");
    expect(xml).toContain("<lastBuildDate>Mon, 28 Sep 2026 00:00:00 GMT</lastBuildDate>");
  });

  it("escapes markup in titles so the feed stays valid XML", () => {
    const xml = buildRssFeed({
      ...base,
      posts: [{ title: "A & B <script>", slug: "a-b", excerpt: null, content: "Text", tags: [], publishedAt: null }],
    });
    expect(xml).toContain("<title>A &amp; B &lt;script&gt;</title>");
    expect(xml).not.toContain("<script>");
  });

  it("is a valid empty feed with no posts", () => {
    const xml = buildRssFeed({ ...base, posts: [] });
    expect(xml).toContain("<channel>");
    expect(xml).not.toContain("<item>");
  });
});
