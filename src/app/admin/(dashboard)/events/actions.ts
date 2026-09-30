"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/session";
import { adminEventSchema } from "@/lib/validation/event";

export interface EventFormState {
  error?: string;
  fieldErrors?: Record<string, string>;
}

function parseForm(formData: FormData) {
  return adminEventSchema.safeParse({
    title: formData.get("title"),
    slug: formData.get("slug"),
    description: formData.get("description"),
    coverImageUrl: formData.get("coverImageUrl"),
    coverImageAlt: formData.get("coverImageAlt"),
    venueName: formData.get("venueName"),
    address: formData.get("address"),
    localityId: formData.get("localityId"),
    propertyId: formData.get("propertyId"),
    startAt: formData.get("startAt"),
    endAt: formData.get("endAt"),
    ticketUrl: formData.get("ticketUrl"),
    contactPhone: formData.get("contactPhone"),
    contactEmail: formData.get("contactEmail"),
    sponsored: formData.get("sponsored"),
    priority: formData.get("priority"),
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

function revalidateEvents(slug?: string) {
  revalidatePath("/admin/events");
  revalidatePath("/events");
  revalidatePath("/");
  if (slug) revalidatePath(`/events/${slug}`);
}

function buildData(parsed: ReturnType<typeof adminEventSchema.parse>) {
  return {
    title: parsed.title,
    slug: parsed.slug,
    description: parsed.description,
    coverImageUrl: parsed.coverImageUrl,
    coverImageAlt: parsed.coverImageAlt,
    venueName: parsed.venueName,
    address: parsed.address,
    localityId: parsed.localityId,
    propertyId: parsed.propertyId,
    startAt: parsed.startAt,
    endAt: parsed.endAt,
    ticketUrl: parsed.ticketUrl,
    contactPhone: parsed.contactPhone,
    contactEmail: parsed.contactEmail,
    sponsored: parsed.sponsored,
    priority: parsed.priority,
    status: parsed.status,
  };
}

export async function createEvent(_prevState: EventFormState, formData: FormData): Promise<EventFormState> {
  const admin = await requireAdmin();
  const parsed = parseForm(formData);
  if (!parsed.success) return { error: "Please fix the errors below.", fieldErrors: fieldErrorsFrom(parsed.error.issues) };

  const existing = await prisma.event.findUnique({ where: { slug: parsed.data.slug } });
  if (existing) return { error: "Please fix the errors below.", fieldErrors: { slug: "This slug is already in use." } };

  const created = await prisma.event.create({
    data: { ...buildData(parsed.data), reviewedById: admin.id, reviewedAt: new Date() },
  });

  revalidateEvents(created.slug);
  redirect(`/admin/events/${created.id}?saved=1`);
}

export async function updateEvent(eventId: string, _prevState: EventFormState, formData: FormData): Promise<EventFormState> {
  const admin = await requireAdmin();
  const parsed = parseForm(formData);
  if (!parsed.success) return { error: "Please fix the errors below.", fieldErrors: fieldErrorsFrom(parsed.error.issues) };

  const current = await prisma.event.findUnique({ where: { id: eventId }, select: { slug: true, status: true } });
  if (!current) return { error: "Event not found." };

  const slugOwner = await prisma.event.findUnique({ where: { slug: parsed.data.slug } });
  if (slugOwner && slugOwner.id !== eventId) return { error: "Please fix the errors below.", fieldErrors: { slug: "This slug is already in use." } };

  const wasPending = current.status === "PENDING";
  await prisma.event.update({
    where: { id: eventId },
    data: {
      ...buildData(parsed.data),
      ...(wasPending && parsed.data.status !== "PENDING" ? { reviewedById: admin.id, reviewedAt: new Date() } : {}),
    },
  });

  revalidateEvents(current.slug);
  revalidateEvents(parsed.data.slug);
  redirect(`/admin/events/${eventId}?saved=1`);
}

/**
 * Quick actions from the list — approve/reject a pending application without
 * opening the full editor. The event's slug was already made unique when it
 * was created (see uniqueEventSlug in the public application action), so
 * approving never touches it.
 */
export async function approveEvent(eventId: string): Promise<void> {
  const admin = await requireAdmin();
  const updated = await prisma.event.updateMany({
    where: { id: eventId, status: "PENDING" },
    data: { status: "PUBLISHED", reviewedById: admin.id, reviewedAt: new Date() },
  });
  if (updated.count === 0) return;
  const event = await prisma.event.findUnique({ where: { id: eventId }, select: { slug: true } });
  if (event) revalidateEvents(event.slug);
}

export async function rejectEvent(eventId: string, formData: FormData): Promise<void> {
  const admin = await requireAdmin();
  const reason = String(formData.get("rejectionReason") ?? "").trim() || null;
  await prisma.event.update({
    where: { id: eventId },
    data: { status: "REJECTED", rejectionReason: reason, reviewedById: admin.id, reviewedAt: new Date() },
  });
  revalidateEvents();
}

export async function deleteEvent(eventId: string): Promise<void> {
  await requireAdmin();
  const existing = await prisma.event.findUnique({ where: { id: eventId }, select: { slug: true } });
  if (!existing) return;
  await prisma.event.delete({ where: { id: eventId } });
  revalidateEvents(existing.slug);
}

export interface UpdateBadgesState {
  error?: string;
}

/** Replaces an event's full set of EventBadge links with the submitted selection. Admin only. */
export async function updateEventBadges(eventId: string, _prevState: UpdateBadgesState, formData: FormData): Promise<UpdateBadgesState> {
  await requireAdmin();

  const event = await prisma.event.findUnique({ where: { id: eventId }, select: { slug: true } });
  if (!event) {
    return { error: "Event not found." };
  }

  const submittedIds = [...new Set(formData.getAll("badgeIds").map(String))];
  const validBadges = await prisma.trustBadge.findMany({ where: { id: { in: submittedIds } }, select: { id: true } });
  const validIds = validBadges.map((b) => b.id);

  await prisma.$transaction([
    prisma.eventBadge.deleteMany({ where: { eventId } }),
    prisma.eventBadge.createMany({ data: validIds.map((badgeId) => ({ eventId, badgeId })), skipDuplicates: true }),
  ]);

  revalidateEvents(event.slug);
  redirect(`/admin/events/${eventId}?saved=1`);
}
