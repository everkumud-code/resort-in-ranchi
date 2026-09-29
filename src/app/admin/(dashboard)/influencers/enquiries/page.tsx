import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { ENQUIRY_STATUS_BADGE_CLASS, ENQUIRY_STATUS_LABELS, ENQUIRY_STATUS_VALUES } from "@/lib/validation/enquiry";

export const dynamic = "force-dynamic";

interface PageSearchParams {
  status?: string;
}

/** Admin-wide visibility into every message sent to any creator — the platform always keeps a copy alongside the creator's own dashboard view. */
export default async function AdminInfluencerEnquiriesPage({ searchParams }: { searchParams: Promise<PageSearchParams> }) {
  const { status } = await searchParams;
  const validStatus = ENQUIRY_STATUS_VALUES.includes(status as (typeof ENQUIRY_STATUS_VALUES)[number]) ? status : undefined;

  const [enquiries, newCount] = await Promise.all([
    prisma.influencerEnquiry.findMany({
      where: validStatus ? { status: validStatus as (typeof ENQUIRY_STATUS_VALUES)[number] } : undefined,
      include: { influencer: { select: { id: true, name: true, slug: true } } },
      orderBy: { createdAt: "desc" },
      take: 200,
    }),
    prisma.influencerEnquiry.count({ where: { status: "NEW" } }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/influencers" className="text-sm text-slate-500 hover:underline">← Back to influencers</Link>
        <h1 className="mt-1 text-xl font-semibold text-slate-900">Creator messages</h1>
        <p className="mt-1 text-sm text-slate-500">
          Every message sent through a creator&apos;s public contact form, across all creators.
          {newCount > 0 && <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800">{newCount} new</span>}
        </p>
      </div>

      <div className="flex flex-wrap gap-2 text-sm">
        <Link href="/admin/influencers/enquiries" className={!validStatus ? "rounded-full bg-slate-900 px-3 py-1 text-white" : "rounded-full border border-slate-300 px-3 py-1 text-slate-700 hover:bg-slate-50"}>
          All
        </Link>
        {ENQUIRY_STATUS_VALUES.map((value) => (
          <Link
            key={value}
            href={`/admin/influencers/enquiries?status=${value}`}
            className={validStatus === value ? "rounded-full bg-slate-900 px-3 py-1 text-white" : "rounded-full border border-slate-300 px-3 py-1 text-slate-700 hover:bg-slate-50"}
          >
            {ENQUIRY_STATUS_LABELS[value]}
          </Link>
        ))}
      </div>

      {enquiries.length === 0 ? (
        <p className="text-sm text-slate-400">No messages yet.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-2 text-left font-medium text-slate-500">Creator</th>
                <th className="px-4 py-2 text-left font-medium text-slate-500">From</th>
                <th className="px-4 py-2 text-left font-medium text-slate-500">Phone</th>
                <th className="px-4 py-2 text-left font-medium text-slate-500">Email</th>
                <th className="px-4 py-2 text-left font-medium text-slate-500">Message</th>
                <th className="px-4 py-2 text-left font-medium text-slate-500">Submitted</th>
                <th className="px-4 py-2 text-left font-medium text-slate-500">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {enquiries.map((e) => (
                <tr key={e.id} className={e.status === "NEW" ? "bg-amber-50/60" : undefined}>
                  <td className="px-4 py-2 font-medium text-slate-900">
                    <Link href={`/admin/influencers/${e.influencer.id}`} className="hover:underline">{e.influencer.name}</Link>
                  </td>
                  <td className="px-4 py-2 text-slate-700">{e.name}</td>
                  <td className="px-4 py-2 text-slate-600">{e.phone}</td>
                  <td className="px-4 py-2 text-slate-600">{e.email ?? "—"}</td>
                  <td className="max-w-[220px] px-4 py-2 text-slate-600"><span className="line-clamp-2">{e.message ?? "—"}</span></td>
                  <td className="px-4 py-2 text-slate-500">{e.createdAt.toLocaleString()}</td>
                  <td className="px-4 py-2">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${ENQUIRY_STATUS_BADGE_CLASS[e.status]}`}>
                      {ENQUIRY_STATUS_LABELS[e.status]}
                    </span>
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
