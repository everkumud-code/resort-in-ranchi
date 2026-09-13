"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireOwnerAccessAdmin } from "@/lib/auth/session";
import { getEligiblePartnersForProperty } from "@/lib/leadPartner";

export interface ReassignLeadState {
  error?: string;
}

/**
 * ADMIN/SUPER_ADMIN only. Reassigns an existing PartnerLead to a DIFFERENT
 * partner — in place, same row, same id — never creates a second row and
 * never touches the source Enquiry. The target partner must be genuinely
 * eligible for the original enquiry right now (re-evaluated fresh via the
 * exact same getEligiblePartnersForProperty function the public enquiry flow
 * uses, so reassignment can never distribute to an irrelevant, disabled, or
 * capped-out partner). The database's (partnerId, sourceEnquiryId) unique
 * constraint is the second line of defence against reassigning onto a
 * partner who already independently has their own lead for this enquiry.
 */
export async function reassignPartnerLead(
  leadId: string,
  _previousState: ReassignLeadState,
  formData: FormData
): Promise<ReassignLeadState> {
  await requireOwnerAccessAdmin();

  const newPartnerId = String(formData.get("partnerId") ?? "").trim();
  if (!newPartnerId) return { error: "Please choose a partner to reassign to." };

  const lead = await prisma.partnerLead.findUnique({
    where: { id: leadId },
    select: {
      partnerId: true,
      sourceEnquiry: {
        select: {
          guests: true,
          property: { select: { id: true, category: { select: { slug: true } }, locality: { select: { slug: true } } } },
        },
      },
    },
  });
  if (!lead) return { error: "Lead not found." };
  if (newPartnerId === lead.partnerId) return { error: "That partner already has this lead." };

  const eligible = await getEligiblePartnersForProperty({
    propertyId: lead.sourceEnquiry.property.id,
    categorySlug: lead.sourceEnquiry.property.category.slug,
    localitySlug: lead.sourceEnquiry.property.locality?.slug ?? null,
    guests: lead.sourceEnquiry.guests,
  });
  const match = eligible.find(({ partner }) => partner.id === newPartnerId);
  if (!match) {
    return { error: "That partner is not currently eligible for this enquiry (category, location, capacity, cap, or self-referral)." };
  }

  try {
    await prisma.partnerLead.update({
      where: { id: leadId },
      data: {
        partnerId: newPartnerId,
        status: "NEW",
        statusUpdatedAt: null,
        deliveryStatus: "DELIVERED",
        lastDeliveredAt: new Date(),
        eligibilityReason: match.reason,
      },
    });
  } catch (error) {
    if (typeof error === "object" && error && "code" in error && error.code === "P2002") {
      return { error: "That partner already independently has a separate lead for this same enquiry." };
    }
    throw error;
  }

  revalidatePath("/admin/partners/leads");
  return {};
}

/**
 * ADMIN/SUPER_ADMIN only. Nudges an existing lead back to "freshly
 * delivered" — never changes partnerId/status, never touches the source
 * Enquiry. Useful when a partner says they missed it; there's no email/SMS
 * infrastructure in this codebase, so "delivery" stays what it always was
 * (visible in the admin and partner dashboards) — this just refreshes that
 * recency signal.
 */
export async function resendPartnerLead(leadId: string): Promise<void> {
  await requireOwnerAccessAdmin();
  await prisma.partnerLead.update({
    where: { id: leadId },
    data: { deliveryStatus: "DELIVERED", lastDeliveredAt: new Date() },
  });
  revalidatePath("/admin/partners/leads");
}
