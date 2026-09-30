import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/session";
import { ENQUIRY_STATUS_VALUES, ENQUIRY_STATUS_LABELS, ENQUIRY_STATUS_BADGE_CLASS } from "@/lib/validation/enquiry";
import EnquiryStatusSelect from "./EnquiryStatusSelect";

export const dynamic = "force-dynamic";

interface PageSearchParams {
  status?: string;
}

export default async function EnquiriesPage({ searchParams }: { searchParams: Promise<PageSearchParams> }) {
  await requireAdmin();
  const { status } = await searchParams;
  const validStatus = ENQUIRY_STATUS_VALUES.includes(status as (typeof ENQUIRY_STATUS_VALUES)[number]) ? status : undefined;

  const [enquiries, newCount] = await Promise.all([
    prisma.enquiry.findMany({
      where: validStatus ? { status: validStatus as (typeof ENQUIRY_STATUS_VALUES)[number] } : undefined,
      include: { property: { select: { id: true, name: true, slug: true } } },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
    prisma.enquiry.count({ where: { status: "NEW" } }),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
        <h1 className="text-xl font-semibold text-slate-900">Enquiries</h1>
        <p className="mt-1 text-sm text-slate-500">
          Leads submitted through property pages. Most recent 100 shown.
          {newCount > 0 && (
            <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800">
              {newCount} new
            </span>
          )}
        </p>
        </div>
        <a
          href={validStatus ? `/admin/enquiries/export?status=${validStatus}` : "/admin/enquiries/export"}
          className="shrink-0 rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-700"
        >
          Export CSV{validStatus ? ` (${ENQUIRY_STATUS_LABELS[validStatus as (typeof ENQUIRY_STATUS_VALUES)[number]]})` : ""}
        </a>
      </div>

      <div className="flex flex-wrap gap-2 text-sm">
        <Link
          href="/admin/enquiries"
          className={!validStatus ? "rounded-full bg-slate-900 px-3 py-1 text-white" : "rounded-full border border-slate-300 px-3 py-1 text-slate-700 hover:bg-slate-50"}
        >
          All
        </Link>
        {ENQUIRY_STATUS_VALUES.map((value) => (
          <Link
            key={value}
            href={`/admin/enquiries?status=${value}`}
            className={
              validStatus === value
                ? "rounded-full bg-slate-900 px-3 py-1 text-white"
                : "rounded-full border border-slate-300 px-3 py-1 text-slate-700 hover:bg-slate-50"
            }
          >
            {ENQUIRY_STATUS_LABELS[value]}
          </Link>
        ))}
      </div>

      {enquiries.length === 0 ? (
        <p className="text-sm text-slate-400">No enquiries yet.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-slate-200 bg-panel-green shadow-sm">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-2 text-left font-medium text-slate-500">Property</th>
                <th className="px-4 py-2 text-left font-medium text-slate-500">Name</th>
                <th className="px-4 py-2 text-left font-medium text-slate-500">Phone</th>
                <th className="px-4 py-2 text-left font-medium text-slate-500">Email</th>
                <th className="px-4 py-2 text-left font-medium text-slate-500">Event date</th>
                <th className="px-4 py-2 text-left font-medium text-slate-500">Guests</th>
                <th className="px-4 py-2 text-left font-medium text-slate-500">Requirement</th>
                <th className="px-4 py-2 text-left font-medium text-slate-500">Budget</th>
                <th className="px-4 py-2 text-left font-medium text-slate-500">Source</th>
                <th className="px-4 py-2 text-left font-medium text-slate-500">Submitted</th>
                <th className="px-4 py-2 text-left font-medium text-slate-500">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {enquiries.map((enquiry) => (
                <tr key={enquiry.id} className={enquiry.status === "NEW" ? "bg-amber-50/60" : undefined}>
                  <td className="px-4 py-2 font-medium text-slate-900">
                    <Link href={`/admin/properties/${enquiry.property.id}`} className="hover:underline">
                      {enquiry.property.name}
                    </Link>
                  </td>
                  <td className="px-4 py-2 text-slate-700">{enquiry.name}</td>
                  <td className="px-4 py-2 text-slate-600">{enquiry.phone}</td>
                  <td className="px-4 py-2 text-slate-600">{enquiry.email ?? "—"}</td>
                  <td className="px-4 py-2 text-slate-600">
                    {enquiry.eventDate ? enquiry.eventDate.toLocaleDateString() : "—"}
                  </td>
                  <td className="px-4 py-2 text-slate-600">{enquiry.guests ?? "—"}</td>
                  <td className="max-w-[220px] px-4 py-2 text-slate-600">
                    <span className="line-clamp-2">{enquiry.requirement ?? "—"}</span>
                  </td>
                  <td className="px-4 py-2 text-slate-600">{enquiry.budget ?? "—"}</td>
                  <td className="px-4 py-2 text-slate-500">{enquiry.sourcePage ?? "—"}</td>
                  <td className="px-4 py-2 text-slate-500">{enquiry.createdAt.toLocaleString()}</td>
                  <td className="px-4 py-2">
                    <div className="flex items-center gap-2">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${ENQUIRY_STATUS_BADGE_CLASS[enquiry.status]}`}>
                        {ENQUIRY_STATUS_LABELS[enquiry.status]}
                      </span>
                      <EnquiryStatusSelect enquiryId={enquiry.id} status={enquiry.status} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
