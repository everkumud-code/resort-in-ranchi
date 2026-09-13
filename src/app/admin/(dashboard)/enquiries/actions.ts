"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/session";
import { ENQUIRY_STATUS_VALUES } from "@/lib/validation/enquiry";

export interface UpdateEnquiryStatusState {
  error?: string;
}

/**
 * Lead/status management is ordinary content-workflow, not a security-
 * sensitive owner-access action — uses the same requireAdmin() gate as
 * every other property-editing action, which EDITOR already passes (the
 * stricter ADMIN/SUPER_ADMIN-only gate exists specifically for owner-access
 * management and was never extended to enquiries).
 */
export async function updateEnquiryStatus(
  enquiryId: string,
  _prevState: UpdateEnquiryStatusState,
  formData: FormData
): Promise<UpdateEnquiryStatusState> {
  await requireAdmin();

  const status = String(formData.get("status") ?? "");
  if (!ENQUIRY_STATUS_VALUES.includes(status as (typeof ENQUIRY_STATUS_VALUES)[number])) {
    return { error: "Invalid status." };
  }

  await prisma.enquiry.update({ where: { id: enquiryId }, data: { status: status as (typeof ENQUIRY_STATUS_VALUES)[number] } });
  revalidatePath("/admin/enquiries");
  return {};
}
