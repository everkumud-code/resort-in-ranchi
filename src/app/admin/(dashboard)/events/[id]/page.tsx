import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import EventForm from "../EventForm";
import { rejectEvent } from "../actions";

export const dynamic = "force-dynamic";

export default async function EditEventPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string }>;
}) {
  const { id } = await params;
  const { saved } = await searchParams;

  const [event, locations, properties] = await Promise.all([
    prisma.event.findUnique({ where: { id } }),
    prisma.location.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.property.findMany({ where: { status: "PUBLISHED" }, orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);
  if (!event) notFound();

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/events" className="text-sm text-slate-500 hover:underline">← Back to events</Link>
        <h1 className="mt-1 text-xl font-semibold text-slate-900">Edit event</h1>
      </div>
      {saved === "1" && <p className="rounded-md bg-green-50 px-3 py-2 text-sm text-green-700">Changes saved.</p>}

      {event.status === "PENDING" && (
        <div className="rounded-md border border-amber-200 bg-amber-50 p-4">
          <p className="text-sm font-medium text-amber-900">This is a pending application awaiting review.</p>
          <form action={rejectEvent.bind(null, event.id)} className="mt-2 flex items-end gap-2">
            <div className="flex-1">
              <label className="block text-xs font-medium text-amber-800">Rejection reason (optional, internal)</label>
              <input name="rejectionReason" className="mt-1 w-full rounded-md border border-amber-300 px-2 py-1.5 text-sm" />
            </div>
            <button type="submit" className="rounded-md border border-red-300 bg-red-50 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-100">
              Reject
            </button>
          </form>
          <p className="mt-2 text-xs text-amber-700">Or set Status to &quot;Published&quot; below and save to approve it.</p>
        </div>
      )}
      {event.status === "REJECTED" && event.rejectionReason && (
        <p className="rounded-md bg-slate-100 px-3 py-2 text-sm text-slate-600">Rejected: {event.rejectionReason}</p>
      )}

      <EventForm event={event} locations={locations} properties={properties} />
    </div>
  );
}
