import { prisma } from "@/lib/prisma";
import { classifyEvents, type EventSections } from "./events";

export const eventCardSelect = {
  id: true,
  title: true,
  slug: true,
  description: true,
  coverImageUrl: true,
  coverImageAlt: true,
  venueName: true,
  address: true,
  startAt: true,
  endAt: true,
  ticketUrl: true,
  sponsored: true,
  priority: true,
  locality: { select: { id: true, name: true, slug: true } },
  property: { select: { slug: true, name: true } },
} as const;

export type EventCard = Awaited<ReturnType<typeof listPublishedEvents>>[number];

/** Every currently-live (not yet finished) published event, for the homepage sections and /events. Never throws — an unmigrated table just yields no events. */
export async function listPublishedEvents(now: Date = new Date()): Promise<
  {
    id: string;
    title: string;
    slug: string;
    description: string | null;
    coverImageUrl: string | null;
    coverImageAlt: string | null;
    venueName: string | null;
    address: string | null;
    startAt: Date;
    endAt: Date | null;
    ticketUrl: string | null;
    sponsored: boolean;
    priority: number;
    locality: { id: string; name: string; slug: string } | null;
    property: { slug: string; name: string } | null;
  }[]
> {
  try {
    // endAt is null for most events, so "not yet over" can't be expressed as a single WHERE
    // clause — the small, bounded result set is filtered precisely in isEventPast/classifyEvents instead.
    return await prisma.event.findMany({
      where: { status: "PUBLISHED", startAt: { gte: new Date(now.getTime() - 24 * 60 * 60 * 1000) } },
      select: eventCardSelect,
      orderBy: { startAt: "asc" },
      take: 200,
    });
  } catch (error) {
    console.error("[events] read failed:", error instanceof Error ? error.message.split("\n").pop() : error);
    return [];
  }
}

export async function getHomepageEventSections(now: Date = new Date()): Promise<EventSections<Awaited<ReturnType<typeof listPublishedEvents>>[number]>> {
  const events = await listPublishedEvents(now);
  return classifyEvents(events, now);
}

export async function getPublishedEvent(slug: string) {
  try {
    return await prisma.event.findFirst({
      where: { slug, status: "PUBLISHED" },
      include: { locality: { select: { id: true, name: true, slug: true } }, property: { select: { slug: true, name: true } } },
    });
  } catch {
    return null;
  }
}
