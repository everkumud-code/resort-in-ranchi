"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { enquirySubmissionSchema, buildEnquiryCreateData, propertyEligibleForEnquiry } from "@/lib/validation/enquiry";
import { trackEvent } from "@/lib/analytics";
import { getEligiblePartnersForProperty } from "@/lib/leadPartner";

export interface EnquiryFormState {
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

// Debounces accidental double-submits (double-click, back-button resubmit)
// without needing any rate-limiting infrastructure — a second identical
// enquiry within this window is treated as the same one, not a new lead.
const DUPLICATE_WINDOW_MS = 2 * 60 * 1000;

/**
 * Public — no requireAdmin() here, any visitor can submit. propertyId is
 * NEVER read from the form; it's resolved server-side from the URL's slug,
 * so a request can never target an arbitrary/unpublished property. Only
 * ever creates an Enquiry row — never touches the Property record itself.
 */
export async function submitEnquiry(
  propertySlug: string,
  _prevState: EnquiryFormState,
  formData: FormData
): Promise<EnquiryFormState> {
  const property = await prisma.property.findUnique({
    where: { slug: propertySlug },
    select: { id: true, status: true, category: { select: { slug: true } }, locality: { select: { slug: true } } },
  });
  if (!property || !propertyEligibleForEnquiry(property)) {
    return { error: "This listing isn't available for enquiries right now." };
  }

  const parsed = enquirySubmissionSchema.safeParse({
    name: formData.get("name"),
    phone: formData.get("phone"),
    email: formData.get("email"),
    eventDate: formData.get("eventDate"),
    guests: formData.get("guests"),
    requirement: formData.get("requirement"),
    budget: formData.get("budget"),
    // Honeypot: a real visitor never sees or fills this field (see
    // EnquiryForm.tsx). A filled value means a bot submitted every field it
    // found — dropped silently below, never surfaced as an error, so a bot
    // gets no signal about what tripped it.
    honeypot: formData.get("hp_field"),
  });
  if (!parsed.success) {
    return { error: "Please fix the errors below.", fieldErrors: fieldErrorsFrom(parsed.error.issues) };
  }

  if (parsed.data.honeypot) {
    redirect(`/property/${propertySlug}?enquiry=sent`);
  }

  const recentDuplicate = await prisma.enquiry.findFirst({
    where: {
      propertyId: property.id,
      phone: parsed.data.phone,
      createdAt: { gt: new Date(Date.now() - DUPLICATE_WINDOW_MS) },
    },
    select: { id: true },
  });
  if (recentDuplicate) {
    redirect(`/property/${propertySlug}?enquiry=sent`);
  }

  const enquiry = await prisma.enquiry.create({
    data: buildEnquiryCreateData(parsed.data, {
      propertyId: property.id,
      sourcePage: `/property/${propertySlug}`,
    }),
  });
  // Only the real, successfully-created path counts as a submit — the
  // honeypot and duplicate-debounce paths above redirect to the same
  // "sent" URL for UX reasons but are never real submissions.
  await trackEvent({ type: "ENQUIRY_SUBMIT", propertyId: property.id, path: `/property/${propertySlug}/enquire` });

  // Referred, additional copies only — the Enquiry row created above is
  // never touched again after this point. Eligibility is the same live
  // check the enquire page uses to decide whether to show the sharing
  // disclosure, so a lead is only ever created here when that disclosure
  // was genuinely shown to the visitor beforehand.
  const eligiblePartners = await getEligiblePartnersForProperty({
    propertyId: property.id,
    categorySlug: property.category.slug,
    localitySlug: property.locality?.slug ?? null,
    guests: parsed.data.guests,
  });
  if (eligiblePartners.length > 0) {
    // skipDuplicates + the (partnerId, sourceEnquiryId) unique constraint
    // are the real guarantee here — a retried/duplicated call for this same
    // enquiry can never create a second PartnerLead for the same partner.
    await prisma.partnerLead.createMany({
      data: eligiblePartners.map(({ partner, reason }) => ({
        partnerId: partner.id,
        sourceEnquiryId: enquiry.id,
        eligibilityReason: reason,
      })),
      skipDuplicates: true,
    });
  }

  redirect(`/property/${propertySlug}?enquiry=sent`);
}
