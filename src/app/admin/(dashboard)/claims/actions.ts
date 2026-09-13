"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { generateSessionToken, hashToken, requireOwnerAccessAdmin } from "@/lib/auth/session";
import { OWNER_INITIAL_TOKEN_DURATION_MS, propertyEligibleForOwnerAccess } from "@/lib/auth/ownerAccess";
import { buildClaimApprovalData, buildRegenerateOwnerLinkData, canApproveOwnerAccess } from "@/lib/validation/claim";
import { SITE_URL } from "@/lib/public/site";

export interface ClaimApprovalState {
  error?: string;
  accessLink?: string;
}

class ApprovalBlockedError extends Error {}

/**
 * ADMIN/SUPER_ADMIN only. The property is re-read and conditionally claimed
 * inside the transaction; the database's unique propertyId constraint is a
 * second line of defence against concurrent approvals.
 */
export async function approveClaim(
  claimId: string,
  _previousState: ClaimApprovalState,
  _formData: FormData
): Promise<ClaimApprovalState> {
  void _previousState;
  void _formData;
  const admin = await requireOwnerAccessAdmin();
  const token = generateSessionToken();
  const now = new Date();

  try {
    const approved = await prisma.$transaction(async (tx) => {
      const claim = await tx.claimRequest.findUnique({ where: { id: claimId } });
      if (!claim || claim.status !== "PENDING") throw new ApprovalBlockedError();

      const property = await tx.property.findUnique({
        where: { id: claim.propertyId },
        select: { id: true, status: true, claimed: true },
      });
      if (!property || !propertyEligibleForOwnerAccess(property)) throw new ApprovalBlockedError();

      const activeAccess = await tx.propertyOwnerAccess.findFirst({
        where: { propertyId: property.id, revokedAt: null, expiresAt: { gt: now } },
        select: { id: true },
      });
      if (!canApproveOwnerAccess({ claimStatus: claim.status, propertyClaimed: property.claimed, hasActiveOwnerAccess: Boolean(activeAccess) })) {
        throw new ApprovalBlockedError();
      }

      const claimed = await tx.property.updateMany({
        where: { id: property.id, claimed: false, status: "PUBLISHED" },
        data: { claimed: true },
      });
      if (claimed.count !== 1) throw new ApprovalBlockedError();

      const writes = buildClaimApprovalData({
        adminId: admin.id,
        propertyId: property.id,
        claimRequestId: claim.id,
        tokenHash: hashToken(token),
        now,
        expiresAt: new Date(now.getTime() + OWNER_INITIAL_TOKEN_DURATION_MS),
      });
      const updatedClaim = await tx.claimRequest.updateMany({
        where: { id: claim.id, status: "PENDING" },
        data: writes.claimUpdate,
      });
      if (updatedClaim.count !== 1) throw new ApprovalBlockedError();
      await tx.propertyOwnerAccess.create({ data: writes.ownerAccessCreate });
      return property.id;
    });

    revalidatePath("/admin/claims");
    revalidatePath(`/admin/properties/${approved}`);
    // Returned only in the action response, never embedded in an admin URL.
    return { accessLink: `${SITE_URL}/owner/access?token=${token}` };
  } catch (error) {
    if (error instanceof ApprovalBlockedError || (typeof error === "object" && error && "code" in error && error.code === "P2002")) {
      return { error: "This claim can no longer be approved because the listing already has owner access or is no longer eligible." };
    }
    throw error;
  }
}

export async function rejectClaim(claimId: string): Promise<void> {
  const admin = await requireOwnerAccessAdmin();
  const claim = await prisma.claimRequest.findUnique({ where: { id: claimId } });
  if (!claim || claim.status !== "PENDING") return;
  await prisma.claimRequest.update({
    where: { id: claimId },
    data: { status: "REJECTED", reviewedAt: new Date(), reviewedById: admin.id },
  });
  revalidatePath("/admin/claims");
}

/** Revoking the parent access immediately invalidates every linked owner session. */
export async function revokeOwnerAccess(ownerAccessId: string): Promise<void> {
  await requireOwnerAccessAdmin();
  await prisma.propertyOwnerAccess.updateMany({ where: { id: ownerAccessId, revokedAt: null }, data: { revokedAt: new Date() } });
  revalidatePath("/admin/claims");
}

export interface RegenerateOwnerLinkState {
  error?: string;
  accessLink?: string;
}

/**
 * ADMIN/SUPER_ADMIN only. Generates a fresh single-use owner link for an
 * already-approved claim by updating the EXISTING PropertyOwnerAccess row in
 * place (same id) — never by creating a second row. This is deliberate: the
 * row's `propertyId` and `claimRequestId` are permanently unique (one owner
 * -access record ever, per property/per claim — see the "single-owner
 * database guard" test), so a second `.create()` for the same property/claim
 * would always violate those constraints. Reusing the row sidesteps that
 * entirely; see buildRegenerateOwnerLinkData for the exact write shape.
 *
 * The old link stops working immediately (its tokenHash is overwritten, so
 * no row matches it anymore). An owner's already-established browser session
 * is untouched — sessions are validated against this row's revokedAt/
 * expiresAt, never its tokenHash, and this always leaves revokedAt null and
 * expiresAt in the future.
 */
export async function regenerateOwnerLink(
  ownerAccessId: string,
  _previousState: RegenerateOwnerLinkState,
  _formData: FormData
): Promise<RegenerateOwnerLinkState> {
  void _previousState;
  void _formData;
  await requireOwnerAccessAdmin();
  const token = generateSessionToken();
  const now = new Date();

  try {
    const propertyId = await prisma.$transaction(async (tx) => {
      const existing = await tx.propertyOwnerAccess.findUnique({
        where: { id: ownerAccessId },
        include: { property: { select: { id: true, status: true } } },
      });
      if (!existing) throw new Error("Owner access not found.");
      if (!propertyEligibleForOwnerAccess(existing.property)) throw new Error("Property is no longer eligible for owner access.");

      await tx.propertyOwnerAccess.update({
        where: { id: ownerAccessId },
        data: buildRegenerateOwnerLinkData({
          tokenHash: hashToken(token),
          expiresAt: new Date(now.getTime() + OWNER_INITIAL_TOKEN_DURATION_MS),
        }),
      });

      return existing.propertyId;
    });

    revalidatePath("/admin/claims");
    revalidatePath(`/admin/properties/${propertyId}`);
    return { accessLink: `${SITE_URL}/owner/access?token=${token}` };
  } catch (error) {
    return { error: (error instanceof Error ? error.message : "Failed to regenerate owner link. Please try again.") };
  }
}
