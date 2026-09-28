import { absoluteUrl, SITE_NAME } from "@/lib/public/site";
import { escapeHtml } from "./blog";

export interface BlogSeoPost {
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  authorName: string | null;
  coverImageUrl: string | null;
  focusKeyword?: string | null;
  keywords?: string[];
  tags?: string[];
  metaTitle: string | null;
  metaDescription: string | null;
  canonicalUrl?: string | null;
  publishedAt: Date | null;
  updatedAt?: Date;
}

/** Strips Markdown/HTML down to plain text for use as a fallback description. */
export function plainText(markdown: string): string {
  return markdown
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/[#>*_`~-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function postMetaTitle(post: Pick<BlogSeoPost, "title" | "metaTitle">): string {
  return post.metaTitle?.trim() || post.title;
}

/** Meta description: the explicit one, else the excerpt, else the start of the article — never empty for a post with content. */
export function postMetaDescription(post: Pick<BlogSeoPost, "metaDescription" | "excerpt" | "content">): string {
  const explicit = post.metaDescription?.trim() || post.excerpt?.trim();
  if (explicit) return explicit;
  const text = plainText(post.content);
  return text.length > 157 ? `${text.slice(0, 157).trimEnd()}…` : text;
}

/** schema.org Article for a published post. */
export function articleJsonLd(post: BlogSeoPost): Record<string, unknown> {
  const url = absoluteUrl(`/blog/${post.slug}`);
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: postMetaTitle(post),
    description: postMetaDescription(post),
    mainEntityOfPage: { "@type": "WebPage", "@id": post.canonicalUrl || url },
    url,
    ...(post.coverImageUrl ? { image: [post.coverImageUrl] } : {}),
    ...(post.publishedAt ? { datePublished: post.publishedAt.toISOString() } : {}),
    ...(post.updatedAt ? { dateModified: post.updatedAt.toISOString() } : {}),
    author: { "@type": post.authorName ? "Person" : "Organization", name: post.authorName || SITE_NAME },
    publisher: { "@type": "Organization", name: SITE_NAME },
    ...(post.keywords && post.keywords.length > 0 ? { keywords: [post.focusKeyword, ...post.keywords].filter(Boolean).join(", ") } : {}),
    ...(post.tags && post.tags.length > 0 ? { articleSection: post.tags[0] } : {}),
  };
}

/** Kept for callers that need a safe attribute/text value from arbitrary post text. */
export const safeText = escapeHtml;
