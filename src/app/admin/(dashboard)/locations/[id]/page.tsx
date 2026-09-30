import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import LocationForm from "../LocationForm";

export const dynamic = "force-dynamic";

export default async function EditLocationPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string }>;
}) {
  const { id } = await params;
  const { saved } = await searchParams;

  const [location, locations] = await Promise.all([
    prisma.location.findUnique({ where: { id } }),
    prisma.location.findMany({ orderBy: { name: "asc" } }),
  ]);

  if (!location) {
    notFound();
  }

  return (
    <div className="max-w-xl space-y-6">
      <div>
        <Link href="/admin/locations" className="text-sm text-slate-500 hover:underline">
          ← Back to locations
        </Link>
        <h1 className="mt-1 text-xl font-semibold text-slate-900">Edit location</h1>
      </div>
      {saved === "1" && <p className="rounded-md bg-green-50 px-3 py-2 text-sm text-green-700">Changes saved.</p>}
      <div className="rounded-lg border border-slate-200 bg-panel-green p-6 shadow-sm">
        <LocationForm location={location} parentOptions={locations} />
      </div>
    </div>
  );
}
