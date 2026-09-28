import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/session";
import { toCsv } from "@/lib/csv";
import { ENQUIRY_STATUS_VALUES } from "@/lib/validation/enquiry";

export const dynamic = "force-dynamic";

const MAX_ROWS = 5000;

/** Admin-only CSV download of enquiries (optionally one status). Nothing is sent anywhere automatically. */
export async function GET(request: Request) {
  await requireAdmin();

  const status = new URL(request.url).searchParams.get("status");
  const validStatus = ENQUIRY_STATUS_VALUES.find((value) => value === status);

  const enquiries = await prisma.enquiry.findMany({
    where: validStatus ? { status: validStatus } : undefined,
    include: { property: { select: { name: true, slug: true } } },
    orderBy: { createdAt: "desc" },
    take: MAX_ROWS,
  });

  const csv = toCsv(
    ["Submitted (UTC)", "Status", "Listing", "Listing slug", "Name", "Phone", "Email", "Event date", "Guests", "Budget", "Requirement", "Source page"],
    enquiries.map((e) => [
      e.createdAt,
      e.status,
      e.property.name,
      e.property.slug,
      e.name,
      e.phone,
      e.email,
      e.eventDate ? e.eventDate.toISOString().slice(0, 10) : null,
      e.guests,
      e.budget,
      e.requirement,
      e.sourcePage,
    ])
  );

  const stamp = new Date().toISOString().slice(0, 10);
  return new Response(`﻿${csv}`, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="enquiries-${validStatus ? validStatus.toLowerCase() + "-" : ""}${stamp}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
