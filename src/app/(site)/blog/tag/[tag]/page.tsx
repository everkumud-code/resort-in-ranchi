import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { listBlogTags, listPublishedPosts } from "@/lib/blog/queries";
import { buildPageMetadata } from "@/lib/public/seo";
import Breadcrumbs from "@/components/site/Breadcrumbs";
import BlogPostCard from "@/components/site/BlogPostCard";

export const revalidate = 300;

async function findTag(slug: string) {
  return (await listBlogTags()).find((t) => t.slug === slug) ?? null;
}

export async function generateMetadata({ params }: { params: Promise<{ tag: string }> }): Promise<Metadata> {
  const { tag: slug } = await params;
  const tag = await findTag(slug);
  if (!tag) return buildPageMetadata({ title: "Not found", description: "Tag not found.", path: `/blog/tag/${slug}`, noindex: true });
  return buildPageMetadata({
    title: `${tag.tag} — Ranchi blog posts`,
    description: `Blog posts tagged “${tag.tag}” on ResortInRanchi.`,
    path: `/blog/tag/${slug}`,
  });
}

export default async function BlogTagPage({ params }: { params: Promise<{ tag: string }> }) {
  const { tag: slug } = await params;
  const tag = await findTag(slug);
  if (!tag) notFound();
  const posts = await listPublishedPosts({ tag: tag.tag });

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <Breadcrumbs
        items={[
          { name: "Blog", path: "/blog" },
          { name: tag.tag, path: `/blog/tag/${slug}` },
        ]}
      />
      <h1 className="mt-3 font-serif text-3xl font-semibold text-brand-dark">{tag.tag}</h1>
      <p className="mt-2 text-sm text-brand/60">
        {posts.length} post{posts.length === 1 ? "" : "s"} ·{" "}
        <Link href="/blog" className="text-brand-teal hover:underline">
          All posts
        </Link>
      </p>
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {posts.map((post) => (
          <BlogPostCard key={post.id} post={post} />
        ))}
      </div>
    </div>
  );
}
