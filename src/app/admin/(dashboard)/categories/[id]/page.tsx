import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import CategoryForm from "../CategoryForm";

export const dynamic = "force-dynamic";

export default async function EditCategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string }>;
}) {
  const { id } = await params;
  const { saved } = await searchParams;

  const [category, categories] = await Promise.all([
    prisma.category.findUnique({ where: { id } }),
    prisma.category.findMany({ orderBy: { name: "asc" } }),
  ]);

  if (!category) {
    notFound();
  }

  return (
    <div className="max-w-xl space-y-6">
      <div>
        <Link href="/admin/categories" className="text-sm text-slate-500 hover:underline">
          ← Back to categories
        </Link>
        <h1 className="mt-1 text-xl font-semibold text-slate-900">Edit category</h1>
      </div>
      {saved === "1" && <p className="rounded-md bg-green-50 px-3 py-2 text-sm text-green-700">Changes saved.</p>}
      <div className="rounded-lg border border-slate-200 bg-panel-green p-6 shadow-sm">
        <CategoryForm category={category} parentOptions={categories} />
      </div>
    </div>
  );
}
