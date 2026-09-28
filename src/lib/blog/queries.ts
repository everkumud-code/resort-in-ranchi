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

export async function listPublishedPosts(options: { take?: number; tag?: string } = {}) {
  return prisma.blogPost.findMany({
    where: { ...publishedPostWhere(), ...(options.tag ? { tags: { has: options.tag } } : {}) },
    select: blogCardSelect,
    orderBy: { publishedAt: "desc" },
    take: options.take ?? 60,
  });
}

export async function getPublishedPost(slug: string) {
  return prisma.blogPost.findFirst({ where: { slug, ...publishedPostWhere() } });
}

export interface BlogTag {
  tag: string;
  slug: string;
  count: number;
}

/** Every tag used by a published post, most-used first. Tag pages are keyed by the tag's slug. */
export async function listBlogTags(): Promise<BlogTag[]> {
  const posts = await prisma.blogPost.findMany({ where: publishedPostWhere(), select: { tags: true } });
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
