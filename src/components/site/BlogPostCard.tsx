import Link from "next/link";
import { postMetaDescription } from "@/lib/blog/seo";
import { readingTimeMinutes, tagSlug } from "@/lib/blog/blog";

export interface BlogCardPost {
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  coverImageUrl: string | null;
  coverImageAlt: string | null;
  tags: string[];
  publishedAt: Date | null;
}

export function formatPostDate(date: Date | null): string {
  return date ? date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }) : "";
}

export default function BlogPostCard({ post }: { post: BlogCardPost }) {
  const summary = postMetaDescription({ metaDescription: null, excerpt: post.excerpt, content: post.content });
  return (
    <article className="overflow-hidden rounded-lg border border-brand/10 bg-white transition hover:border-brand/40 hover:shadow-md">
      {post.coverImageUrl && (
        <Link href={`/blog/${post.slug}`} className="block aspect-[16/9] overflow-hidden bg-brand-cream">
          {/* eslint-disable-next-line @next/next/no-img-element -- admin-supplied external URL */}
          <img src={post.coverImageUrl} alt={post.coverImageAlt ?? ""} className="h-full w-full object-cover" />
        </Link>
      )}
      <div className="p-4">
        <p className="text-xs text-brand/60">
          {formatPostDate(post.publishedAt)} · {readingTimeMinutes(post.content)} min read
        </p>
        <h2 className="mt-1 font-serif text-lg font-semibold text-brand-dark">
          <Link href={`/blog/${post.slug}`} className="hover:underline">
            {post.title}
          </Link>
        </h2>
        <p className="mt-2 line-clamp-3 text-sm text-brand-dark/70">{summary}</p>
        {post.tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {post.tags.slice(0, 4).map((tag) => (
              <Link
                key={tag}
                href={`/blog/tag/${tagSlug(tag)}`}
                className="rounded-full bg-brand/5 px-2 py-0.5 text-xs text-brand-dark/70 hover:bg-brand/10"
              >
                {tag}
              </Link>
            ))}
          </div>
        )}
      </div>
    </article>
  );
}
