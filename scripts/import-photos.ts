/**
 * Bulk-add listing photos from a CSV (columns: slug,url[,altText,caption]).
 * Every URL must point to a photo the business owner has given written
 * permission to publish. Default is a DRY RUN that writes nothing.
 *
 * Usage:
 *   npx tsx scripts/import-photos.ts photos.csv
 *   npx tsx scripts/import-photos.ts photos.csv --commit --confirm-permission
 */
import { readFileSync } from "node:fs";
import { parsePhotoCsv, planPhotoImport } from "../src/lib/import/photoImport";

async function checkImageUrl(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, { method: "HEAD", redirect: "follow", signal: AbortSignal.timeout(15000) });
    if (!res.ok) return `HTTP ${res.status}`;
    const type = res.headers.get("content-type") ?? "";
    return type.startsWith("image/") ? null : `not an image (${type || "no content-type"})`;
  } catch (e) {
    return `unreachable (${(e as Error).message})`;
  }
}

async function main() {
  const [file, ...flags] = process.argv.slice(2);
  if (!file) throw new Error("Usage: tsx scripts/import-photos.ts <photos.csv> [--commit --confirm-permission]");
  const commit = flags.includes("--commit");
  if (commit && !flags.includes("--confirm-permission")) {
    throw new Error("--commit requires --confirm-permission (written owner permission for every photo).");
  }

  const { rows, error } = parsePhotoCsv(readFileSync(file, "utf8"));
  if (error) throw new Error(error);

  const { PrismaClient } = await import("@prisma/client");
  const prisma = new PrismaClient();
  try {
    const slugs = [...new Set(rows.map((r) => r.slug))];
    const found = await prisma.property.findMany({
      where: { slug: { in: slugs } },
      select: { id: true, slug: true, images: { select: { url: true } } },
    });
    const plan = planPhotoImport(
      rows,
      found.map((p) => ({ id: p.id, slug: p.slug, imageCount: p.images.length, existingUrls: p.images.map((i) => i.url) }))
    );

    const usable: typeof plan.toAdd = [];
    for (const item of plan.toAdd) {
      const problem = await checkImageUrl(item.url);
      if (problem) plan.skipped.push({ line: 0, slug: item.slug, reason: `${item.url} — ${problem}` });
      else usable.push(item);
    }

    console.log(`=== PHOTO IMPORT ${commit ? "COMMIT" : "DRY RUN — no database changes"} ===`);
    console.log(`Rows: ${rows.length}  to add: ${usable.length}  skipped: ${plan.skipped.length}`);
    for (const s of plan.skipped) console.log(`  skip  line ${s.line}  ${s.slug}: ${s.reason}`);
    for (const a of usable) console.log(`  add   ${a.slug}  #${a.sortOrder}  ${a.url}`);

    if (commit && usable.length > 0) {
      const result = await prisma.propertyImage.createMany({
        data: usable.map((a) => ({
          propertyId: a.propertyId,
          url: a.url,
          altText: a.altText,
          caption: a.caption,
          sortOrder: a.sortOrder,
          kind: "PHOTO" as const,
        })),
      });
      console.log(`\nInserted ${result.count} photo rows.`);
    }
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e.message ?? e);
  process.exit(1);
});
