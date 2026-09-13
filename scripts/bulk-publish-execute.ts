/**
 * Executes the bulk Discovery-listing publish using the EXACT same pure
 * selection function (computeBulkPublishPlan) and the exact same mutation
 * shape as the protected admin Server Action
 * (src/app/admin/(dashboard)/properties/bulkPublishActions.ts,
 * bulkPublishDiscoveryListings) — this script is a thin, scriptable wrapper
 * around that identical logic, not a separate reimplementation, run the same
 * way every DB write in this project's history has been run (tsx script,
 * dry-run first, --commit + explicit confirmation phrase required to write).
 *
 * Usage:
 *   npx tsx scripts/bulk-publish-execute.ts                          # dry run only
 *   npx tsx scripts/bulk-publish-execute.ts --commit --confirm "PUBLISH DISCOVERY LISTINGS"
 */
import { computeBulkPublishPlan, BULK_PUBLISH_CONFIRM_PHRASE } from "../src/lib/validation/bulkPublish";

const EXPECTED = {
  eligible: 200,
  alreadyPublished: 1,
  notDiscovered: 2,
  identityConflict: 10,
  protected: 1,
  red: 3,
  total: 217,
};

function parseArgs(argv: string[]) {
  const commit = argv.includes("--commit");
  const confirmIndex = argv.indexOf("--confirm");
  const confirm = confirmIndex >= 0 ? argv[confirmIndex + 1] : undefined;
  return { commit, confirm };
}

async function main() {
  const { commit, confirm } = parseArgs(process.argv.slice(2));

  const { PrismaClient } = await import("@prisma/client");
  const prisma = new PrismaClient();

  try {
    const properties = await prisma.property.findMany({
      select: { id: true, name: true, status: true, verificationStatus: true },
    });
    const plan = computeBulkPublishPlan(properties);

    console.log("=== LIVE COUNTS ===");
    console.log({
      total: properties.length,
      eligible: plan.eligibleIds.length,
      alreadyPublished: plan.excludedAlreadyPublished.length,
      notDiscovered: plan.excludedNotDiscovered.length,
      identityConflict: plan.excludedIdentityConflict.length,
      protected: plan.excludedProtected.length,
      red: plan.excludedRed.length,
    });

    const mismatch =
      properties.length !== EXPECTED.total ||
      plan.eligibleIds.length !== EXPECTED.eligible ||
      plan.excludedAlreadyPublished.length !== EXPECTED.alreadyPublished ||
      plan.excludedNotDiscovered.length !== EXPECTED.notDiscovered ||
      plan.excludedIdentityConflict.length !== EXPECTED.identityConflict ||
      plan.excludedProtected.length !== EXPECTED.protected ||
      plan.excludedRed.length !== EXPECTED.red;

    if (mismatch) {
      console.error("\nSAFETY ABORT — live counts do not match the expected plan. No changes made.");
      console.error("Expected:", EXPECTED);
      process.exit(1);
    }
    console.log("\nLive counts match the expected plan exactly.");

    if (!commit) {
      console.log("\nDRY RUN — no database changes were made. Pass --commit --confirm \"<phrase>\" to write.");
      return;
    }

    if (confirm !== BULK_PUBLISH_CONFIRM_PHRASE) {
      console.error(`\nSAFETY ABORT — confirmation phrase did not match exactly "${BULK_PUBLISH_CONFIRM_PHRASE}". No changes made.`);
      process.exit(1);
    }

    console.log(`\n--commit + correct confirmation phrase — publishing ${plan.eligibleIds.length} properties...`);
    const result = await prisma.property.updateMany({
      where: { id: { in: plan.eligibleIds } },
      data: { status: "PUBLISHED" },
    });
    console.log(`Committed: ${result.count} properties set to status=PUBLISHED (verificationStatus untouched).`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
