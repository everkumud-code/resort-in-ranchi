/**
 * Seeds the six requested launch badges (Verified, Trusted, Guaranteed, In
 * Association with RIR, RIR Verified, RIR Trusted). Idempotent — skips any
 * key that already exists, safe to re-run. Admins can add/edit/remove more
 * from /admin/badges afterwards.
 *
 * Default is a DRY RUN that writes nothing.
 * Usage:
 *   npx tsx scripts/seed-trust-badges.ts
 *   npx tsx scripts/seed-trust-badges.ts --commit
 */
import { DEFAULT_TRUST_BADGES } from "../src/lib/validation/trustBadge";

async function main() {
  const commit = process.argv.includes("--commit");
  const { PrismaClient } = await import("@prisma/client");
  const prisma = new PrismaClient();

  try {
    console.log(`=== SEED TRUST BADGES ${commit ? "COMMIT" : "DRY RUN — no database changes"} ===\n`);
    let order = 0;
    for (const badge of DEFAULT_TRUST_BADGES) {
      const existing = await prisma.trustBadge.findUnique({ where: { key: badge.key } });
      if (existing) {
        console.log(`  skip  "${badge.label}" — already exists`);
        continue;
      }
      console.log(`  add   ${badge.label}`);
      if (commit) {
        await prisma.trustBadge.create({ data: { ...badge, order: order++ } });
      }
    }
    if (!commit) console.log("\nRe-run with --commit to write these rows.");
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
