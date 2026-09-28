import { propertyImageSchema } from "@/lib/validation/propertyImage";

/** Listings whose photos/data must never be touched by a bulk import. */
export const PHOTO_IMPORT_PROTECTED_SLUGS = ["aangan-resort", "aangan-palace"] as const;

export interface PhotoCsvRow {
  line: number;
  slug: string;
  url: string;
  altText: string;
  caption: string;
}

export interface PhotoImportPlan {
  toAdd: { propertyId: string; slug: string; url: string; altText: string | null; caption: string | null; sortOrder: number }[];
  skipped: { line: number; slug: string; reason: string }[];
}

/** Minimal RFC-4180-style CSV parser (quoted fields, escaped quotes, CRLF). */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"' && text[i + 1] === '"') {
        field += '"';
        i++;
      } else if (ch === '"') inQuotes = false;
      else field += ch;
    } else if (ch === '"') inQuotes = true;
    else if (ch === ",") {
      row.push(field);
      field = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      row.push(field);
      field = "";
      if (row.some((c) => c.trim() !== "")) rows.push(row);
      row = [];
    } else field += ch;
  }
  row.push(field);
  if (row.some((c) => c.trim() !== "")) rows.push(row);
  return rows;
}

/** Header row required: slug,url and optionally altText,caption (any order). */
export function parsePhotoCsv(text: string): { rows: PhotoCsvRow[]; error?: string } {
  const table = parseCsv(text.replace(/^﻿/, ""));
  if (table.length === 0) return { rows: [], error: "CSV is empty." };
  const header = table[0].map((h) => h.trim().toLowerCase());
  const col = (name: string) => header.indexOf(name.toLowerCase());
  const [iSlug, iUrl, iAlt, iCap] = [col("slug"), col("url"), col("alttext"), col("caption")];
  if (iSlug < 0 || iUrl < 0) return { rows: [], error: 'CSV header must include "slug" and "url" columns.' };
  const rows = table.slice(1).map((r, idx) => ({
    line: idx + 2,
    slug: (r[iSlug] ?? "").trim(),
    url: (r[iUrl] ?? "").trim(),
    altText: iAlt >= 0 ? (r[iAlt] ?? "").trim() : "",
    caption: iCap >= 0 ? (r[iCap] ?? "").trim() : "",
  }));
  return { rows };
}

/**
 * Pure planning step: decides which rows would be added and why the rest are
 * skipped. Never adds to a protected listing, an unknown slug, an invalid or
 * non-https URL, or an image the listing already has. New images append after
 * the listing's existing ones (and after earlier rows for the same listing).
 */
export function planPhotoImport(
  rows: PhotoCsvRow[],
  properties: { id: string; slug: string; imageCount: number; existingUrls: string[] }[]
): PhotoImportPlan {
  const bySlug = new Map(properties.map((p) => [p.slug, p]));
  const protectedSlugs = new Set<string>(PHOTO_IMPORT_PROTECTED_SLUGS);
  const seen = new Map<string, Set<string>>();
  const added = new Map<string, number>();
  const plan: PhotoImportPlan = { toAdd: [], skipped: [] };

  for (const r of rows) {
    const skip = (reason: string) => plan.skipped.push({ line: r.line, slug: r.slug, reason });
    if (protectedSlugs.has(r.slug)) {
      skip("protected listing");
      continue;
    }
    const prop = bySlug.get(r.slug);
    if (!prop) {
      skip("unknown slug");
      continue;
    }
    const parsed = propertyImageSchema.safeParse({ url: r.url, altText: r.altText, caption: r.caption, kind: "PHOTO" });
    if (!parsed.success) {
      skip(`invalid url: ${parsed.error.issues[0]?.message ?? "invalid"}`);
      continue;
    }
    if (!parsed.data.url.startsWith("https://")) {
      skip("url must be https");
      continue;
    }
    const urls = seen.get(prop.id) ?? new Set(prop.existingUrls);
    seen.set(prop.id, urls);
    if (urls.has(parsed.data.url)) {
      skip("duplicate image");
      continue;
    }
    urls.add(parsed.data.url);
    const n = added.get(prop.id) ?? 0;
    added.set(prop.id, n + 1);
    plan.toAdd.push({
      propertyId: prop.id,
      slug: prop.slug,
      url: parsed.data.url,
      altText: parsed.data.altText ?? null,
      caption: parsed.data.caption ?? null,
      sortOrder: prop.imageCount + n,
    });
  }
  return plan;
}
