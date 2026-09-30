import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { EVENT_STATUS_LABELS, EVENT_STATUS_VALUES, type EventStatusValue } from "@/lib/validation/event";
import { approveEvent, rejectEvent, deleteEvent } from "./actions";
import ConfirmForm from "@/components/admin/ConfirmForm";

export const dynamic = "force-dynamic";

export default async function AdminEventsPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { status } = await searchParams;
  const validStatus = EVENT_STATUS_VALUES.includes(status as EventStatusValue) ? (status as EventStatusValue) : undefined;

  const events = await prisma.event.findMany({
    where: validStatus ? { status: validStatus } : undefined,
    orderBy: [{ status: "asc" }, { startAt: "desc" }],
    take: 200,
  });
  const pendingCount = await prisma.event.count({ where: { status: "PENDING" } });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Events</h1>
          <p className="mt-1 text-sm text-slate-500">
            {events.length} shown. {pendingCount} pending review.{" "}
            <Link href="/events" className="underline">/events</Link>
          </p>
        </div>
        <Link href="/admin/events/new" className="rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-700">
          New event
        </Link>
      </div>

      <div className="flex flex-wrap gap-2 text-sm">
        <Link href="/admin/events" className={!validStatus ? "rounded-full bg-slate-900 px-3 py-1 text-white" : "rounded-full border border-slate-300 px-3 py-1 text-slate-700 hover:bg-slate-50"}>
          All
        </Link>
        {EVENT_STATUS_VALUES.map((v) => (
          <Link
            key={v}
            href={`/admin/events?status=${v}`}
            className={validStatus === v ? "rounded-full bg-slate-900 px-3 py-1 text-white" : "rounded-full border border-slate-300 px-3 py-1 text-slate-700 hover:bg-slate-50"}
          >
            {EVENT_STATUS_LABELS[v]}
          </Link>
        ))}
      </div>

      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-panel-green shadow-sm">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-2 text-left font-medium text-slate-500">Title</th>
              <th className="px-4 py-2 text-left font-medium text-slate-500">Starts</th>
              <th className="px-4 py-2 text-left font-medium text-slate-500">Status</th>
              <th className="px-4 py-2 text-left font-medium text-slate-500">Sponsored</th>
              <th className="px-4 py-2" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {events.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-400">No events.</td>
              </tr>
            )}
            {events.map((e) => (
              <tr key={e.id} className={e.status === "PENDING" ? "bg-amber-50/60" : undefined}>
                <td className="px-4 py-2 font-medium text-slate-900">{e.title}</td>
                <td className="px-4 py-2 text-slate-500">{e.startAt.toISOString().slice(0, 16).replace("T", " ")}</td>
                <td className="px-4 py-2">
                  <span
                    className={
                      e.status === "PUBLISHED"
                        ? "rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700"
                        : e.status === "REJECTED"
                          ? "rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700"
                          : "rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800"
                    }
                  >
                    {EVENT_STATUS_LABELS[e.status]}
                  </span>
                </td>
                <td className="px-4 py-2 text-slate-600">{e.sponsored ? "Yes" : "—"}</td>
                <td className="px-4 py-2 text-right whitespace-nowrap">
                  {e.status === "PENDING" && (
                    <>
                      <form action={approveEvent.bind(null, e.id)} className="inline">
                        <button type="submit" className="mr-3 text-green-700 hover:underline">Approve</button>
                      </form>
                      <form action={rejectEvent.bind(null, e.id)} className="mr-3 inline">
                        <button type="submit" className="text-red-700 hover:underline">Reject</button>
                      </form>
                    </>
                  )}
                  {e.status === "PUBLISHED" && (
                    <Link href={`/events/${e.slug}`} className="mr-3 text-slate-500 hover:text-slate-900 hover:underline">View</Link>
                  )}
                  <Link href={`/admin/events/${e.id}`} className="mr-3 text-slate-600 hover:text-slate-900 hover:underline">Edit</Link>
                  <ConfirmForm
                    action={deleteEvent.bind(null, e.id)}
                    confirmMessage={`Delete "${e.title}"? This can't be undone.`}
                    label="Delete"
                    className="text-red-600 hover:underline"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
