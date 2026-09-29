"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/session";
import { influencerSchema, criterionNameSchema } from "@/lib/validation/influencer";
import { isValidRatingScore } from "@/lib/influencers";
import { slugify } from "@/lib/blog/blog";
import {
  buildInfluencerClaimApprovalData,
  buildRegenerateInfluencerOwnerLinkData,
  canApproveInfluencerOwnerAccess,
} from "@/lib/validation/influencerClaim";
import { influencerEligibleForOwnerAccess, CREATOR_INITIAL_TOKEN_DURATION_MS } from "@/lib/auth/creatorAccess";
import { generateSessionToken, hashToken, canManageOwnerAccess } from "@/lib/auth/session";
import { SITE_URL } from "@/lib/public/site";

export interface InfluencerFormState {
  error?: string;
  fieldErrors?: Record<string, string>;
}

function parseForm(formData: FormData) {
  return influencerSchema.safeParse({
    name: formData.get("name"),
    slug: formData.get("slug"),
    photoUrl: formData.get("photoUrl"),
    videoUrl: formData.get("videoUrl"),
    bio: formData.get("bio"),
    category: formData.get("category"),
    instagramUrl: formData.get("instagramUrl"),
    youtubeUrl: formData.get("youtubeUrl"),
    websiteUrl: formData.get("websiteUrl"),
    contactEmail: formData.get("contactEmail"),
    contactPhone: formData.get("contactPhone"),
    featured: formData.get("featured"),
    order: formData.get("order"),
    status: formData.get("status"),
  });
}

function fieldErrorsFrom(issues: { path: PropertyKey[]; message: string }[]) {
  const fieldErrors: Record<string, string> = {};
  for (const issue of issues) {
    const key = issue.path.map(String).join(".");
    if (!fieldErrors[key]) fieldErrors[key] = issue.message;
  }
  return fieldErrors;
}

function revalidateInfluencers(slug?: string) {
  revalidatePath("/admin/influencers");
  revalidatePath("/influencers");
  revalidatePath("/");
  if (slug) revalidatePath(`/influencers/${slug}`);
}

export async function createInfluencer(_prevState: InfluencerFormState, formData: FormData): Promise<InfluencerFormState> {
  await requireAdmin();
  const parsed = parseForm(formData);
  if (!parsed.success) return { error: "Please fix the errors below.", fieldErrors: fieldErrorsFrom(parsed.error.issues) };

  const existing = await prisma.influencer.findUnique({ where: { slug: parsed.data.slug } });
  if (existing) return { error: "Please fix the errors below.", fieldErrors: { slug: "This slug is already in use." } };

  const created = await prisma.influencer.create({ data: parsed.data });
  revalidateInfluencers(created.slug);
  redirect(`/admin/influencers/${created.id}?saved=1`);
}

export async function updateInfluencer(influencerId: string, _prevState: InfluencerFormState, formData: FormData): Promise<InfluencerFormState> {
  await requireAdmin();
  const parsed = parseForm(formData);
  if (!parsed.success) return { error: "Please fix the errors below.", fieldErrors: fieldErrorsFrom(parsed.error.issues) };

  const current = await prisma.influencer.findUnique({ where: { id: influencerId }, select: { slug: true } });
  if (!current) return { error: "Influencer not found." };

  const slugOwner = await prisma.influencer.findUnique({ where: { slug: parsed.data.slug } });
  if (slugOwner && slugOwner.id !== influencerId) {
    return { error: "Please fix the errors below.", fieldErrors: { slug: "This slug is already in use." } };
  }

  await prisma.influencer.update({ where: { id: influencerId }, data: parsed.data });
  revalidateInfluencers(current.slug);
  revalidateInfluencers(parsed.data.slug);
  redirect(`/admin/influencers/${influencerId}?saved=1`);
}

export async function deleteInfluencer(influencerId: string): Promise<void> {
  await requireAdmin();
  const existing = await prisma.influencer.findUnique({ where: { id: influencerId }, select: { slug: true } });
  if (!existing) return;
  await prisma.influencer.delete({ where: { id: influencerId } });
  revalidateInfluencers(existing.slug);
}

export interface CriterionFormState {
  error?: string;
}

export async function createCriterion(_prevState: CriterionFormState, formData: FormData): Promise<CriterionFormState> {
  await requireAdmin();
  const parsed = criterionNameSchema.safeParse(formData.get("name"));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid name." };

  const slug = slugify(parsed.data);
  const existing = await prisma.influencerCriterion.findUnique({ where: { slug } });
  if (existing) return { error: "A criterion with this name already exists." };

  const count = await prisma.influencerCriterion.count();
  await prisma.influencerCriterion.create({ data: { name: parsed.data, slug, order: count } });
  revalidatePath("/admin/influencers");
  return {};
}

export async function deleteCriterion(criterionId: string): Promise<void> {
  await requireAdmin();
  await prisma.influencerCriterion.delete({ where: { id: criterionId } });
  revalidateInfluencers();
}

/** Sets (or clears, with an empty value) one influencer's score for one criterion — admin-only editorial rating, never a public review. */
export async function setInfluencerRating(influencerId: string, criterionId: string, formData: FormData): Promise<void> {
  await requireAdmin();
  const raw = String(formData.get("score") ?? "").trim();
  if (raw === "") {
    await prisma.influencerRating.deleteMany({ where: { influencerId, criterionId } });
    revalidateInfluencers();
    return;
  }
  const score = Math.trunc(Number(raw));
  if (!isValidRatingScore(score)) return;
  await prisma.influencerRating.upsert({
    where: { influencerId_criterionId: { influencerId, criterionId } },
    create: { influencerId, criterionId, score },
    update: { score },
  });
  const influencer = await prisma.influencer.findUnique({ where: { id: influencerId }, select: { slug: true } });
  revalidateInfluencers(influencer?.slug);
}

