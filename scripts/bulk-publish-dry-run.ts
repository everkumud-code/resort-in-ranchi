/**
 * Read-only dry-run report for the bulk Discovery-listing publish action.
 * Never writes to the database — prints the exact plan the protected
 * bulkPublishDiscoveryListings Server Action would execute if an admin
 * confirmed it (see src/app/admin/(dashboard)/properties/bulkPublishActions.ts).
 *
 * Usage: npx tsx scripts/bulk-publish-dry-run.ts
 */
import { computeBulkPublishPlan } from "../src/lib/validation/bulkPublish";

async function main() {
  const { PrismaClient } = await import("@prisma/client");
  const prisma = new PrismaClient();

  try {
    const properties = await prisma.property.findMany({
      select: { id: true, name: true, status: true, verificationStatus: true },
    });
    const plan = computeBulkPublishPlan(properties);
    const byId = new Map(properties.map((p) => [p.id, p]));

    console.log("=== BULK PUBLISH DRY RUN — no database changes made ===\n");
    console.log(`Total properties:                 ${properties.length}`);
    console.log(`Eligible for bulk publish:         ${plan.eligibleIds.length}`);
    console.log(`Already published:                 ${plan.excludedAlreadyPublished.length}`);
    console.log(`Not DISCOVERED (NEEDS_REVIEW etc.): ${plan.excludedNotDiscovered.length}`);
    console.log(`Identity-conflict records:          ${plan.excludedIdentityConflict.length}`);
    console.log(`Explicitly protected (Aangan Palace):${plan.excludedProtected.length}`);
    console.log(`Held RED (Batch 2A):                ${plan.excludedRed.length}`);

    console.log("\n--- Already published ---");
    for (const id of plan.excludedAlreadyPublished) console.log(` - ${byId.get(id)?.name} (${id})`);

    console.log("\n--- Held RED (Batch 2A) ---");
    for (const id of plan.excludedRed) console.log(` - ${byId.get(id)?.name} (${id})`);

    console.log("\n--- Explicitly protected ---");
    for (const id of plan.excludedProtected) console.log(` - ${byId.get(id)?.name} (${id})`);

    console.log(`\n--- Not DISCOVERED (${plan.excludedNotDiscovered.length}) ---`);
    for (const id of plan.excludedNotDiscovered) {
      const p = byId.get(id)!;
      console.log(` - ${p.name} (${id}) — status=${p.status} verificationStatus=${p.verificationStatus}`);
    }

    console.log(`\n--- Identity-conflict (${plan.excludedIdentityConflict.length}) ---`);
    for (const id of plan.excludedIdentityConflict) console.log(` - ${byId.get(id)?.name} (${id})`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
