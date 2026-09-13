"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { generateSessionToken, hashToken, requireOwnerAccessAdmin } from "@/lib/auth/session";
import { OWNER_INITIAL_TOKEN_DURATION_MS } from "@/lib/auth/ownerAccess";
import { slugify, uniqueSlug } from "@/lib/import/slugify";
import { SITE_URL } from "@/lib/public/site";
import {
  buildClaimRequestDataFromSubmission,
  buildPropertyCreateDataFromSubmission,
  buildPropertyImagesCreateDataFromSubmission,
} from "@/lib/validation/propertySubmission";

export interface SubmissionApprovalState {
  error?: string;
  accessLink?: string;
}

class ApprovalBlockedError extends Error {}

/**
 * ADMIN/SUPER_ADMIN only. Approving a submission is architecturally the same
 * outcome as an approved claim on a freshly-created Discovery listing: it
 * creates the Property (PUBLISHED/DISCOVERED/claimed), an already-APPROVED
 * ClaimRequest recording the submitter as the owner, and a one-time
 * PropertyOwnerAccess credential — never a parallel access mechanism. It
 * never sets verificationStatus to VERIFIED — that stays a separate, later,
 * explicit admin action, exactly like claim approval.
 */
export async function approveSubmission(
  submissionId: string,
  _previousState: SubmissionApprovalState,
  _formData: FormData
): Promise<SubmissionApprovalState> {
  void _previousState;
  void _formData;
  const admin = await requireOwnerAccessAdmin();
  const token = generateSessionToken();
  const now = new Date();

  try {
    const propertyId = await prisma.$transaction(async (tx) => {
      const submission = await tx.propertySubmission.findUnique({ where: { id: submissionId } });
      if (!submission || submission.status !== "PENDING") throw new ApprovalBlockedError();

      const category = await tx.category.findUnique({ where: { id: submission.categoryId }, select: { id: true } });
      if (!category) throw new ApprovalBlockedError();

      const base = slugify(submission.name) || "listing";
      const existingSlugs = await tx.property.findMany({
        where: { slug: { startsWith: base } },
        select: { slug: true },
      });
      const slug = uniqueSlug(submission.name, new Set(existingSlugs.map((p) => p.slug)));

      const property = await tx.property.create({
        data: buildPropertyCreateDataFromSubmission(submission, slug),
        select: { id: true },
      });

      const images = buildPropertyImagesCreateDataFromSubmission(submission);
      if (images.length > 0) {
        await tx.propertyImage.createMany({
          data: images.map((image) => ({ ...image, propertyId: property.id })),
        });
      }

      if (submission.facilityIds.length > 0) {
        const validFacilities = await tx.facility.findMany({
          where: { id: { in: submission.facilityIds } },
          select: { id: true },
        });
        if (validFacilities.length > 0) {
          await tx.propertyFacility.createMany({
            data: validFacilities.map((facility) => ({ propertyId: property.id, facilityId: facility.id })),
          });
        }
      }

      const claim = await tx.claimRequest.create({
        data: buildClaimRequestDataFromSubmission(submission, { propertyId: property.id, adminId: admin.id, now }),
        select: { id: true },
      });

      await tx.propertyOwnerAccess.create({
        data: {
          propertyId: property.id,
          claimRequestId: claim.id,
          tokenHash: hashToken(token),
          expiresAt: new Date(now.getTime() + OWNER_INITIAL_TOKEN_DURATION_MS),
        },
      });

      const updatedSubmission = await tx.propertySubmission.updateMany({
        where: { id: submissionId, status: "PENDING" },
        data: { status: "APPROVED", reviewedAt: now, reviewedById: admin.id, approvedPropertyId: property.id },
      });
      if (updatedSubmission.count !== 1) throw new ApprovalBlockedError();

      return property.id;
    });

    revalidatePath("/admin/submissions");
    revalidatePath(`/admin/properties/${propertyId}`);
    // Returned only in the action response, never embedded in an admin URL or logged.
    return { accessLink: `${SITE_URL}/owner/access?token=${token}` };
  } catch (error) {
    if (error instanceof ApprovalBlockedError) {
      return { error: "This submission can no longer be approved (already reviewed, or its category was removed)." };
    }
    throw error;
  }
}

export async function rejectSubmission(submissionId: string, formData: FormData): Promise<void> {
  const admin = await requireOwnerAccessAdmin();
  const submission = await prisma.propertySubmission.findUnique({ where: { id: submissionId } });
  if (!submission || submission.status !== "PENDING") return;

  const rawNote = formData.get("rejectionNote");
  const rejectionNote = typeof rawNote === "string" && rawNote.trim() !== "" ? rawNote.trim() : null;

  await prisma.propertySubmission.update({
    where: { id: submissionId },
    data: { status: "REJECTED", reviewedAt: new Date(), reviewedById: admin.id, rejectionNote },
  });
  revalidatePath("/admin/submissions");
}
