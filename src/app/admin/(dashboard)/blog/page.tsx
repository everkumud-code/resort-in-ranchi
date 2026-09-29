import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { SITE_URL } from "@/lib/public/site";
import CopyLinkButton from "@/components/admin/CopyLinkButton";

export const dynamic = "force-dynamic";

export default async function AdminBlogPage() {
  const posts = await prisma.blogPost.findMany({
    orderBy: { updatedAt: "desc" },
    select: { id: true, title: true, slug: true, status: true, tags: true, publishedAt: true, updatedAt: true },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Blog</h1>
          <p className="mt-1 text-sm text-slate-500">
            {posts.length} post{posts.length === 1 ? "" : "s"}. Published posts appear at{" "}
            <Link href="/blog" className="underline">
              /blog
            </Link>
            .
          </p>
        </div>
        <Link href="/admin/blog/new" className="rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-700">
          New post
        </Link>
      </div>

      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-2 text-left font-medium text-slate-500">Title</th>
              <th className="px-4 py-2 text-left font-medium text-slate-500">Slug</th>
              <th className="px-4 py-2 text-left font-medium text-slate-500">Status</th>
              <th className="px-4 py-2 text-left font-medium text-slate-500">Tags</th>
              <th className="px-4 py-2 text-left font-medium text-slate-500">Updated</th>
              <th className="px-4 py-2" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {posts.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                  No posts yet.
                </td>
              </tr>
            )}
            {posts.map((p) => (
              <tr key={p.id} className="hover:bg-slate-50">
                <td className="px-4 py-2 font-medium text-slate-900">{p.title}</td>
                <td className="px-4 py-2 text-slate-500">{p.slug}</td>
                <td className="px-4 py-2">
                  <span
                    className={
                      p.status === "PUBLISHED"
                        ? "rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700"
                        : "rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600"
                    }
                  >
                    {p.status === "PUBLISHED" ? "Published" : "Draft"}
                  </span>
                </td>
                <td className="px-4 py-2 text-slate-600">{p.tags.join(", ") || "—"}</td>
                <td className="px-4 py-2 text-slate-500">{p.updatedAt.toISOString().slice(0, 10)}</td>
                <td className="px-4 py-2 text-right">
                  {p.status === "PUBLISHED" && (
                    <>
                      <Link href={`/blog/${p.slug}`} className="mr-3 text-slate-500 hover:text-slate-900 hover:underline">
                        View
                      </Link>
                      <span className="mr-3 inline-block">
                        <CopyLinkButton url={`${SITE_URL}/blog/${p.slug}`} />
                      </span>
                    </>
                  )}
                  <Link href={`/admin/blog/${p.id}`} className="text-slate-600 hover:text-slate-900 hover:underline">
                    Edit
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
