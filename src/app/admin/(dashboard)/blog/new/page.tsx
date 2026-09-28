import Link from "next/link";
import BlogPostForm from "../BlogPostForm";

export const dynamic = "force-dynamic";

export default function NewBlogPostPage() {
  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/blog" className="text-sm text-slate-500 hover:underline">
          ← Back to blog
        </Link>
        <h1 className="mt-1 text-xl font-semibold text-slate-900">New post</h1>
      </div>
      <BlogPostForm />
    </div>
  );
}
