import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { canManageOwnerAccess, requireAdmin } from "@/lib/auth/session";
import { PARTNER_LEAD_STATUS_LABELS } from "@/lib/validation/partnerLead";
import PartnerForm from "./PartnerForm";
import PartnerEligibilityForm from "./PartnerEligibilityForm";

export const dynamic = "force-dynamic";

export default async function PartnersPage() {
  const admin = await requireAdmin();
  const mayManage = canManageOwnerAccess(admin.role);

  const [partners, properties, categories, locations, leadStatusCounts, totalLeadCount] = await Promise.all([
    prisma.leadPartner.findMany({
      include: { property: { select: { id: true, name: true, slug: true } }, _count: { select: { leads: true } } },
      orderBy: [{ priority: "desc" }, { createdAt: "asc" }],
    }),
    prisma.property.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.category.findMany({ orderBy: { name: "asc" }, select: { slug: true, name: true } }),
    prisma.location.findMany({ orderBy: { name: "asc" }, select: { slug: true, name: true } }),
    prisma.partnerLead.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.partnerLead.count(),
  ]);
  const leadCountByStatus = Object.fromEntries(leadStatusCounts.map((g) => [g.status, g._count._all]));

  const configuredPropertyIds = new Set(partners.map((p) => p.propertyId));
  const availableProperties = properties.filter((p) => !configuredPropertyIds.has(p.id));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Lead partners</h1>
        <p className="mt-1 text-sm text-slate-500">
          A partner only ever receives an enquiry for the categories checked below, and only when the enquire page
          discloses that sharing to the visitor beforehand. Configuring a partner never changes that property&apos;s
          own listing data.
        </p>
      </div>

      {!mayManage && <p className="rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-800">Only Admins can configure lead partners.</p>}

      <section>
        <h2 className="text-sm font-semibold text-slate-900">Configured partners ({partners.length})</h2>
        {partners.length === 0 ? (
          <p className="mt-2 text-sm text-slate-400">No lead partners configured yet.</p>
        ) : (
          <div className="mt-3 space-y-3">
            {partners.map((partner) => (
              <div key={partner.id} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <span className="font-medium text-slate-900">{partner.property.name}</span>
                    <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                      priority {partner.priority}
                    </span>
                    <span className="ml-2 text-xs text-slate-400">
                      {partner._count.leads} lead{partner._count.leads === 1 ? "" : "s"} received
                      {partner.monthlyLeadCap !== null ? ` · cap ${partner.monthlyLeadCap}/mo` : " · unlimited"}
                    </span>
                  </div>
                </div>
                {mayManage ? (
                  <div className="mt-3">
                    <PartnerEligibilityForm
                      partnerId={partner.id}
                      enabled={partner.enabled}
                      eligibleCategorySlugs={partner.eligibleCategorySlugs}
                      eligibleLocationSlugs={partner.eligibleLocationSlugs}
                      priority={partner.priority}
                      monthlyLeadCap={partner.monthlyLeadCap}
                      categories={categories}
                      locations={locations}
                    />
                  </div>
                ) : (
                  <p className="mt-2 text-xs text-slate-500">
                    {partner.enabled ? "Enabled" : "Disabled"} · {partner.eligibleCategorySlugs.join(", ") || "No categories"} ·{" "}
                    {partner.eligibleLocationSlugs.join(", ") || "Any location"}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {mayManage && (
        <section>
          <PartnerForm properties={availableProperties} categories={categories} locations={locations} />
        </section>
      )}

      <section>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-slate-900">Partner-lead activity ({totalLeadCount})</h2>
          <Link href="/admin/partners/leads" className="text-sm font-medium text-slate-700 hover:underline">
            View full lead detail &rarr;
          </Link>
        </div>
        <p className="mt-1 text-xs text-slate-500">
          Never shown publicly — visible to admins only. Each lead is a referred copy of an enquiry; the original
          enquiry to the property enquired about is unaffected.
        </p>
        {totalLeadCount === 0 ? (
          <p className="mt-2 text-sm text-slate-400">No partner leads yet.</p>
        ) : (
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {(["NEW", "CONTACTED", "CONVERTED", "CLOSED_LOST"] as const).map((value) => (
              <Link
                key={value}
                href={`/admin/partners/leads?status=${value}`}
                className="rounded-lg border border-slate-200 bg-white p-3 text-center shadow-sm hover:border-slate-400"
              >
                <p className="text-lg font-semibold text-slate-900">{leadCountByStatus[value] ?? 0}</p>
                <p className="text-xs text-slate-500">{PARTNER_LEAD_STATUS_LABELS[value]}</p>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
