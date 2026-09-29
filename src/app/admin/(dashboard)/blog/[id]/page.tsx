import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import BlogPostForm from "../BlogPostForm";
import { SITE_URL } from "@/lib/public/site";
import CopyLinkButton from "@/components/admin/CopyLinkButton";

export const dynamic = "force-dynamic";

export default async function EditBlogPostPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string }>;
}) {
  const { id } = await params;
  const { saved } = await searchParams;

  const post = await prisma.blogPost.findUnique({ where: { id } });
  if (!post) notFound();

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/blog" className="text-sm text-slate-500 hover:underline">
          ← Back to blog
        </Link>
        <h1 className="mt-1 text-xl font-semibold text-slate-900">Edit post</h1>
      </div>
      {saved === "1" && (
        <div className="space-y-2 rounded-md bg-green-50 px-3 py-2 text-sm text-green-700">
          <p>Changes saved.</p>
          {post.status === "PUBLISHED" ? (
            <div className="flex flex-wrap items-center gap-3">
              <Link href={`/blog/${post.slug}`} target="_blank" className="font-medium underline">
                Preview live post &rarr;
              </Link>
              <CopyLinkButton url={`${SITE_URL}/blog/${post.slug}`} label="Copy post link" />
              <Link href="/admin/blog" className="font-medium underline">
                &larr; Back to blog list
              </Link>
            </div>
          ) : (
            <Link href="/admin/blog" className="font-medium underline">
              &larr; Back to blog list
            </Link>
          )}
        </div>
      )}
      <BlogPostForm post={post} />
    </div>
  );
}
