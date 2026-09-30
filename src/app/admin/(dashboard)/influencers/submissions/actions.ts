"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { generateSessionToken, hashToken, requireOwnerAccessAdmin } from "@/lib/auth/session";
import { CREATOR_INITIAL_TOKEN_DURATION_MS } from "@/lib/auth/creatorAccess";
import { slugify, uniqueSlug } from "@/lib/import/slugify";
import { SITE_URL } from "@/lib/public/site";
import {
  buildInfluencerClaimRequestDataFromSubmission,
  buildInfluencerCreateDataFromSubmission,
} from "@/lib/validation/influencerSubmission";

export interface InfluencerSubmissionApprovalState {
  error?: string;
  accessLink?: string;
}

class ApprovalBlockedError extends Error {}

/**
 * ADMIN/SUPER_ADMIN only. Approving a submission is architecturally the same
 * outcome as an approved claim on a freshly-created profile: it creates the
 * Influencer (PUBLISHED/claimed), an already-APPROVED InfluencerClaimRequest
 * recording the submitter, and a one-time InfluencerOwnerAccess credential —
 * never a parallel access mechanism. It never sets featured — that stays a
 * separate, later, explicit admin decision, exactly like claim approval.
 */
export async function approveInfluencerSubmission(
  submissionId: string,
  _previousState: InfluencerSubmissionApprovalState,
  _formData: FormData
): Promise<InfluencerSubmissionApprovalState> {
  void _previousState;
  void _formData;
  const admin = await requireOwnerAccessAdmin();
  const token = generateSessionToken();
  const now = new Date();

  try {
    const influencerId = await prisma.$transaction(async (tx) => {
      const submission = await tx.influencerSubmission.findUnique({ where: { id: submissionId } });
      if (!submission || submission.status !== "PENDING") throw new ApprovalBlockedError();

      const base = slugify(submission.name) || "creator";
      const existingSlugs = await tx.influencer.findMany({
        where: { slug: { startsWith: base } },
        select: { slug: true },
      });
      const slug = uniqueSlug(submission.name, new Set(existingSlugs.map((i) => i.slug)));

      const influencer = await tx.influencer.create({
        data: buildInfluencerCreateDataFromSubmission(submission, slug),
        select: { id: true },
      });

      const claim = await tx.influencerClaimRequest.create({
        data: buildInfluencerClaimRequestDataFromSubmission(submission, { influencerId: influencer.id, adminId: admin.id, now }),
        select: { id: true },
      });

      await tx.influencerOwnerAccess.create({
        data: {
          influencerId: influencer.id,
          claimRequestId: claim.id,
          tokenHash: hashToken(token),
          expiresAt: new Date(now.getTime() + CREATOR_INITIAL_TOKEN_DURATION_MS),
        },
      });

      const updatedSubmission = await tx.influencerSubmission.updateMany({
        where: { id: submissionId, status: "PENDING" },
        data: { status: "APPROVED", reviewedAt: now, reviewedById: admin.id, approvedInfluencerId: influencer.id },
      });
      if (updatedSubmission.count !== 1) throw new ApprovalBlockedError();

      return influencer.id;
    });

    revalidatePath("/admin/influencers/submissions");
    revalidatePath(`/admin/influencers/${influencerId}`);
    revalidatePath("/influencers");
    // Returned only in the action response, never embedded in an admin URL or logged.
    return { accessLink: `${SITE_URL}/creator/access?token=${token}` };
  } catch (error) {
    if (error instanceof ApprovalBlockedError) {
      return { error: "This submission can no longer be approved (already reviewed)." };
    }
    throw error;
  }
}

export async function rejectInfluencerSubmission(submissionId: string, formData: FormData): Promise<void> {
  const admin = await requireOwnerAccessAdmin();
  const submission = await prisma.influencerSubmission.findUnique({ where: { id: submissionId } });
  if (!submission || submission.status !== "PENDING") return;

  const rawNote = formData.get("rejectionNote");
  const rejectionNote = typeof rawNote === "string" && rawNote.trim() !== "" ? rawNote.trim() : null;

  await prisma.influencerSubmission.update({
    where: { id: submissionId },
    data: { status: "REJECTED", reviewedAt: new Date(), reviewedById: admin.id, rejectionNote },
  });
  revalidatePath("/admin/influencers/submissions");
}
