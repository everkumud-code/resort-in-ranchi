import { prisma } from "@/lib/prisma";
import { tagSlug } from "./blog";

/** A post is public only when it is PUBLISHED and its publish date has arrived. */
export function publishedPostWhere(now: Date = new Date()) {
  return { status: "PUBLISHED" as const, publishedAt: { lte: now } };
}

export const blogCardSelect = {
  id: true,
  title: true,
  slug: true,
  excerpt: true,
  coverImageUrl: true,
  coverImageAlt: true,
  authorName: true,
  tags: true,
  publishedAt: true,
  content: true,
} as const;

/**
 * Public blog reads never throw: if the blog table is unavailable (for
 * example a deploy that runs before the BlogPost migration), the blog simply
 * shows as empty instead of failing the page or the whole build.
 */
async function safely<T>(read: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await read();
  } catch (error) {
    console.error("[blog] read failed:", error instanceof Error ? error.message.split("\n").pop() : error);
    return fallback;
  }
}

export async function listPublishedPosts(options: { take?: number; tag?: string } = {}) {
  return safely(
    () =>
      prisma.blogPost.findMany({
        where: { ...publishedPostWhere(), ...(options.tag ? { tags: { has: options.tag } } : {}) },
        select: blogCardSelect,
        orderBy: { publishedAt: "desc" },
        take: options.take ?? 60,
      }),
    []
  );
}

export async function getPublishedPost(slug: string) {
  return safely(() => prisma.blogPost.findFirst({ where: { slug, ...publishedPostWhere() } }), null);
}

export interface BlogTag {
  tag: string;
  slug: string;
  count: number;
}

/** Every tag used by a published post, most-used first. Tag pages are keyed by the tag's slug. */
export async function listBlogTags(): Promise<BlogTag[]> {
  const posts = await safely(
    () => prisma.blogPost.findMany({ where: publishedPostWhere(), select: { tags: true } }),
    [] as { tags: string[] }[]
  );
  const counts = new Map<string, BlogTag>();
  for (const post of posts) {
    for (const tag of post.tags) {
      const slug = tagSlug(tag);
      if (!slug) continue;
      const existing = counts.get(slug);
      if (existing) existing.count += 1;
      else counts.set(slug, { tag, slug, count: 1 });
    }
  }
  return [...counts.values()].sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag));
}
