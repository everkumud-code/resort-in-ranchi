import { z } from "zod";
import { optionalEmail, optionalHttpUrl, optionalText, requiredPhone, requiredText, slugField } from "./shared";

export const EVENT_STATUS_VALUES = ["PENDING", "PUBLISHED", "REJECTED"] as const;
export type EventStatusValue = (typeof EVENT_STATUS_VALUES)[number];

export const EVENT_STATUS_LABELS: Record<EventStatusValue, string> = {
  PENDING: "Pending review",
  PUBLISHED: "Published",
  REJECTED: "Rejected",
};

/**
 * Every event on this site happens in and around Ranchi, so a `datetime-local`
 * value ("YYYY-MM-DDTHH:mm", no timezone of its own) is always the intended
 * IST wall-clock time — never the server's own timezone, which on a host
 * like Render is UTC and would otherwise silently shift every event by 5.5
 * hours. Appending the fixed +05:30 offset before parsing makes the stored
 * instant correct regardless of where this code runs. A value that already
 * carries an offset/Z (e.g. from a non-form caller) is left as-is.
 */
const IST_OFFSET = "+05:30";
function parseIstDateTimeLocal(value: string): Date {
  const hasOffset = /Z$|[+-]\d{2}:?\d{2}$/.test(value);
  return new Date(hasOffset ? value : `${value}${IST_OFFSET}`);
}

/** A FormData datetime-local field ("YYYY-MM-DDTHH:mm"): "" -> null, otherwise a valid Date (interpreted as IST — see parseIstDateTimeLocal). */
const optionalDateTime = z.preprocess((v) => {
  if (typeof v !== "string" || v.trim() === "") return null;
  const parsed = parseIstDateTimeLocal(v);
  return Number.isNaN(parsed.getTime()) ? new Date(NaN) : parsed;
}, z.date().nullable().refine((v) => v === null || !Number.isNaN(v.getTime()), "Must be a valid date/time"));

const requiredDateTime = z.preprocess((v) => {
  if (typeof v !== "string" || v.trim() === "") return new Date(NaN);
  return parseIstDateTimeLocal(v);
}, z.date().refine((v) => !Number.isNaN(v.getTime()), "Please choose a valid date and time"));

/** Shared by the admin editor and the public "Create your event" form — the fields either can set. */
export const eventCoreSchema = z
  .object({
    title: requiredText("Title").pipe(z.string().max(200, "Title must be 200 characters or fewer")),
    description: optionalText,
    coverImageUrl: optionalHttpUrl,
    coverImageAlt: optionalText,
    venueName: optionalText,
    address: optionalText,
    localityId: optionalText,
    startAt: requiredDateTime,
    endAt: optionalDateTime,
    ticketUrl: optionalHttpUrl,
    contactPhone: optionalText,
    contactEmail: optionalEmail,
  })
  .refine((v) => v.endAt === null || v.endAt.getTime() >= v.startAt.getTime(), {
    message: "End must be after the start.",
    path: ["endAt"],
  });

export type EventCoreInput = z.infer<typeof eventCoreSchema>;

/** The admin editor adds slug, sponsorship and status controls. */
export const adminEventSchema = eventCoreSchema.and(
  z.object({
    slug: slugField,
    propertyId: optionalText,
    sponsored: z.preprocess((v) => v === "on" || v === "true" || v === true, z.boolean()),
    priority: z.preprocess((v) => {
      if (typeof v !== "string" || v.trim() === "") return 0;
      const n = Number(v);
      return Number.isFinite(n) ? Math.trunc(n) : NaN;
    }, z.number().int()),
    status: z.preprocess((v) => (EVENT_STATUS_VALUES.includes(v as EventStatusValue) ? v : "PENDING"), z.enum(EVENT_STATUS_VALUES)),
  })
);

/** The public application form adds only who is applying — never status/sponsorship/slug. */
export const eventApplicationSchema = eventCoreSchema.and(
  z.object({
    submittedByName: requiredText("Your name"),
    submittedByEmail: optionalEmail,
    submittedByPhone: requiredPhone,
    honeypot: optionalText,
  })
);

export type EventApplicationInput = z.infer<typeof eventApplicationSchema>;
