import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { canManageOwnerAccess, requireAdmin } from "@/lib/auth/session";
import { PARTNER_LEAD_STATUS_LABELS, PARTNER_LEAD_STATUS_VALUES, isValidPartnerLeadStatus } from "@/lib/validation/partnerLead";
import ReassignLeadForm from "./ReassignLeadForm";
import ResendLeadButton from "./ResendLeadButton";

export const dynamic = "force-dynamic";

interface PageSearchParams {
  status?: string;
}

export default async function PartnerLeadsPage({ searchParams }: { searchParams: Promise<PageSearchParams> }) {
  const admin = await requireAdmin();
  const mayManage = canManageOwnerAccess(admin.role);
  const { status } = await searchParams;
  const validStatus = status && isValidPartnerLeadStatus(status) ? status : undefined;

  const [leads, allPartners] = await Promise.all([
    prisma.partnerLead.findMany({
      where: validStatus ? { status: validStatus } : undefined,
      include: {
        partner: { select: { id: true, property: { select: { id: true, name: true } } } },
        sourceEnquiry: {
          select: {
            name: true,
            phone: true,
            email: true,
            eventDate: true,
            guests: true,
            budget: true,
            requirement: true,
            property: { select: { id: true, name: true, category: { select: { name: true } } } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 300,
    }),
    prisma.leadPartner.findMany({ select: { id: true, property: { select: { name: true } } } }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/partners" className="text-sm text-slate-500 hover:underline">
          &larr; Back to partners
        </Link>
        <h1 className="mt-2 text-xl font-semibold text-slate-900">Partner leads</h1>
        <p className="mt-1 text-sm text-slate-500">
          Every referred copy of an enquiry, with the complete detail a partner is legitimately entitled to see and
          the auditable reason it was matched. Never shown publicly. The partner&apos;s own CONTACTED/CONVERTED
          tracking is set from their owner dashboard, not here — this view can resend or reassign delivery without
          ever changing the source enquiry.
        </p>
      </div>

      <div className="flex flex-wrap gap-2 text-sm">
        <Link
          href="/admin/partners/leads"
          className={!validStatus ? "rounded-full bg-slate-900 px-3 py-1 text-white" : "rounded-full border border-slate-300 px-3 py-1 text-slate-600 hover:bg-slate-50"}
        >
          All
        </Link>
        {PARTNER_LEAD_STATUS_VALUES.map((value) => (
          <Link
            key={value}
            href={`/admin/partners/leads?status=${value}`}
            className={validStatus === value ? "rounded-full bg-slate-900 px-3 py-1 text-white" : "rounded-full border border-slate-300 px-3 py-1 text-slate-600 hover:bg-slate-50"}
          >
            {PARTNER_LEAD_STATUS_LABELS[value]}
          </Link>
        ))}
      </div>

      {leads.length === 0 ? (
        <p className="text-sm text-slate-400">No partner leads{validStatus ? ` with status ${PARTNER_LEAD_STATUS_LABELS[validStatus]}` : ""}.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-2 text-left font-medium text-slate-500">Partner</th>
                <th className="px-4 py-2 text-left font-medium text-slate-500">Original property</th>
                <th className="px-4 py-2 text-left font-medium text-slate-500">Category / use case</th>
                <th className="px-4 py-2 text-left font-medium text-slate-500">Enquiry details</th>
                <th className="px-4 py-2 text-left font-medium text-slate-500">Created</th>
                <th className="px-4 py-2 text-left font-medium text-slate-500">Delivery</th>
                <th className="px-4 py-2 text-left font-medium text-slate-500">Partner status</th>
                {mayManage && <th className="px-4 py-2 text-left font-medium text-slate-500">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {leads.map((lead) => (
                <tr key={lead.id}>
                  <td className="px-4 py-2 font-medium text-slate-900">
                    <Link href={`/admin/properties/${lead.partner.property.id}`} className="hover:underline">
                      {lead.partner.property.name}
                    </Link>
                  </td>
                  <td className="px-4 py-2 text-slate-600">
                    <Link href={`/admin/properties/${lead.sourceEnquiry.property.id}`} className="hover:underline">
                      {lead.sourceEnquiry.property.name}
                    </Link>
                  </td>
                  <td className="px-4 py-2 text-slate-600">{lead.sourceEnquiry.property.category.name}</td>
                  <td className="px-4 py-2 text-slate-600">
                    <p className="font-medium text-slate-800">{lead.sourceEnquiry.name}</p>
                    <p className="text-xs text-slate-500">
                      {lead.sourceEnquiry.phone}
                      {lead.sourceEnquiry.email ? ` · ${lead.sourceEnquiry.email}` : ""}
                    </p>
                    <p className="text-xs text-slate-500">
                      {lead.sourceEnquiry.eventDate ? lead.sourceEnquiry.eventDate.toLocaleDateString() : "No date"}
                      {lead.sourceEnquiry.guests ? ` · ${lead.sourceEnquiry.guests} guests` : ""}
                      {lead.sourceEnquiry.budget ? ` · ${lead.sourceEnquiry.budget}` : ""}
                    </p>
                    {lead.sourceEnquiry.requirement && (
                      <p className="mt-1 max-w-xs text-xs text-slate-500">&ldquo;{lead.sourceEnquiry.requirement}&rdquo;</p>
                    )}
                  </td>
                  <td className="px-4 py-2 text-slate-600">{lead.createdAt.toLocaleString()}</td>
                  <td className="px-4 py-2">
                    <span
                      className={
                        lead.deliveryStatus === "DELIVERED"
                          ? "rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700"
                          : "rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700"
                      }
                    >
                      {lead.deliveryStatus}
                    </span>
                    <p className="mt-1 text-xs text-slate-400">Last delivered {lead.lastDeliveredAt.toLocaleString()}</p>
                    {lead.eligibilityReason && (
                      <p className="mt-1 max-w-xs text-xs text-slate-400" title={lead.eligibilityReason}>
                        {lead.eligibilityReason}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-2">
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
                      {PARTNER_LEAD_STATUS_LABELS[lead.status]}
                    </span>
                    {lead.statusUpdatedAt && (
                      <p className="mt-1 text-xs text-slate-400">Updated {lead.statusUpdatedAt.toLocaleString()}</p>
                    )}
                  </td>
                  {mayManage && (
                    <td className="px-4 py-2">
                      <div className="flex flex-col gap-2">
                        <ResendLeadButton leadId={lead.id} />
                        <ReassignLeadForm
                          leadId={lead.id}
                          otherPartners={allPartners
                            .filter((p) => p.id !== lead.partner.id)
                            .map((p) => ({ id: p.id, propertyName: p.property.name }))}
                        />
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
