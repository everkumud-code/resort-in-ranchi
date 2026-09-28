import { z } from "zod";

/** A FormData text field: trims, treats "" as absent -> null. */
export const optionalText = z.preprocess((v) => {
  if (typeof v !== "string") return null;
  const trimmed = v.trim();
  return trimmed === "" ? null : trimmed;
}, z.string().nullable());

/** A FormData text field that must be present and non-empty. */
export const requiredText = (label: string) =>
  z.preprocess((v) => (typeof v === "string" ? v.trim() : v), z.string().min(1, `${label} is required`));

/** A FormData URL field: "" -> null, otherwise must be a valid http(s) URL. */
export const optionalHttpUrl = z.preprocess(
  (v) => {
    if (typeof v !== "string") return null;
    const trimmed = v.trim();
    return trimmed === "" ? null : trimmed;
  },
  z
    .string()
    .url("Must be a valid URL (including https://)")
    .refine((u) => /^https?:\/\//i.test(u), "Must start with http:// or https://")
    .nullable()
);

/** A FormData email field that must be present and a plausible email address. */
export const requiredEmail = z.preprocess(
  (v) => (typeof v === "string" ? v.trim().toLowerCase() : v),
  z.string().min(1, "Email is required").email("Must be a valid email address")
);

/** A FormData email field: "" -> null, otherwise must be a plausible email address. */
export const optionalEmail = z.preprocess((v) => {
  if (typeof v !== "string") return null;
  const trimmed = v.trim().toLowerCase();
  return trimmed === "" ? null : trimmed;
}, z.string().email("Must be a valid email address").nullable());

/** A FormData phone field that must be present and look like a phone number (digits, spaces, +, -, parentheses). */
export const requiredPhone = z.preprocess(
  (v) => (typeof v === "string" ? v.trim() : v),
  z
    .string()
    .min(1, "Phone is required")
    .regex(/^[0-9+\-\s()]{7,20}$/, "Must be a valid phone number")
);

/** A FormData date field ("YYYY-MM-DD", from <input type="date">): "" -> null, otherwise a valid Date. */
export const optionalDate = z.preprocess((v) => {
  if (typeof v !== "string" || v.trim() === "") return null;
  const parsed = new Date(v);
  return Number.isNaN(parsed.getTime()) ? new Date(NaN) : parsed;
}, z.date().nullable().refine((v) => v === null || !Number.isNaN(v.getTime()), "Must be a valid date"));

/** A FormData numeric field: "" -> null, otherwise a finite integer. */
export const optionalInt = z.preprocess((v) => {
  if (typeof v !== "string" || v.trim() === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? Math.trunc(n) : NaN;
}, z.number().int().nullable().refine((v) => v === null || !Number.isNaN(v), "Must be a whole number"));

/** A FormData numeric field: "" -> null, otherwise a finite number. */
export const optionalFloat = z.preprocess((v) => {
  if (typeof v !== "string" || v.trim() === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : NaN;
}, z.number().nullable().refine((v) => v === null || !Number.isNaN(v), "Must be a number"));

/** A FormData checkbox: present ("on") -> true, absent -> false. */
export const checkbox = z.preprocess((v) => v === "on" || v === "true" || v === true, z.boolean());

export const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const slugField = z.preprocess(
  (v) => (typeof v === "string" ? v.trim() : v),
  z
    .string()
    .min(1, "Slug is required")
    .regex(SLUG_PATTERN, "Slug must be lowercase letters, numbers and hyphens only")
);
