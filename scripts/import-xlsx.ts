/**
 * Safe importer for the 400-record research spreadsheet.
 *
 * Usage:
 *   npm run import:dry-run            # validate + report only, no DB writes
 *   npm run import:commit             # write to the database
 *   npx tsx scripts/import-xlsx.ts --file path/to/other.xlsx --dry-run
 *
 * Dry-run is the default. --commit is required to write anything.
 */
import path from "node:path";
import fs from "node:fs";
import { readMasterWorkbook } from "../src/lib/import/readWorkbook";
import { buildImportPlan } from "../src/lib/import/transform";
import { buildReport, printReport } from "../src/lib/import/report";

function parseArgs(argv: string[]) {
  const commit = argv.includes("--commit");
  const fileFlagIndex = argv.indexOf("--file");
  const file =
    fileFlagIndex >= 0 && argv[fileFlagIndex + 1]
      ? argv[fileFlagIndex + 1]
      : "data/ResortInRanchi_400_Record_Master_Database.xlsx";
  return { commit, file: path.resolve(file) };
}

async function main() {
  const { commit, file } = parseArgs(process.argv.slice(2));

  if (!fs.existsSync(file)) {
    console.error(`File not found: ${file}`);
    process.exit(1);
  }

  console.log(`Reading workbook: ${file}`);
  const { rows, allSheetNames } = readMasterWorkbook(file);
  console.log(`Sheets found: ${allSheetNames.join(", ")}`);
  console.log(`Rows read from master sheet: ${rows.length}`);

  const plan = buildImportPlan(rows);
  const report = buildReport(plan, file, rows.length);
  printReport(report);

  const reportPath = path.resolve("data/import-report.json");
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), "utf8");
  console.log(`Full JSON report written to: ${reportPath}`);

  if (!commit) {
    console.log("\nDRY RUN — no database changes were made. Pass --commit to write to the database.");
    return;
  }

  console.log("\n--commit passed — writing to the database...");
  const { PrismaClient } = await import("@prisma/client");
  const prisma = new PrismaClient();

  try {
    await prisma.$transaction(async (tx) => {
      // Upsert parentless categories first, then children, so parentId can
      // always resolve to an already-created row.
      const categoryIdBySlug = new Map<string, string>();
      const allCategories = [...plan.categoriesUsed.values()];
      const topLevel = allCategories.filter((c) => !c.parentSlug);
      const withParent = allCategories.filter((c) => c.parentSlug);

      for (const cat of topLevel) {
        const record = await tx.category.upsert({
          where: { slug: cat.slug },
          update: { name: cat.name },
          create: { slug: cat.slug, name: cat.name },
        });
        categoryIdBySlug.set(cat.slug, record.id);
      }
      for (const cat of withParent) {
        const parentId = categoryIdBySlug.get(cat.parentSlug!);
        const record = await tx.category.upsert({
          where: { slug: cat.slug },
          update: { name: cat.name, parentId },
          create: { slug: cat.slug, name: cat.name, parentId },
        });
        categoryIdBySlug.set(cat.slug, record.id);
      }

      const locationIdBySlug = new Map<string, string>();
      for (const loc of plan.locationsUsed.values()) {
        const record = await tx.location.upsert({
          where: { slug: loc.slug },
          update: { name: loc.name },
          create: { slug: loc.slug, name: loc.name },
        });
        locationIdBySlug.set(loc.slug, record.id);
      }

      const propertyIdBySourceId = new Map<string, string>();
      for (const p of plan.properties) {
        const record = await tx.property.upsert({
          where: { sourceRecordId: p.sourceRecordId },
          update: {
            name: p.name,
            categoryId: categoryIdBySlug.get(p.categorySlug)!,
            rawCategory: p.rawCategory,
            localityId: locationIdBySlug.get(p.localitySlug)!,
            rawLocality: p.rawLocality,
            verificationStatus: p.verificationStatus,
            source: p.source,
            sourceLastCheckedAt: p.sourceLastCheckedAt,
            mergedFromSourceRecordIds: p.mergedFromSourceRecordIds,
          },
          create: {
            sourceRecordId: p.sourceRecordId,
            name: p.name,
            slug: p.slug,
            categoryId: categoryIdBySlug.get(p.categorySlug)!,
            rawCategory: p.rawCategory,
            localityId: locationIdBySlug.get(p.localitySlug)!,
            rawLocality: p.rawLocality,
            status: p.status,
            verificationStatus: p.verificationStatus,
            source: p.source,
            sourceLastCheckedAt: p.sourceLastCheckedAt,
            mergedFromSourceRecordIds: p.mergedFromSourceRecordIds,
          },
        });
        propertyIdBySourceId.set(p.sourceRecordId, record.id);
      }

      let venueSpacesWritten = 0;
      for (const v of plan.venueSpacesResolved) {
        const parentId = propertyIdBySourceId.get(v.parentSourceRecordId!);
        if (!parentId) continue; // defensive — should not happen given resolution step
        await tx.venueSpace.upsert({
          where: { sourceRecordId: v.sourceRecordId },
          update: { name: v.name, propertyId: parentId, rawParentName: v.rawParentName },
          create: {
            sourceRecordId: v.sourceRecordId,
            name: v.name,
            propertyId: parentId,
            rawParentName: v.rawParentName,
          },
        });
        venueSpacesWritten += 1;
      }

      // Track unresolved venue spaces in the DB (not as businesses — just as a
      // research to-do list) so the admin data-quality view can surface them
      // without depending on a point-in-time JSON report file. Any row that
      // stops being unresolved on a later run (fixed upstream, or a curated
      // override added) is removed here rather than left stale.
      for (const v of plan.venueSpacesUnresolved) {
        await tx.unresolvedVenueSpace.upsert({
          where: { sourceRecordId: v.sourceRecordId },
          update: { name: v.name, rawParentName: v.rawParentName, reason: v.unresolvedReason ?? "unknown" },
          create: {
            sourceRecordId: v.sourceRecordId,
            name: v.name,
            rawParentName: v.rawParentName,
            reason: v.unresolvedReason ?? "unknown",
          },
        });
      }
      const stillUnresolvedIds = plan.venueSpacesUnresolved.map((v) => v.sourceRecordId);
      const staleDeleted = await tx.unresolvedVenueSpace.deleteMany({
        where: { sourceRecordId: { notIn: stillUnresolvedIds.length > 0 ? stillUnresolvedIds : ["__none__"] } },
      });

      console.log(
        `Committed: ${categoryIdBySlug.size} categories, ${locationIdBySlug.size} locations, ` +
          `${propertyIdBySourceId.size} properties, ${venueSpacesWritten} venue spaces, ` +
          `${plan.venueSpacesUnresolved.length} unresolved-venue-space records tracked ` +
          `(${staleDeleted.count} stale ones removed).`
      );
      console.log(
        `Verification Queue (${plan.excludedVerificationQueue.length}) was NOT written as Property/business data.`
      );
    });
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