// ---------------------------------------------------------------------------
// Creator claims — mirrors admin/claims/actions.ts exactly, applied to Influencer.
// ---------------------------------------------------------------------------

export interface InfluencerClaimApprovalState {
  error?: string;
  accessLink?: string;
}

class InfluencerApprovalBlockedError extends Error {}

export async function approveInfluencerClaim(
  claimId: string,
  _previousState: InfluencerClaimApprovalState,
  _formData: FormData
): Promise<InfluencerClaimApprovalState> {
  void _previousState;
  void _formData;
  const admin = await requireAdmin();
  if (!canManageOwnerAccess(admin.role)) return { error: "Only Admins can approve creator claims." };
  const token = generateSessionToken();
  const now = new Date();

  try {
    const approved = await prisma.$transaction(async (tx) => {
      const claim = await tx.influencerClaimRequest.findUnique({ where: { id: claimId } });
      if (!claim || claim.status !== "PENDING") throw new InfluencerApprovalBlockedError();

      const influencer = await tx.influencer.findUnique({
        where: { id: claim.influencerId },
        select: { id: true, status: true, claimed: true, slug: true },
      });
      if (!influencer || !influencerEligibleForOwnerAccess(influencer)) throw new InfluencerApprovalBlockedError();

      const activeAccess = await tx.influencerOwnerAccess.findFirst({
        where: { influencerId: influencer.id, revokedAt: null, expiresAt: { gt: now } },
        select: { id: true },
      });
      if (!canApproveInfluencerOwnerAccess({ claimStatus: claim.status, influencerClaimed: influencer.claimed, hasActiveOwnerAccess: Boolean(activeAccess) })) {
        throw new InfluencerApprovalBlockedError();
      }

      const claimed = await tx.influencer.updateMany({ where: { id: influencer.id, claimed: false }, data: { claimed: true } });
      if (claimed.count !== 1) throw new InfluencerApprovalBlockedError();

      const writes = buildInfluencerClaimApprovalData({
        adminId: admin.id,
        influencerId: influencer.id,
        claimRequestId: claim.id,
        tokenHash: hashToken(token),
        now,
        expiresAt: new Date(now.getTime() + CREATOR_INITIAL_TOKEN_DURATION_MS),
      });
      const updatedClaim = await tx.influencerClaimRequest.updateMany({ where: { id: claim.id, status: "PENDING" }, data: writes.claimUpdate });
      if (updatedClaim.count !== 1) throw new InfluencerApprovalBlockedError();
      await tx.influencerOwnerAccess.create({ data: writes.ownerAccessCreate });
      return influencer.slug;
    });

    revalidateInfluencers(approved);
    revalidatePath("/admin/influencers");
    return { accessLink: `${SITE_URL}/creator/access?token=${token}` };
  } catch (error) {
    if (error instanceof InfluencerApprovalBlockedError || (typeof error === "object" && error && "code" in error && error.code === "P2002")) {
      return { error: "This claim can no longer be approved because the profile already has creator access or is no longer eligible." };
    }
    throw error;
  }
}

export async function rejectInfluencerClaim(claimId: string): Promise<void> {
  const admin = await requireAdmin();
  const claim = await prisma.influencerClaimRequest.findUnique({ where: { id: claimId } });
  if (!claim || claim.status !== "PENDING") return;
  await prisma.influencerClaimRequest.update({
    where: { id: claimId },
    data: { status: "REJECTED", reviewedAt: new Date(), reviewedById: admin.id },
  });
  revalidatePath("/admin/influencers");
}

export async function revokeInfluencerOwnerAccess(ownerAccessId: string): Promise<void> {
  await requireAdmin();
  await prisma.influencerOwnerAccess.updateMany({ where: { id: ownerAccessId, revokedAt: null }, data: { revokedAt: new Date() } });
  revalidatePath("/admin/influencers");
}

export interface RegenerateInfluencerLinkState {
  error?: string;
  accessLink?: string;
}

export async function regenerateInfluencerOwnerLink(
  ownerAccessId: string,
  _previousState: RegenerateInfluencerLinkState,
  _formData: FormData
): Promise<RegenerateInfluencerLinkState> {
  void _previousState;
  void _formData;
  await requireAdmin();
  const token = generateSessionToken();
  const now = new Date();

  try {
    await prisma.$transaction(async (tx) => {
      const existing = await tx.influencerOwnerAccess.findUnique({
        where: { id: ownerAccessId },
        include: { influencer: { select: { id: true, status: true } } },
      });
      if (!existing) throw new Error("Creator access not found.");
      if (!influencerEligibleForOwnerAccess(existing.influencer)) throw new Error("Profile is no longer eligible for creator access.");

      await tx.influencerOwnerAccess.update({
        where: { id: ownerAccessId },
        data: buildRegenerateInfluencerOwnerLinkData({ tokenHash: hashToken(token), expiresAt: new Date(now.getTime() + CREATOR_INITIAL_TOKEN_DURATION_MS) }),
      });
    });

    revalidatePath("/admin/influencers");
    return { accessLink: `${SITE_URL}/creator/access?token=${token}` };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Failed to regenerate creator link. Please try again." };
  }
}
