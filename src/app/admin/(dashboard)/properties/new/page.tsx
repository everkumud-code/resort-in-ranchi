import Link from "next/link";
import { prisma } from "@/lib/prisma";
import PropertyEditForm from "../[id]/PropertyEditForm";

export const dynamic = "force-dynamic";

export default async function NewPropertyPage() {
  const [categories, locations] = await Promise.all([
    prisma.category.findMany({ orderBy: { name: "asc" } }),
    prisma.location.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <Link href="/admin/properties" className="text-sm text-slate-500 hover:underline">
          ← Back to properties
        </Link>
        <h1 className="mt-1 text-xl font-semibold text-slate-900">New property</h1>
      </div>
      <div className="rounded-lg border border-slate-200 bg-panel-green p-6 shadow-sm">
        <PropertyEditForm categories={categories} locations={locations} />
      </div>
    </div>
  );
}
