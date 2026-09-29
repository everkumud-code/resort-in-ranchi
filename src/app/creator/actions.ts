"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { destroyCreatorSessionByToken, getCreatorAccessInfluencerId, CREATOR_SESSION_COOKIE_NAME } from "@/lib/auth/creatorAccess";
import { creatorProfileSchema } from "@/lib/validation/creatorProfile";

export interface CreatorActionState {
  error?: string;
  fieldErrors?: Record<string, string>;
  success?: boolean;
}

function fieldErrorsFrom(issues: { path: PropertyKey[]; message: string }[]) {
  const fieldErrors: Record<string, string> = {};
  for (const issue of issues) {
    const key = issue.path.map(String).join(".");
    if (!fieldErrors[key]) fieldErrors[key] = issue.message;
  }
  return fieldErrors;
}

async function assertCreatorAccess(influencerId: string): Promise<void> {
  const actual = await getCreatorAccessInfluencerId();
  if (actual !== influencerId) throw new Error("Not authorized for this creator profile.");
}

/**
 * The creator's own edit of their profile. Deliberately never touches
 * `featured`, `status`, `order` or `claimed` — the same admin-only boundary
 * OwnerEdit draws for vendors (see updateOwnerProperty).
 */
export async function updateCreatorProfile(influencerId: string, _prevState: CreatorActionState, formData: FormData): Promise<CreatorActionState> {
  await assertCreatorAccess(influencerId);

  const parsed = creatorProfileSchema.safeParse({
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
  });
  if (!parsed.success) {
    return { error: "Please fix the errors below.", fieldErrors: fieldErrorsFrom(parsed.error.issues) };
  }

  const current = await prisma.influencer.findUnique({ where: { id: influencerId }, select: { slug: true } });
  if (!current) return { error: "Profile not found." };

  const slugOwner = await prisma.influencer.findUnique({ where: { slug: parsed.data.slug } });
  if (slugOwner && slugOwner.id !== influencerId) {
    return { error: "Please fix the errors below.", fieldErrors: { slug: "That username is already taken." } };
  }

  await prisma.influencer.update({ where: { id: influencerId }, data: parsed.data });

  revalidatePath("/creator");
  revalidatePath("/creator/edit");
  revalidatePath("/influencers");
  revalidatePath("/");
  revalidatePath(`/influencers/${current.slug}`);
  if (parsed.data.slug !== current.slug) revalidatePath(`/influencers/${parsed.data.slug}`);
  return { success: true };
}

export async function updateCreatorEnquiryStatus(influencerId: string, enquiryId: string, formData: FormData): Promise<void> {
  await assertCreatorAccess(influencerId);
  const status = String(formData.get("status") ?? "");
  const validStatuses = ["NEW", "CONTACTED", "CONVERTED", "CLOSED", "SPAM"];
  if (!validStatuses.includes(status)) return;
  await prisma.influencerEnquiry.updateMany({
    where: { id: enquiryId, influencerId },
    data: { status: status as "NEW" | "CONTACTED" | "CONVERTED" | "CLOSED" | "SPAM" },
  });
  revalidatePath("/creator/enquiries");
}

export async function logoutCreator(): Promise<void> {
  const store = await cookies();
  const token = store.get(CREATOR_SESSION_COOKIE_NAME)?.value;
  if (token) await destroyCreatorSessionByToken(token);
  store.delete({ name: CREATOR_SESSION_COOKIE_NAME, path: "/creator" });
  redirect("/creator");
}
