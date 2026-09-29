/**
 * Adds real, verified Ranchi-area attractions (waterfalls, hills, a garden,
 * temples, a zoological park) under a new "Picnic Spots & Day Outing"
 * category, so /picnic-spots and, via a Weekend Getaways tag, /experiences
 * have real content. Every fact here is sourced from ranchi.nic.in (the
 * official district site) and Wikipedia — no rating, price, or opening-hours
 * claim is invented since none was confirmed.
 *
 * Also tags Aangan Resort with both umbrella categories as an EXTRA category
 * (via PropertyCategory directly — an admin/content decision, not the
 * creator/vendor self-service plan-limited path) so it appears on both
 * /picnic-spots and /experiences alongside its own Resorts listing.
 *
 * Default is a DRY RUN that writes nothing.
 * Usage:
 *   npx tsx scripts/seed-attractions-and-tag-aangan.ts
 *   npx tsx scripts/seed-attractions-and-tag-aangan.ts --commit
 */
import { slugify } from "../src/lib/blog/blog";

const ATTRACTIONS = [
  {
    name: "Hundru Falls",
    address: "On the Subarnarekha river, Angara block, ~45 km from Ranchi via the Ranchi–Purulia highway",
    description:
      "One of Jharkhand's highest waterfalls, formed on the Subarnarekha river. A well-known day-trip destination from Ranchi.",
    locality: null,
  },
  {
    name: "Dassam Falls",
    address: "On the Kanchi river near Taimara village, Ranchi–Tata (NH33) road, ~34 km from Ranchi",
    description: "A wide cascading waterfall on the Kanchi river, a popular stop on the Ranchi–Jamshedpur road.",
    locality: null,
  },
  {
    name: "Jonha Falls",
    address: "Ranchi–Purulia highway, ~45 km from Ranchi",
    description: "Also called Gautamdhara Falls; a Buddhist temple and ashram sit on the hill above it.",
    locality: null,
  },
  {
    name: "Panch Ghagh Falls",
    address: "Near Khunti, Khunti district",
    description: "A multi-tiered waterfall near Khunti, often visited together with Hirni Falls.",
    locality: null,
  },
  {
    name: "Hirni Falls",
    address: "Near Khunti, Khunti district",
    description: "A waterfall near Khunti, one of the group of falls south of Ranchi.",
    locality: null,
  },
  {
    name: "Sita Falls",
    address: "Near Jonha, Ranchi district",
    description: "A waterfall close to Jonha Falls on the same river system.",
    locality: null,
  },
  {
    name: "Tagore Hill",
    address: "Morabadi, Ranchi",
    description: "A hill in Morabadi associated with the Tagore family, known as a sunrise and sunset viewpoint.",
    locality: "Morabadi",
  },
  {
    name: "Rock Garden, Ranchi",
    address: "Near Kanke Dam, Kanke, Ranchi",
    description: "A terraced garden next to Kanke Dam, one of the more-visited spots in the city.",
    locality: "Kanke",
  },
  {
    name: "Kanke Dam",
    address: "Kanke, Ranchi",
    description: "A reservoir near the Rock Garden, used for boating and as a picnic spot.",
    locality: "Kanke",
  },
  {
    name: "Pahari Mandir",
    address: "Ranchi Hill, Ranchi",
    description: "A Shiva temple on a hilltop in the city, one of Ranchi's best-known landmarks.",
    locality: "Ranchi",
  },
  {
    name: "Jagannath Temple, Ranchi",
    address: "Jagannathpur, Ranchi",
    description: "A temple modelled on the Jagannath Temple in Puri, known for its annual Rath Yatra.",
    locality: "Ranchi",
  },
  {
    name: "Birsa Zoological Park",
    address: "Ormanjhi, Ranchi",
    description: "A zoological park and botanical garden in Ormanjhi, on the Ranchi–Patna highway.",
    locality: "Ormanjhi",
  },
] as const;

const PICNIC_CATEGORY = { slug: "picnic-day-outing", name: "Picnic Spots & Day Outing" };
const GETAWAY_CATEGORY = { slug: "weekend-getaways", name: "Weekend Getaways" };

async function main() {
  const commit = process.argv.includes("--commit");
  const { PrismaClient } = await import("@prisma/client");
  const prisma = new PrismaClient();

  try {
    console.log(`=== SEED ATTRACTIONS + TAG AANGAN RESORT ${commit ? "COMMIT" : "DRY RUN — no database changes"} ===\n`);

    for (const cat of [PICNIC_CATEGORY, GETAWAY_CATEGORY]) {
      const existing = await prisma.category.findUnique({ where: { slug: cat.slug } });
      if (existing) {
        console.log(`  category "${cat.slug}" already exists`);
      } else {
        console.log(`  create category "${cat.slug}" (${cat.name})`);
        if (commit) await prisma.category.create({ data: { name: cat.name, slug: cat.slug } });
      }
    }

    const picnicCategory = commit
      ? await prisma.category.findUniqueOrThrow({ where: { slug: PICNIC_CATEGORY.slug } })
      : { id: "dry-run" };
    const locations = await prisma.location.findMany({ select: { id: true, name: true } });

    console.log("\n-- Attractions --");
    for (const a of ATTRACTIONS) {
      const slug = slugify(a.name);
      const existing = await prisma.property.findFirst({ where: { OR: [{ slug }, { name: a.name }] } });
      if (existing) {
        console.log(`  skip  "${a.name}" — already exists`);
        continue;
      }
      const locality = a.locality ? locations.find((l) => l.name === a.locality) : null;
      console.log(`  add   ${a.name}${locality ? `  (${locality.name})` : ""}`);
      if (commit) {
        await prisma.property.create({
          data: {
            name: a.name,
            slug,
            categoryId: picnicCategory.id,
            localityId: locality?.id,
            address: a.address,
            city: "Ranchi",
            shortDescription: a.description,
            source: "Compiled from ranchi.nic.in (official district tourism page) and Wikipedia",
            sourceLastCheckedAt: new Date("2026-09-29"),
            status: "PUBLISHED",
            verificationStatus: "VERIFIED",
            lastVerifiedAt: new Date(),
          },
        });
      }
    }

    console.log("\n-- Aangan Resort — extra categories --");
    const aangan = await prisma.property.findUnique({ where: { slug: "aangan-resort-ranchi" }, select: { id: true, name: true } });
    if (!aangan) {
      console.log("  Aangan Resort not found by slug aangan-resort-ranchi — skipping.");
    } else {
      for (const cat of [PICNIC_CATEGORY, GETAWAY_CATEGORY]) {
        console.log(`  tag   ${aangan.name} -> ${cat.slug}`);
        if (commit) {
          const category = await prisma.category.findUniqueOrThrow({ where: { slug: cat.slug } });
          await prisma.propertyCategory.upsert({
            where: { propertyId_categoryId: { propertyId: aangan.id, categoryId: category.id } },
            create: { propertyId: aangan.id, categoryId: category.id },
            update: {},
          });
        }
      }
    }

    if (!commit) console.log("\nRe-run with --commit to write these changes.");
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
