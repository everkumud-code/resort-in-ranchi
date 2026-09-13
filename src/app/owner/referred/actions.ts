"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getOwnerAccessPropertyId } from "@/lib/auth/ownerAccess";
import { isValidPartnerLeadStatus } from "@/lib/validation/partnerLead";

export interface UpdatePartnerLeadStatusState {
  error?: string;
}

/**
 * Owner-only. Updates only PartnerLead.status/statusUpdatedAt — never the
 * source Enquiry row. Scoped strictly to the authenticated owner's own
 * property: the partner's own id is resolved from the session's propertyId
 * first, then the conditional updateMany only matches a lead that actually
 * belongs to that partner (flat-field check, count-verified) — a signed-in
 * owner can never update a lead belonging to another property's partner,
 * even by guessing a leadId.
 */
export async function updatePartnerLeadStatus(
  leadId: string,
  _prevState: UpdatePartnerLeadStatusState,
  formData: FormData
): Promise<UpdatePartnerLeadStatusState> {
  const propertyId = await getOwnerAccessPropertyId();
  if (!propertyId) return { error: "Not signed in." };

  const status = String(formData.get("status") ?? "");
  if (!isValidPartnerLeadStatus(status)) return { error: "Invalid status." };

  const partner = await prisma.leadPartner.findUnique({ where: { propertyId }, select: { id: true } });
  if (!partner) return { error: "You are not configured as a lead partner." };

  const updated = await prisma.partnerLead.updateMany({
    where: { id: leadId, partnerId: partner.id },
    data: { status, statusUpdatedAt: new Date() },
  });
  if (updated.count !== 1) return { error: "Lead not found." };

  revalidatePath("/owner/referred");
  return {};
}
