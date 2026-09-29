/**
 * Imports the "Ranchi Hospitality Master Directory" (Google Places-sourced,
 * per its own Summary sheet footnote) — 550 establishments across hotels,
 * resorts, restaurants, banquet halls and more, in and around Ranchi.
 *
 * Every imported row lands as DRAFT / DISCOVERED (never auto-published) —
 * the same review gate every other bulk import in this codebase uses (see
 * scripts/bulk-publish-dry-run.ts). An admin reviews and publishes from
 * /admin/properties or the bulk-publish tooling, same as always.
 *
 * The sheet's "Photos" columns are Google Maps/Images SEARCH links, not
 * photo files — only the Maps one is imported, into the existing
 * `googleMapsUrl` field (same as a "View on Google Maps" button elsewhere).
 * No image is fetched, hot-linked or stored — this import adds no photos at
 * all, consistent with the site's no-fabricated-photos rule.
 *
 * Rows whose category has no reasonable match in the existing taxonomy, or
 * whose establishment name already exists in the database, are skipped and
 * listed — never force-mapped or silently duplicated.
 *
 * Default is a DRY RUN that writes nothing.
 * Usage:
 *   npx tsx scripts/import-properties-xlsx.ts "C:\path\to\file.xlsx"
 *   npx tsx scripts/import-properties-xlsx.ts "C:\path\to\file.xlsx" --commit
 */
import * as XLSX from "xlsx";
import { slugify } from "../src/lib/blog/blog";

interface SheetRow {
  "S.No.": number;
  "Establishment Name": string;
  Category: string;
  "Exact Area / Sub-locality": string;
  "District / City": string;
  "Verified Contact Number": string;
  "Verified Email / Website Link": string;
  Notes: string;
  "Description (max 300 chars)": string;
  "Photos - Google Maps": string;
}

/** Sheet category -> existing Category.slug. No entry = not imported (flagged, never force-mapped). */
const CATEGORY_MAP: Record<string, string> = {
  Hotel: "hotels",
  "Guest House": "hotels",
  Resort: "resorts",
  "Farmstay & Eco-Retreat": "homestays-farm-stays",
  Restaurant: "restaurants",
  Dhaba: "restaurants",
  "Banquet Hall & Wedding Lawn": "banquet-halls",
  "Bar, Pub & Lounge": "lounge-bar",
};

function cleanUrl(value: string): string | null {
  const trimmed = value?.trim();
  return trimmed && /^https?:\/\//i.test(trimmed) ? trimmed : null;
}

function cleanPhone(value: string): string | null {
  const trimmed = (value ?? "").trim();
  return trimmed && trimmed.toUpperCase() !== "N/A" ? trimmed : null;
}

/** "Verified Email / Website Link" holds either, or "N/A" — split by shape, never guess. */
function splitEmailOrWebsite(value: string): { email: string | null; website: string | null } {
  const trimmed = (value ?? "").trim();
  if (!trimmed || trimmed.toUpperCase() === "N/A") return { email: null, website: null };
  if (trimmed.includes("@") && !/^https?:\/\//i.test(trimmed)) return { email: trimmed, website: null };
  return { email: null, website: /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}` };
}

async function main() {
  const filePath = process.argv[2];
  const commit = process.argv.includes("--commit");
  if (!filePath) throw new Error("Usage: tsx scripts/import-properties-xlsx.ts <path-to-xlsx> [--commit]");

  const workbook = XLSX.readFile(filePath);
  const rows = XLSX.utils.sheet_to_json<SheetRow>(workbook.Sheets["Directory"], { defval: "" });

  const { PrismaClient } = await import("@prisma/client");
  const prisma = new PrismaClient();

  try {
    const categories = await prisma.category.findMany({ select: { id: true, slug: true } });
    const categoryIdBySlug = new Map(categories.map((c) => [c.slug, c.id]));
    const locations = await prisma.location.findMany({ select: { id: true, name: true } });
    const existingNames = new Set(
      (await prisma.property.findMany({ select: { name: true } })).map((p) => p.name.trim().toLowerCase())
    );

    console.log(`=== IMPORT PROPERTIES FROM XLSX ${commit ? "COMMIT" : "DRY RUN — no database changes"} ===`);
    console.log(`${rows.length} rows in sheet.\n`);

    const skippedByReason: Record<string, number> = {};
    const usedSlugs = new Set<string>();
    let added = 0;
    const sample: string[] = [];

    for (const row of rows) {
      const name = (row["Establishment Name"] ?? "").trim();
      const skip = (reason: string) => {
        skippedByReason[reason] = (skippedByReason[reason] ?? 0) + 1;
      };

      if (!name) {
        skip("missing name");
        continue;
      }
      if (existingNames.has(name.toLowerCase())) {
        skip("already in database (by name)");
        continue;
      }
      const categorySlug = CATEGORY_MAP[row.Category?.trim()];
      if (!categorySlug || !categoryIdBySlug.has(categorySlug)) {
        skip(`no category mapping for "${row.Category}"`);
        continue;
      }

      const areaText = (row["Exact Area / Sub-locality"] ?? "").trim();
      const districtRaw = (row["District / City"] ?? "").trim();
      const inRanchi = /ranchi/i.test(districtRaw);
      const city = inRanchi ? "Ranchi" : districtRaw.replace(/\s*\(.*\)\s*/g, "").trim() || districtRaw;
      const state = /\(WB\)/i.test(districtRaw) ? "West Bengal" : "Jharkhand";
      const matchedLocation = inRanchi ? locations.find((l) => areaText.toLowerCase().includes(l.name.toLowerCase())) : undefined;

      const { email, website } = splitEmailOrWebsite(row["Verified Email / Website Link"]);
      const sourceRecordId = `MHD-${row["S.No."]}`;

      const baseSlug = slugify(name);
      let slug = baseSlug;
      let n = 2;
      while (usedSlugs.has(slug) || (await prisma.property.findUnique({ where: { slug }, select: { id: true } }))) {
        slug = `${baseSlug}-${n++}`;
      }
      usedSlugs.add(slug);
      added++;
      if (sample.length < 15) sample.push(`  add   ${name}  (${row.Category} → ${categorySlug})  ${city}${matchedLocation ? ` / ${matchedLocation.name}` : ""}`);

      if (commit) {
        await prisma.property.create({
          data: {
            name,
            slug,
            categoryId: categoryIdBySlug.get(categorySlug)!,
            rawCategory: row.Category || null,
            localityId: matchedLocation?.id,
            rawLocality: areaText || null,
            city,
            state,
            phone: cleanPhone(row["Verified Contact Number"]),
            email,
            website,
            googleMapsUrl: cleanUrl(row["Photos - Google Maps"]),
            shortDescription: row["Description (max 300 chars)"]?.trim() || null,
            sourceRecordId,
            source: "Google Business Profile listings via Google Places",
            sourceLastCheckedAt: new Date("2026-09-29"),
            status: "DRAFT",
            verificationStatus: "DISCOVERED",
          },
        });
      }
    }

    console.log("Sample of rows to add:");
    console.log(sample.join("\n"));
    console.log(`\n${added} to add.`);
    console.log("Skipped:");
    for (const [reason, count] of Object.entries(skippedByReason)) console.log(`  ${count}  ${reason}`);
    if (!commit) console.log("\nRe-run with --commit to write these rows. New rows land as DRAFT/DISCOVERED — nothing goes live until an admin reviews and publishes.");
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
