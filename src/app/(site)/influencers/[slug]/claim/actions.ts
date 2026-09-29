"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { influencerClaimSubmissionSchema, buildInfluencerClaimCreateData } from "@/lib/validation/influencerClaim";

export interface InfluencerClaimFormState {
  error?: string;
  fieldErrors?: Record<string, string>;
}

function fieldErrorsFrom(issues: { path: PropertyKey[]; message: string }[]) {
  const fieldErrors: Record<string, string> = {};
  for (const issue of issues) {
    const key = issue.path.map(String).join(".");
    if (!fieldErrors[key]) fieldErrors[key] = issue.message;
  }
  return fieldErrors;
}

/**
 * Public — anyone can submit, no login required. Only ever creates a
 * PENDING InfluencerClaimRequest; never touches Influencer fields, never
 * grants access. An admin must explicitly approve it.
 */
export async function submitInfluencerClaim(
  influencerSlug: string,
  _prevState: InfluencerClaimFormState,
  formData: FormData
): Promise<InfluencerClaimFormState> {
  const influencer = await prisma.influencer.findUnique({
    where: { slug: influencerSlug },
    select: { id: true, status: true, claimed: true },
  });
  if (!influencer || influencer.status !== "PUBLISHED") {
    return { error: "This profile isn't available to claim right now." };
  }
  if (influencer.claimed) {
    return { error: "This profile has already been claimed. Contact us if you believe this is a mistake." };
  }

  const parsed = influencerClaimSubmissionSchema.safeParse({
    claimantName: formData.get("claimantName"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    message: formData.get("message"),
  });
  if (!parsed.success) {
    return { error: "Please fix the errors below.", fieldErrors: fieldErrorsFrom(parsed.error.issues) };
  }

  const duplicate = await prisma.influencerClaimRequest.findFirst({
    where: { influencerId: influencer.id, email: parsed.data.email, status: "PENDING" },
    select: { id: true },
  });
  if (duplicate) {
    return { error: "A claim from this email is already pending review for this profile." };
  }

  await prisma.influencerClaimRequest.create({
    data: { influencerId: influencer.id, ...buildInfluencerClaimCreateData(parsed.data) },
  });

  redirect(`/influencers/${influencerSlug}?claimed=1`);
}
