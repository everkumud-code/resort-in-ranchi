/**
 * Imports real, sourced Ranchi-area creators from a compiled Excel sheet
 * (columns: Name, Instagram Handle, Niche, City / Area, Profile Link,
 * Contact Detail, Contact Type, Image URL (profile picture)). Only rows
 * whose City / Area mentions Ranchi are imported — this is a Ranchi
 * directory. Photo URLs are expected to be unavatar.io links (a stable
 * proxy), never Instagram's own expiring CDN links.
 *
 * Also removes the small placeholder demo set seeded earlier
 * (scripts/seed-events-influencers-demo.ts), which this richer, better-
 * sourced list supersedes.
 *
 * Photo URLs in the sheet are unavatar.io proxy links. unavatar.io's free
 * anonymous tier has a very low daily request quota (confirmed exhausted —
 * HTTP 429 "Daily anonymous rate limit reached" — with zero real site
 * traffic), so embedding it directly would show broken images sitewide most
 * of the time. Photos are deliberately left blank here — the site's normal
 * initials placeholder covers it honestly — until each creator claims their
 * profile and uploads their own real, reliably-hosted photo via /creator/edit.
 *
 * Default is a DRY RUN that writes nothing.
 * Usage:
 *   npx tsx scripts/import-influencers-xlsx.ts "C:\path\to\file.xlsx"
 *   npx tsx scripts/import-influencers-xlsx.ts "C:\path\to\file.xlsx" --commit
 */
import * as XLSX from "xlsx";
import { slugify } from "../src/lib/blog/blog";

const DEMO_SLUGS_TO_REMOVE = ["lifestyle-ranchi", "dr-ammara-azmi", "rimjhim-mohanto", "khushboo", "jharkhand-lifestyle", "nikhil-nigam"];

interface SheetRow {
  Name: string;
  "Instagram Handle": string;
  Niche: string;
  "City / Area": string;
  "Profile Link": string;
  "Contact Detail": string;
  "Contact Type": string;
  "Image URL (profile picture)": string;
}

function cleanUrl(value: string): string | null {
  const trimmed = value?.trim();
  return trimmed && /^https?:\/\//i.test(trimmed) ? trimmed : null;
}

async function main() {
  const filePath = process.argv[2];
  const commit = process.argv.includes("--commit");
  if (!filePath) throw new Error("Usage: tsx scripts/import-influencers-xlsx.ts <path-to-xlsx> [--commit]");

  const workbook = XLSX.readFile(filePath);
  const rows = XLSX.utils.sheet_to_json<SheetRow>(workbook.Sheets["Influencers"], { defval: "" });

  const ranchiRows = rows.filter((r) => /ranchi/i.test(r["City / Area"] ?? ""));

  const { PrismaClient } = await import("@prisma/client");
  const prisma = new PrismaClient();

  try {
    console.log(`=== IMPORT INFLUENCERS FROM XLSX ${commit ? "COMMIT" : "DRY RUN — no database changes"} ===`);
    console.log(`${rows.length} rows in sheet, ${ranchiRows.length} mention Ranchi and will be considered.\n`);

    console.log("-- Removing earlier placeholder demo entries --");
    for (const slug of DEMO_SLUGS_TO_REMOVE) {
      const existing = await prisma.influencer.findUnique({ where: { slug }, select: { id: true, claimed: true } });
      if (!existing) continue;
      if (existing.claimed) {
        console.log(`  skip  ${slug} — already claimed by a real creator, leaving it alone`);
        continue;
      }
      console.log(`  remove ${slug}`);
      if (commit) await prisma.influencer.delete({ where: { id: existing.id } });
    }

    console.log("\n-- Importing Ranchi-area creators --");
    const usedSlugs = new Set<string>();
    let added = 0;
    let skipped = 0;

    for (const row of ranchiRows) {
      const handle = (row["Instagram Handle"] ?? "").replace(/^@/, "").trim();
      const baseSlug = slugify(handle || row.Name);
      let slug = baseSlug;
      let n = 2;
      while (usedSlugs.has(slug) || (await prisma.influencer.findUnique({ where: { slug }, select: { id: true } }))) {
        slug = `${baseSlug}-${n++}`;
      }

      const instagramUrl = cleanUrl(row["Profile Link"]);
      // Deliberately not imported — see the file-level doc comment on unavatar.io's rate limit.
      const photoUrl: string | null = null;
      const niche = (row.Niche ?? "").trim();
      const city = (row["City / Area"] ?? "").trim();
      const contactDetail = (row["Contact Detail"] ?? "").trim();

      if (!row.Name?.trim() || !instagramUrl) {
        console.log(`  skip  "${row.Name}" — missing name or a valid profile link`);
        skipped++;
        continue;
      }

      const bioParts = [
        niche ? `${niche} content creator` : "Content creator",
        city ? `based in ${city}.` : ".",
        contactDetail ? `Contact: ${contactDetail}.` : "",
        "Listed from public creator directories — contact us via /contact to update or claim this profile.",
      ].filter(Boolean);

      console.log(`  add   ${row.Name}  (${niche || "—"})  @${handle}`);
      usedSlugs.add(slug);
      added++;

      if (commit) {
        await prisma.influencer.create({
          data: {
            name: row.Name.trim(),
            slug,
            category: niche || null,
            instagramUrl,
            photoUrl,
            bio: bioParts.join(" "),
            status: "PUBLISHED",
          },
        });
      }
    }

    console.log(`\n${added} to add, ${skipped} skipped.`);
    if (!commit) console.log("Re-run with --commit to write these rows.");
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
