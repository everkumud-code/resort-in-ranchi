import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import FacilityForm from "../FacilityForm";

export const dynamic = "force-dynamic";

export default async function EditFacilityPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string }>;
}) {
  const { id } = await params;
  const { saved } = await searchParams;

  const facility = await prisma.facility.findUnique({ where: { id } });
  if (!facility) {
    notFound();
  }

  return (
    <div className="max-w-xl space-y-6">
      <div>
        <Link href="/admin/facilities" className="text-sm text-slate-500 hover:underline">
          ← Back to facilities
        </Link>
        <h1 className="mt-1 text-xl font-semibold text-slate-900">Edit facility</h1>
      </div>
      {saved === "1" && <p className="rounded-md bg-green-50 px-3 py-2 text-sm text-green-700">Changes saved.</p>}
      <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <FacilityForm facility={facility} />
      </div>
    </div>
  );
}
