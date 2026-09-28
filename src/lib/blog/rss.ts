import { escapeHtml, tagSlug } from "./blog";
import { postMetaDescription } from "./seo";

export interface RssPost {
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  tags: string[];
  publishedAt: Date | null;
}

/** Escapes text for use inside XML. */
function xml(value: string): string {
  return escapeHtml(value);
}

/** Pure — builds an RSS 2.0 document for the published posts. */
export function buildRssFeed(params: { title: string; description: string; siteUrl: string; posts: RssPost[] }): string {
  const { title, description, siteUrl, posts } = params;
  const newest = posts.map((p) => p.publishedAt).filter((d): d is Date => Boolean(d)).sort((a, b) => b.getTime() - a.getTime())[0];

  const items = posts
    .map((post) => {
      const url = `${siteUrl}/blog/${post.slug}`;
      return [
        "<item>",
        `<title>${xml(post.title)}</title>`,
        `<link>${xml(url)}</link>`,
        `<guid isPermaLink="true">${xml(url)}</guid>`,
        post.publishedAt ? `<pubDate>${post.publishedAt.toUTCString()}</pubDate>` : "",
        `<description>${xml(postMetaDescription({ metaDescription: null, excerpt: post.excerpt, content: post.content }))}</description>`,
        ...post.tags.filter((t) => tagSlug(t)).map((t) => `<category>${xml(t)}</category>`),
        "</item>",
      ]
        .filter(Boolean)
        .join("");
    })
    .join("");

  return (
    `<?xml version="1.0" encoding="UTF-8"?>` +
    `<rss version="2.0"><channel>` +
    `<title>${xml(title)}</title><link>${xml(`${siteUrl}/blog`)}</link><description>${xml(description)}</description>` +
    `<language>en-IN</language>` +
    (newest ? `<lastBuildDate>${newest.toUTCString()}</lastBuildDate>` : "") +
    items +
    `</channel></rss>`
  );
}
