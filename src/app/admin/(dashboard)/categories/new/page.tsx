import Link from "next/link";
import { prisma } from "@/lib/prisma";
import CategoryForm from "../CategoryForm";

export const dynamic = "force-dynamic";

export default async function NewCategoryPage() {
  const categories = await prisma.category.findMany({ orderBy: { name: "asc" } });

  return (
    <div className="max-w-xl space-y-6">
      <div>
        <Link href="/admin/categories" className="text-sm text-slate-500 hover:underline">
          ← Back to categories
        </Link>
        <h1 className="mt-1 text-xl font-semibold text-slate-900">New category</h1>
      </div>
      <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <CategoryForm parentOptions={categories} />
      </div>
    </div>
  );
}
