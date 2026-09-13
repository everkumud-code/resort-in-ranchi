import Link from "next/link";
import { prisma } from "@/lib/prisma";
import LocationForm from "../LocationForm";

export const dynamic = "force-dynamic";

export default async function NewLocationPage() {
  const locations = await prisma.location.findMany({ orderBy: { name: "asc" } });

  return (
    <div className="max-w-xl space-y-6">
      <div>
        <Link href="/admin/locations" className="text-sm text-slate-500 hover:underline">
          ← Back to locations
        </Link>
        <h1 className="mt-1 text-xl font-semibold text-slate-900">New location</h1>
      </div>
      <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <LocationForm parentOptions={locations} />
      </div>
    </div>
  );
}
