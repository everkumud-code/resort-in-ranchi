import Link from "next/link";
import { listPublishedPosts } from "@/lib/blog/queries";
import BlogPostCard from "./BlogPostCard";

/** Homepage strip with the three newest published posts. Renders nothing until there is at least one post. */
export default async function LatestBlogSection() {
  const posts = await listPublishedPosts({ take: 3 });
  if (posts.length === 0) return null;

  return (
    <section className="border-t border-brand/10 bg-brand-cream/40">
      <div className="mx-auto max-w-6xl px-4 py-14">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="font-serif text-2xl font-semibold text-brand-dark">From the ResortInRanchi blog</h2>
            <p className="mt-1 text-sm text-brand-dark/70">Guides and ideas for stays, dining and celebrations in Ranchi.</p>
          </div>
          <Link href="/blog" className="shrink-0 text-sm font-medium text-brand-teal hover:underline">
            View all posts &rarr;
          </Link>
        </div>
        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <BlogPostCard key={post.id} post={post} />
          ))}
        </div>
      </div>
    </section>
  );
}
