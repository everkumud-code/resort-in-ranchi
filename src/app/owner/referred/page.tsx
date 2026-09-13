import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getOwnerAccessPropertyId } from "@/lib/auth/ownerAccess";
import { PARTNER_LEAD_STATUS_BADGE_CLASS, PARTNER_LEAD_STATUS_LABELS } from "@/lib/validation/partnerLead";
import PartnerLeadStatusSelect from "./PartnerLeadStatusSelect";

export const dynamic = "force-dynamic";

export default async function OwnerReferredOpportunitiesPage() {
  const propertyId = await getOwnerAccessPropertyId();
  if (!propertyId) redirect("/owner");

  // Scoped to the authenticated session's own property only: the LeadPartner
  // row is looked up by this propertyId, and every PartnerLead below is
  // fetched by that partner's own id — there is no code path here that can
  // reach another property's partner or leads.
  const [property, partner] = await Promise.all([
    prisma.property.findUnique({ where: { id: propertyId }, select: { id: true, name: true } }),
    prisma.leadPartner.findUnique({ where: { propertyId }, select: { id: true, enabled: true } }),
  ]);
  if (!property || !partner) redirect("/owner");

  const leads = await prisma.partnerLead.findMany({
    where: { partnerId: partner.id },
    include: {
      sourceEnquiry: {
        select: {
          name: true,
          phone: true,
          email: true,
          eventDate: true,
          guests: true,
          budget: true,
          requirement: true,
          property: { select: { name: true, category: { select: { name: true } } } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <Link href="/owner" className="text-sm text-brand-teal hover:underline">
        &larr; Back to dashboard
      </Link>
      <h1 className="mt-3 font-serif text-2xl font-semibold text-brand-dark">Referred opportunities</h1>
      <p className="mt-1 text-sm text-brand/60">
        As a partner venue for {property.name}, our team shares relevant enquiries from other listings with you so
        you can follow up if you can help too. This never changes the original listing&apos;s own enquiries.
      </p>
      {!partner.enabled && (
        <p className="mt-3 rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-800">
          Partner sharing is currently paused by our team — you won&apos;t receive new referrals until it&apos;s
          re-enabled, but past ones below are still visible.
        </p>
      )}

      {leads.length === 0 ? (
        <p className="mt-8 text-sm text-brand/50">No referred opportunities yet.</p>
      ) : (
        <div className="mt-6 space-y-3">
          {leads.map((lead) => (
            <div key={lead.id} className="rounded-lg border border-brand/10 bg-white p-4 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-medium text-brand-dark">{lead.sourceEnquiry.name}</p>
                  <p className="text-xs text-brand/60">
                    Originally enquired about {lead.sourceEnquiry.property.name} ({lead.sourceEnquiry.property.category.name})
                    &middot; {lead.createdAt.toLocaleString()}
                  </p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1.5">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${PARTNER_LEAD_STATUS_BADGE_CLASS[lead.status]}`}>
                    {PARTNER_LEAD_STATUS_LABELS[lead.status]}
                  </span>
                  <PartnerLeadStatusSelect leadId={lead.id} status={lead.status} />
                </div>
              </div>
              <dl className="mt-3 grid grid-cols-1 gap-x-4 gap-y-1 text-sm sm:grid-cols-2">
                <div className="flex justify-between gap-2 sm:justify-start">
                  <dt className="text-brand/50">Phone</dt>
                  <dd className="text-brand-dark/80">{lead.sourceEnquiry.phone}</dd>
                </div>
                <div className="flex justify-between gap-2 sm:justify-start">
                  <dt className="text-brand/50">Email</dt>
                  <dd className="text-brand-dark/80">{lead.sourceEnquiry.email ?? "—"}</dd>
                </div>
                <div className="flex justify-between gap-2 sm:justify-start">
                  <dt className="text-brand/50">Event date</dt>
                  <dd className="text-brand-dark/80">{lead.sourceEnquiry.eventDate ? lead.sourceEnquiry.eventDate.toLocaleDateString() : "—"}</dd>
                </div>
                <div className="flex justify-between gap-2 sm:justify-start">
                  <dt className="text-brand/50">Guests</dt>
                  <dd className="text-brand-dark/80">{lead.sourceEnquiry.guests ?? "—"}</dd>
                </div>
                <div className="flex justify-between gap-2 sm:justify-start">
                  <dt className="text-brand/50">Budget</dt>
                  <dd className="text-brand-dark/80">{lead.sourceEnquiry.budget ?? "—"}</dd>
                </div>
              </dl>
              {lead.sourceEnquiry.requirement && (
                <p className="mt-2 text-sm text-brand-dark/70">&ldquo;{lead.sourceEnquiry.requirement}&rdquo;</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
