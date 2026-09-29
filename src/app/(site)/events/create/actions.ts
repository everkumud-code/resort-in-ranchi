"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { eventApplicationSchema } from "@/lib/validation/event";
import { slugify } from "@/lib/blog/blog";

export interface EventApplicationFormState {
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

/** Makes a unique event slug by appending -2, -3, ... only if the base is already taken. */
async function uniqueEventSlug(base: string): Promise<string> {
  const root = base || "event";
  let candidate = root;
  let n = 2;
  while (await prisma.event.findUnique({ where: { slug: candidate }, select: { id: true } })) {
    candidate = `${root}-${n++}`;
  }
  return candidate;
}

/**
 * Public — anyone can apply, no login required. Always creates a PENDING
 * row; never publishes directly. An admin reviews it under /admin/events.
 */
export async function submitEventApplication(
  _prevState: EventApplicationFormState,
  formData: FormData
): Promise<EventApplicationFormState> {
  const parsed = eventApplicationSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description"),
    coverImageUrl: formData.get("coverImageUrl"),
    coverImageAlt: formData.get("coverImageAlt"),
    venueName: formData.get("venueName"),
    address: formData.get("address"),
    localityId: formData.get("localityId"),
    startAt: formData.get("startAt"),
    endAt: formData.get("endAt"),
    ticketUrl: formData.get("ticketUrl"),
    contactPhone: formData.get("contactPhone"),
    contactEmail: formData.get("contactEmail"),
    submittedByName: formData.get("submittedByName"),
    submittedByEmail: formData.get("submittedByEmail"),
    submittedByPhone: formData.get("submittedByPhone"),
    // Honeypot: a real visitor never sees or fills this field.
    honeypot: formData.get("hp_field"),
  });
  if (!parsed.success) {
    return { error: "Please fix the errors below.", fieldErrors: fieldErrorsFrom(parsed.error.issues) };
  }

  if (parsed.data.honeypot) {
    redirect("/events/create?submitted=1");
  }

  if (parsed.data.localityId) {
    const locality = await prisma.location.findUnique({ where: { id: parsed.data.localityId }, select: { id: true } });
    if (!locality) {
      return { error: "Please choose a valid location.", fieldErrors: { localityId: "Please choose a location from the list." } };
    }
  }

  const slug = await uniqueEventSlug(slugify(parsed.data.title));

  await prisma.event.create({
    data: {
      title: parsed.data.title,
      slug,
      description: parsed.data.description,
      coverImageUrl: parsed.data.coverImageUrl,
      coverImageAlt: parsed.data.coverImageAlt,
      venueName: parsed.data.venueName,
      address: parsed.data.address,
      localityId: parsed.data.localityId,
      startAt: parsed.data.startAt,
      endAt: parsed.data.endAt,
      ticketUrl: parsed.data.ticketUrl,
      contactPhone: parsed.data.contactPhone,
      contactEmail: parsed.data.contactEmail,
      submittedByName: parsed.data.submittedByName,
      submittedByEmail: parsed.data.submittedByEmail,
      submittedByPhone: parsed.data.submittedByPhone,
      status: "PENDING",
    },
  });

  redirect("/events/create?submitted=1");
}
