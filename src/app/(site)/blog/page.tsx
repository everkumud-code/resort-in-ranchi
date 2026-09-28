import type { Metadata } from "next";
import Link from "next/link";
import { listBlogTags, listPublishedPosts } from "@/lib/blog/queries";
import { buildPageMetadata } from "@/lib/public/seo";
import Breadcrumbs from "@/components/site/Breadcrumbs";
import BlogPostCard from "@/components/site/BlogPostCard";
import EmptyState from "@/components/site/EmptyState";

export const revalidate = 300;

export const metadata: Metadata = buildPageMetadata({
  title: "Ranchi Travel, Dining & Events Blog",
  description:
    "Guides, tips and ideas for resorts, hotels, restaurants, wedding venues and things to do in and around Ranchi.",
  path: "/blog",
});

export default async function BlogIndexPage() {
  const [posts, tags] = await Promise.all([listPublishedPosts(), listBlogTags()]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <Breadcrumbs items={[{ name: "Blog", path: "/blog" }]} />
      <h1 className="mt-3 font-serif text-3xl font-semibold text-brand-dark">Blog</h1>
      <p className="mt-2 max-w-2xl text-sm text-brand-dark/70">
        Guides and ideas for stays, dining and celebrations in and around Ranchi.
      </p>

      {tags.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2 text-sm">
          {tags.map((t) => (
            <Link key={t.slug} href={`/blog/tag/${t.slug}`} className="rounded-full border border-brand/20 px-3 py-1 text-brand hover:border-brand">
              {t.tag} <span className="text-brand/50">({t.count})</span>
            </Link>
          ))}
        </div>
      )}

      <div className="mt-6">
        {posts.length === 0 ? (
          <EmptyState title="No posts yet" description="We're writing our first guides. Check back soon." />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => (
              <BlogPostCard key={post.id} post={post} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
