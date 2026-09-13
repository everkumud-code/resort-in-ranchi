"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { claimSubmissionSchema, buildClaimCreateData } from "@/lib/validation/claim";
import { trackEvent } from "@/lib/analytics";

export interface ClaimFormState {
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
 * Public — deliberately no requireAdmin() here, anyone can submit a claim.
 * Only ever creates a PENDING ClaimRequest; never touches Property fields,
 * never grants access. An admin must explicitly approve it (see the admin
 * claims review actions) before it means anything.
 */
export async function submitPropertyClaim(
  propertySlug: string,
  _prevState: ClaimFormState,
  formData: FormData
): Promise<ClaimFormState> {
  const property = await prisma.property.findUnique({
    where: { slug: propertySlug },
    select: { id: true, status: true, claimed: true },
  });
  if (!property || property.status !== "PUBLISHED") {
    return { error: "This listing isn't available to claim right now." };
  }
  if (property.claimed) {
    return { error: "This listing has already been claimed. Contact us if you believe this is a mistake." };
  }

  const parsed = claimSubmissionSchema.safeParse({
    ownerName: formData.get("ownerName"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    businessRole: formData.get("businessRole"),
    message: formData.get("message"),
  });
  if (!parsed.success) {
    return { error: "Please fix the errors below.", fieldErrors: fieldErrorsFrom(parsed.error.issues) };
  }

  const duplicate = await prisma.claimRequest.findFirst({
    where: { propertyId: property.id, email: parsed.data.email, status: "PENDING" },
    select: { id: true },
  });
  if (duplicate) {
    return { error: "A claim from this email is already pending review for this listing." };
  }

  await prisma.claimRequest.create({
    data: { propertyId: property.id, ...buildClaimCreateData(parsed.data) },
  });
  await trackEvent({ type: "CLAIM_SUBMIT", propertyId: property.id, path: `/property/${propertySlug}/claim` });

  redirect(`/property/${propertySlug}?claimed=1`);
}
