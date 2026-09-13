import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getOwnerAccessPropertyId } from "@/lib/auth/ownerAccess";
import { ENQUIRY_STATUS_BADGE_CLASS, ENQUIRY_STATUS_LABELS, ENQUIRY_STATUS_VALUES } from "@/lib/validation/enquiry";

export const dynamic = "force-dynamic";

interface PageSearchParams {
  status?: string;
}

export default async function OwnerEnquiriesPage({ searchParams }: { searchParams: Promise<PageSearchParams> }) {
  const propertyId = await getOwnerAccessPropertyId();
  if (!propertyId) redirect("/owner");

  const { status } = await searchParams;
  const validStatus = ENQUIRY_STATUS_VALUES.includes(status as (typeof ENQUIRY_STATUS_VALUES)[number]) ? status : undefined;

  // Scoped to the authenticated session's own property only — the same
  // propertyId that gates every owner Server Action, never a query param.
  // The status filter narrows within that same scope; it can never widen it
  // to another property's enquiries.
  const [property, enquiries, newCount] = await Promise.all([
    prisma.property.findUnique({ where: { id: propertyId }, select: { id: true, name: true } }),
    prisma.enquiry.findMany({
      where: validStatus ? { propertyId, status: validStatus as (typeof ENQUIRY_STATUS_VALUES)[number] } : { propertyId },
      orderBy: { createdAt: "desc" },
      take: 200,
    }),
    prisma.enquiry.count({ where: { propertyId, status: "NEW" } }),
  ]);
  if (!property) redirect("/owner");

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <Link href="/owner" className="text-sm text-brand-teal hover:underline">
        &larr; Back to dashboard
      </Link>
      <h1 className="mt-3 font-serif text-2xl font-semibold text-brand-dark">Enquiries</h1>
      <p className="mt-1 text-sm text-brand/60">
        People who&apos;ve reached out about {property.name} through ResortInRanchi.
        {newCount > 0 && (
          <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800">{newCount} new</span>
        )}
      </p>

      <div className="mt-4 flex flex-wrap gap-2 text-sm">
        <Link
          href="/owner/enquiries"
          className={
            !validStatus
              ? "rounded-full bg-brand-dark px-3 py-1 text-white"
              : "rounded-full border border-brand/20 px-3 py-1 text-brand-dark/70 hover:bg-brand-cream/60"
          }
        >
          All
        </Link>
        {ENQUIRY_STATUS_VALUES.map((value) => (
          <Link
            key={value}
            href={`/owner/enquiries?status=${value}`}
            className={
              validStatus === value
                ? "rounded-full bg-brand-dark px-3 py-1 text-white"
                : "rounded-full border border-brand/20 px-3 py-1 text-brand-dark/70 hover:bg-brand-cream/60"
            }
          >
            {ENQUIRY_STATUS_LABELS[value]}
          </Link>
        ))}
      </div>

      {enquiries.length === 0 ? (
        <p className="mt-8 text-sm text-brand/50">{validStatus ? `No ${ENQUIRY_STATUS_LABELS[validStatus as (typeof ENQUIRY_STATUS_VALUES)[number]].toLowerCase()} enquiries.` : "No enquiries yet."}</p>
      ) : (
        <div className="mt-6 space-y-3">
          {enquiries.map((enquiry) => (
            <div key={enquiry.id} className="rounded-lg border border-brand/10 bg-white p-4 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-medium text-brand-dark">{enquiry.name}</p>
                  <p className="text-xs text-brand/60">{enquiry.createdAt.toLocaleString()}</p>
                </div>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-semibold ${ENQUIRY_STATUS_BADGE_CLASS[enquiry.status]}`}
                >
                  {ENQUIRY_STATUS_LABELS[enquiry.status]}
                </span>
              </div>

              <dl className="mt-3 grid grid-cols-1 gap-x-4 gap-y-1 text-sm sm:grid-cols-2">
                <div className="flex justify-between gap-2 sm:justify-start">
                  <dt className="text-brand/50">Phone</dt>
                  <dd className="text-brand-dark/80">{enquiry.phone}</dd>
                </div>
                <div className="flex justify-between gap-2 sm:justify-start">
                  <dt className="text-brand/50">Email</dt>
                  <dd className="text-brand-dark/80">{enquiry.email ?? "—"}</dd>
                </div>
                <div className="flex justify-between gap-2 sm:justify-start">
                  <dt className="text-brand/50">Event date</dt>
                  <dd className="text-brand-dark/80">{enquiry.eventDate ? enquiry.eventDate.toLocaleDateString() : "—"}</dd>
                </div>
                <div className="flex justify-between gap-2 sm:justify-start">
                  <dt className="text-brand/50">Guests</dt>
                  <dd className="text-brand-dark/80">{enquiry.guests ?? "—"}</dd>
                </div>
                <div className="flex justify-between gap-2 sm:justify-start">
                  <dt className="text-brand/50">Budget</dt>
                  <dd className="text-brand-dark/80">{enquiry.budget ?? "—"}</dd>
                </div>
              </dl>
              {enquiry.requirement && (
                <p className="mt-2 text-sm text-brand-dark/70">&ldquo;{enquiry.requirement}&rdquo;</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
