"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/session";
import { computeBulkPublishPlan, BULK_PUBLISH_CONFIRM_PHRASE } from "@/lib/validation/bulkPublish";

export interface BulkPublishState {
  error?: string;
  publishedCount?: number;
}

/**
 * Publishes every currently-eligible Discovery listing in one transaction.
 * Re-derives the eligible set from a fresh DB read every time it runs —
 * never trusts a client-supplied ID list — and refuses to run at all unless
 * the admin typed the exact confirmation phrase, so this can never fire from
 * an accidental click. Only ever sets status: PUBLISHED; verificationStatus
 * stays DISCOVERED and the public trust tier stays "Discovery listing" for
 * every property this touches (see getPublicTrustTier).
 */
export async function bulkPublishDiscoveryListings(
  _prevState: BulkPublishState,
  formData: FormData
): Promise<BulkPublishState> {
  await requireAdmin();

  const confirmation = String(formData.get("confirm") ?? "");
  if (confirmation !== BULK_PUBLISH_CONFIRM_PHRASE) {
    return { error: `Type "${BULK_PUBLISH_CONFIRM_PHRASE}" exactly to confirm.` };
  }

  const properties = await prisma.property.findMany({
    select: { id: true, status: true, verificationStatus: true },
  });
  const plan = computeBulkPublishPlan(properties);

  if (plan.eligibleIds.length === 0) {
    return { error: "No eligible Discovery listings to publish." };
  }

  await prisma.property.updateMany({
    where: { id: { in: plan.eligibleIds } },
    data: { status: "PUBLISHED" },
  });

  revalidatePath("/admin/properties");
  revalidatePath("/");

  return { publishedCount: plan.eligibleIds.length };
}
