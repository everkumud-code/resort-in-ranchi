"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/session";
import { influencerSchema, criterionNameSchema } from "@/lib/validation/influencer";
import { isValidRatingScore } from "@/lib/influencers";
import { slugify } from "@/lib/blog/blog";

export interface InfluencerFormState {
  error?: string;
  fieldErrors?: Record<string, string>;
}

function parseForm(formData: FormData) {
  return influencerSchema.safeParse({
    name: formData.get("name"),
    slug: formData.get("slug"),
    photoUrl: formData.get("photoUrl"),
    bio: formData.get("bio"),
    category: formData.get("category"),
    instagramUrl: formData.get("instagramUrl"),
    youtubeUrl: formData.get("youtubeUrl"),
    websiteUrl: formData.get("websiteUrl"),
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
