"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { influencerEnquirySchema, buildInfluencerEnquiryCreateData } from "@/lib/validation/influencerEnquiry";

export interface InfluencerEnquiryFormState {
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
 * Public "Contact this creator" form — anyone can submit, no login
 * required. propertyId-equivalent (influencerId) is resolved server-side
 * from the URL's slug, never trusted from the form.
 */
export async function submitInfluencerEnquiry(
  influencerSlug: string,
  _prevState: InfluencerEnquiryFormState,
  formData: FormData
): Promise<InfluencerEnquiryFormState> {
  const influencer = await prisma.influencer.findFirst({
    where: { slug: influencerSlug, status: "PUBLISHED" },
    select: { id: true },
  });
  if (!influencer) return { error: "This profile isn't available right now." };

  const parsed = influencerEnquirySchema.safeParse({
    name: formData.get("name"),
    phone: formData.get("phone"),
    email: formData.get("email"),
    message: formData.get("message"),
    honeypot: formData.get("hp_field"),
  });
  if (!parsed.success) {
    return { error: "Please fix the errors below.", fieldErrors: fieldErrorsFrom(parsed.error.issues) };
  }

  if (parsed.data.honeypot) {
    redirect(`/influencers/${influencerSlug}?contacted=1`);
  }

  await prisma.influencerEnquiry.create({ data: buildInfluencerEnquiryCreateData(parsed.data, influencer.id) });

  redirect(`/influencers/${influencerSlug}?contacted=1`);
}
