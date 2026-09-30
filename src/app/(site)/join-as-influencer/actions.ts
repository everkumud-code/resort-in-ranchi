"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import {
  influencerSubmissionSchema,
  buildInfluencerSubmissionCreateData,
  findObviousInfluencerDuplicate,
} from "@/lib/validation/influencerSubmission";

export interface InfluencerSubmissionFormState {
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
 * PENDING InfluencerSubmission row; never creates or modifies an
 * Influencer.
 */
export async function submitInfluencerSubmission(
  _prevState: InfluencerSubmissionFormState,
  formData: FormData
): Promise<InfluencerSubmissionFormState> {
  const parsed = influencerSubmissionSchema.safeParse({
    name: formData.get("name"),
    category: formData.get("category"),
    bio: formData.get("bio"),
    instagramUrl: formData.get("instagramUrl"),
    youtubeUrl: formData.get("youtubeUrl"),
    websiteUrl: formData.get("websiteUrl"),
    photoUrl: formData.get("photoUrl"),
    contactName: formData.get("contactName"),
    contactEmail: formData.get("contactEmail"),
    contactPhone: formData.get("contactPhone"),
    // Honeypot: a real visitor never sees or fills this (see JoinAsInfluencerForm.tsx).
    honeypot: formData.get("hp_field"),
  });
  if (!parsed.success) {
    return { error: "Please fix the errors below.", fieldErrors: fieldErrorsFrom(parsed.error.issues) };
  }

  if (parsed.data.honeypot) {
    // Silently pretend success — never tip off a bot about what tripped it.
    redirect("/join-as-influencer?submitted=1");
  }

  // "Obvious duplicate" only — a bounded, cheap name-prefix query, never a
  // full-table scan and never any external/manual verification. A match
  // never blocks the submission; it's flagged for the admin to judge.
  const firstWord = parsed.data.name.trim().split(/\s+/)[0];
  const candidates = firstWord
    ? await prisma.influencer.findMany({
        where: { name: { contains: firstWord, mode: "insensitive" } },
        select: { id: true, name: true },
        take: 20,
      })
    : [];
  const duplicate = findObviousInfluencerDuplicate({ name: parsed.data.name }, candidates);

  await prisma.influencerSubmission.create({
    data: buildInfluencerSubmissionCreateData(parsed.data, { duplicateOfInfluencerId: duplicate?.id ?? null }),
  });

  redirect("/join-as-influencer?submitted=1");
}
