import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPublishedPost } from "@/lib/blog/queries";
import { readingTimeMinutes, renderMarkdown, tagSlug } from "@/lib/blog/blog";
import { articleJsonLd, postMetaDescription, postMetaTitle } from "@/lib/blog/seo";
import { buildPageMetadata } from "@/lib/public/seo";
import Breadcrumbs from "@/components/site/Breadcrumbs";
import JsonLd from "@/components/site/JsonLd";
import { formatPostDate } from "@/components/site/BlogPostCard";
import { BLOG_PROSE_CLASS } from "@/components/site/blogProse";

export const revalidate = 300;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPublishedPost(slug);
  if (!post) return buildPageMetadata({ title: "Not found", description: "Post not found.", path: `/blog/${slug}`, noindex: true });

  const base = buildPageMetadata({
    title: postMetaTitle(post),
    description: postMetaDescription(post),
    path: `/blog/${slug}`,
    noindex: post.noindex,
    ogImage: post.coverImageUrl ?? undefined,
  });
  return {
    ...base,
    ...(post.keywords.length > 0 || post.focusKeyword
      ? { keywords: [post.focusKeyword, ...post.keywords].filter((k): k is string => Boolean(k)) }
      : {}),
    alternates: { canonical: post.canonicalUrl || `/blog/${slug}` },
    openGraph: { ...base.openGraph, type: "article", publishedTime: post.publishedAt?.toISOString(), tags: post.tags },
  };
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getPublishedPost(slug);
  if (!post) notFound();

  return (
    <article className="mx-auto max-w-3xl px-4 py-8">
      <JsonLd data={articleJsonLd(post)} />
      <Breadcrumbs
        items={[
          { name: "Blog", path: "/blog" },
          { name: post.title, path: `/blog/${slug}` },
        ]}
      />
      <h1 className="mt-3 font-serif text-3xl font-semibold text-brand-dark sm:text-4xl">{post.title}</h1>
      <p className="mt-2 text-sm text-brand/60">
        {post.authorName ? `${post.authorName} · ` : ""}
        {formatPostDate(post.publishedAt)} · {readingTimeMinutes(post.content)} min read
      </p>

      {post.coverImageUrl && (
        // eslint-disable-next-line @next/next/no-img-element -- admin-supplied external URL
        <img src={post.coverImageUrl} alt={post.coverImageAlt ?? ""} className="mt-6 w-full rounded-lg object-cover" />
      )}

      {/* renderMarkdown HTML-escapes everything first and only emits a fixed set of safe tags. */}
      <div className={`mt-6 ${BLOG_PROSE_CLASS}`} dangerouslySetInnerHTML={{ __html: renderMarkdown(post.content) }} />

      {post.tags.length > 0 && (
        <div className="mt-8 flex flex-wrap gap-2 border-t border-brand/10 pt-4 text-sm">
          {post.tags.map((tag) => (
            <Link key={tag} href={`/blog/tag/${tagSlug(tag)}`} className="rounded-full bg-brand/5 px-3 py-1 text-brand-dark/70 hover:bg-brand/10">
              {tag}
            </Link>
          ))}
        </div>
      )}
      <aside className="mt-10 rounded-lg border border-brand/10 bg-brand-cream/50 p-5">
        <p className="font-serif text-lg font-semibold text-brand-dark">Plan your stay or event in Ranchi</p>
        <p className="mt-1 text-sm text-brand-dark/70">Browse verified listings and contact the business directly.</p>
        <div className="mt-3 flex flex-wrap gap-2 text-sm">
          {[
            { href: "/resorts", label: "Resorts" },
            { href: "/hotels", label: "Hotels" },
            { href: "/restaurants", label: "Restaurants" },
            { href: "/banquet-halls", label: "Banquet Halls" },
            { href: "/wedding-venues", label: "Wedding Venues" },
          ].map((link) => (
            <Link key={link.href} href={link.href} className="rounded-full border border-brand/20 px-3 py-1 text-brand hover:border-brand">
              {link.label}
            </Link>
          ))}
        </div>
      </aside>
    </article>
  );
}
