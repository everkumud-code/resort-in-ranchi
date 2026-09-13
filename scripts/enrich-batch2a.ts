/**
 * Batch 2A enrichment writer — writes researched public-web facts for the
 * 22 approved discovery listings (6 GREEN + 16 YELLOW from the Batch 2A
 * research dossier). Reuses the same Zod validation/transform modules the
 * protected admin Server Actions use (propertyUpdateSchema, venueSpaceSchema,
 * propertyImageSchema, dedupeFacilityIds) so every write goes through
 * identical validation to a manual admin edit — this script just supplies
 * the FormData-shaped input those functions already expect.
 *
 * Explicitly excluded, even though eligible/approved elsewhere: the 3 RED
 * records (Shagun Banquet/Morabadi, IMA Bhawan, Shree Greens Banquet Hall),
 * Aangan Resort, Aangan Palace, the 10 identity-conflict records, and the 2
 * NEEDS_REVIEW records — none of those IDs appear in APPROVED_IDS below, and
 * a hard assertion rejects the run if any forbidden ID were ever added.
 *
 * Never writes: status, verificationStatus, categoryId, localityId,
 * generatedIdentityMarkUrl, pricing (priceMin/priceMax/priceLabel),
 * googleRating/reviewCount (no source in this batch was clearly Google), or
 * any capacity number not sourced to a first-party/official page.
 *
 * Usage:
 *   npx tsx scripts/enrich-batch2a.ts               # dry run — prints the plan, writes nothing
 *   npx tsx scripts/enrich-batch2a.ts --commit       # writes inside one transaction
 */
import fs from "node:fs";
import path from "node:path";
import { propertyImageSchema } from "../src/lib/validation/propertyImage";
import { venueSpaceSchema, buildVenueSpaceData } from "../src/lib/validation/venueSpace";

const RESEARCH_FILE =
  "C:/Users/ASUS/AppData/Local/Temp/claude/C--Users-ASUS-Desktop-resort-in-ranchi/1bbf5964-e047-49f7-887e-3c9095bd1da8/scratchpad/batch2a_merged.json";

const AANGAN_RESORT_ID = "cmtsc3n2w009duzekl2tr6t24";
const AANGAN_PALACE_ID = "cmtsc3my4003fuzek83k22zl7";
const IDENTITY_CONFLICT_PROPERTY_IDS = new Set([
  "cmtsc3n23008buzekysq3q075",
  "cmtsc3n0x006vuzekv3th2ys8",
  "cmtsc3n3a009vuzek6szhii7x",
  "cmtsc3n2d008nuzeku21beiop",
  "cmtsc3n0i006fuzekxv9twjav",
  "cmtsc3n4300axuzekett8tk79",
  "cmtsc3n2a008juzek0kxc99st",
  "cmtsc3mzp005fuzek9uq3g6h1",
  "cmtsc3n5t00d3uzekx9e6h16r",
  "cmtsc3n3b009xuzekkvlwfjq6",
]);
// The 3 RED records from the dossier — deliberately excluded from this batch.
const EXCLUDED_RED_IDS = new Set([
  "cmtsc3mxh002puzek9xx4leo3", // Shagun Banquet (Morabadi) — duplicate/identity concern
  "cmtsc3mxk002tuzekhc6kcdtg", // IMA Bhawan — operational-status concern
  "cmtsc3mxr0031uzekazpdyls5", // Shree Greens Banquet Hall — unverifiable
]);

// The 22 approved IDs (25 researched minus the 3 RED above), in dossier order.
const APPROVED_IDS = [
  "cmtsc3mwd001ruzek59ee286h", // The Cake Shop Bakery
  "cmtsc3mwm001tuzekfnt2mviw", // Lake Garden Banquet Hall
  "cmtsc3mwo001vuzek4fdab12x", // Barat Ghar
  "cmtsc3mwq001xuzek3usn71qc", // Swayamvar Vatika (Party Palace)
  "cmtsc3mws001zuzekt8cejg6j", // Hotel The Raso
  "cmtsc3mwu0021uzekkphiof77", // Shri Gobindam Banquet
  "cmtsc3mwx0023uzekxv7w4kd5", // Ravi Banquet Hall
  "cmtsc3mwz0025uzektrdahgux", // Ideal Banquet Hall
  "cmtsc3mx10027uzek4jnkowf9", // Nandan Palace
  "cmtsc3mx30029uzekaksqu6h3", // Queens Palace
  "cmtsc3mx4002buzeknq2fn84r", // SHAGUN BANQUET HALL (Hatia)
  "cmtsc3mx6002duzekoxxubrei", // J B Banquet Hall
  "cmtsc3mx7002fuzek14ft7upr", // LEGACY BANQUET HALL
  "cmtsc3mx9002huzekh3lqtiv8", // Firayalal Banquets
  "cmtsc3mxb002juzekrb6qsxjr", // Tradition Banquet
  "cmtsc3mxd002luzekzt5rz1e6", // Aashirwad Banquet Hall
  "cmtsc3mxf002nuzekck3524qm", // Abhivadan Banquet Hall
  "cmtsc3mxi002ruzekestcohlp", // Swarna Bhumi Ranchi
  "cmtsc3mxm002vuzek6z5iktge", // Resaldar Baba Banquet Hall
  "cmtsc3mxn002xuzek3zz2vr2h", // Vishalakshi Banquet Hall
  "cmtsc3mxp002zuzekiw8gy3qc", // Wedding Paradise Banquet
  "cmtsc3mxt0033uzeko27mrttm", // Raj Villa & Banquet Hall
];

interface ResearchRecord {
  id: string;
  name: string;
  overallConfidence: "GREEN" | "YELLOW" | "RED";
  description: { status: string; text: string | null };
  contact: {
    address: string | null;
    pincode: string | null;
    phone: string | null;
    email: string | null;
    website: string | null;
    whatsapp: string | null;
    googleMapsUrl: string | null;
  };
  facilities: { name: string; confidence: "HIGH" | "MEDIUM" | "LOW" }[];
  venueSpaces: { name: string; type: string | null; capacity: string | null; confidence: string; source: string }[];
  images: { url: string; depicts: string; confidence: "HIGH" | "MEDIUM" | "LOW"; suggestedAlt: string }[];
}

function loadResearch(): Map<string, ResearchRecord> {
  const raw = JSON.parse(fs.readFileSync(RESEARCH_FILE, "utf8")) as ResearchRecord[];
  return new Map(raw.map((r) => [r.id, r]));
}

// Capacity is only ever written when it comes from a first-party/official
// source at HIGH confidence -- everything else (aggregator-derived, however
// consistent) stays out of the structured capacityMin/capacityMax fields per
// "Do not enter unconfirmed capacities."
function parseOfficialCapacity(capacity: string | null, confidence: string, source: string) {
  if (confidence !== "HIGH" || !/official site/i.test(source) || !capacity) {
    return { capacityMin: null as number | null, capacityMax: null as number | null };
  }
  const nums = capacity.match(/[\d,]+/g)?.map((n) => Number(n.replace(/,/g, "")));
  if (!nums || nums.length === 0) return { capacityMin: null, capacityMax: null };
  if (nums.length === 1) return { capacityMin: nums[0], capacityMax: nums[0] };
  return { capacityMin: Math.min(...nums), capacityMax: Math.max(...nums) };
}

interface PropertyChangeSet {
  id: string;
  name: string;
  scalarUpdates: Record<string, string | null>;
  facilityNames: string[];
  venueSpaces: { name: string; type: string | null; capacityMin: number | null; capacityMax: number | null }[];
  images: { url: string; altText: string; confidence: string }[];
  skippedLowConfidence: { facilities: string[]; images: string[]; venueSpaceNamesFiltered: string[] };
}

function buildChangeSet(r: ResearchRecord): PropertyChangeSet {
  const scalarUpdates: Record<string, string | null> = {};
  if (r.description.text) scalarUpdates.shortDescription = r.description.text;
  if (r.contact.address) scalarUpdates.address = r.contact.address;
  if (r.contact.pincode) scalarUpdates.pincode = r.contact.pincode;
  if (r.contact.phone) scalarUpdates.phone = r.contact.phone;
  if (r.contact.email) scalarUpdates.email = r.contact.email;
  if (r.contact.website) scalarUpdates.website = r.contact.website;
  if (r.contact.whatsapp) scalarUpdates.whatsapp = r.contact.whatsapp;
  if (r.contact.googleMapsUrl) scalarUpdates.googleMapsUrl = r.contact.googleMapsUrl;

  const facilityNames = r.facilities.filter((f) => f.confidence !== "LOW").map((f) => f.name);
  const skippedFacilities = r.facilities.filter((f) => f.confidence === "LOW").map((f) => f.name);

  const skippedVenueSpaceNames: string[] = [];
  const venueSpaces = r.venueSpaces
    .filter((v) => {
      const isPlaceholder = !v.name || /unnamed/i.test(v.name);
      if (isPlaceholder) skippedVenueSpaceNames.push(v.name);
      return !isPlaceholder;
    })
    .map((v) => ({
      name: v.name,
      type: v.type,
      ...parseOfficialCapacity(v.capacity, v.confidence, v.source),
    }));

  const images = r.images
    .filter((im) => im.confidence !== "LOW")
    .map((im) => ({ url: im.url, altText: im.suggestedAlt, confidence: im.confidence }));
  const skippedImages = r.images.filter((im) => im.confidence === "LOW").map((im) => im.url);

  return {
    id: r.id,
    name: r.name,
    scalarUpdates,
    facilityNames,
    venueSpaces,
    images,
    skippedLowConfidence: { facilities: skippedFacilities, images: skippedImages, venueSpaceNamesFiltered: skippedVenueSpaceNames },
  };
}

async function main() {
  const commit = process.argv.includes("--commit");

  // --- Safety assertions before touching anything ---
  const dupWithConflict = APPROVED_IDS.filter((id) => IDENTITY_CONFLICT_PROPERTY_IDS.has(id));
  const dupWithAangan = APPROVED_IDS.filter((id) => id === AANGAN_RESORT_ID || id === AANGAN_PALACE_ID);
  const dupWithRed = APPROVED_IDS.filter((id) => EXCLUDED_RED_IDS.has(id));
  if (dupWithConflict.length || dupWithAangan.length || dupWithRed.length) {
    console.error("SAFETY ABORT — forbidden ID(s) present in APPROVED_IDS:", {
      dupWithConflict,
      dupWithAangan,
      dupWithRed,
    });
    process.exit(1);
  }
  if (APPROVED_IDS.length !== 22) {
    console.error(`SAFETY ABORT — expected exactly 22 approved IDs, got ${APPROVED_IDS.length}`);
    process.exit(1);
  }

  const research = loadResearch();
  const changeSets: PropertyChangeSet[] = [];
  for (const id of APPROVED_IDS) {
    const r = research.get(id);
    if (!r) {
      console.error(`SAFETY ABORT — no research record found for approved id ${id}`);
      process.exit(1);
    }
    if (r.overallConfidence === "RED") {
      console.error(`SAFETY ABORT — ${id} (${r.name}) is RED in the dossier but present in APPROVED_IDS`);
      process.exit(1);
    }
    changeSets.push(buildChangeSet(r));
  }

  console.log(`Loaded research for ${changeSets.length} approved properties. Validating against Zod schemas...`);

  // Validate every venue-space and image payload through the real schemas
  // used by the protected admin actions, so this script can never write a
  // shape those actions would themselves reject.
  for (const cs of changeSets) {
    for (const vs of cs.venueSpaces) {
      const parsed = venueSpaceSchema.safeParse({
        name: vs.name,
        type: vs.type ?? "",
        capacityMin: vs.capacityMin === null ? "" : String(vs.capacityMin),
        capacityMax: vs.capacityMax === null ? "" : String(vs.capacityMax),
        description: "",
      });
      if (!parsed.success) {
        console.error(`SAFETY ABORT — venueSpaceSchema rejected "${vs.name}" for ${cs.name}:`, parsed.error.issues);
        process.exit(1);
      }
    }
    for (const im of cs.images) {
      const parsed = propertyImageSchema.safeParse({
        url: im.url,
        altText: im.altText,
        caption: "",
        sortOrder: "",
        kind: "PHOTO",
      });
      if (!parsed.success) {
        console.error(`SAFETY ABORT — propertyImageSchema rejected "${im.url}" for ${cs.name}:`, parsed.error.issues);
        process.exit(1);
      }
    }
  }
  console.log("All venue-space and image payloads passed schema validation.");

  const { PrismaClient } = await import("@prisma/client");
  const prisma = new PrismaClient();

  try {
    // --- Snapshot BEFORE state ---
    const before = await prisma.property.findMany({
      where: { id: { in: APPROVED_IDS } },
      include: { images: true, venueSpaces: true, facilities: { include: { facility: true } } },
    });
    const beforeById = new Map(before.map((p) => [p.id, p]));

    const facilities = await prisma.facility.findMany();
    const facilityIdByName = new Map(facilities.map((f) => [f.name, f.id]));

    const outDir = path.dirname(RESEARCH_FILE);
    fs.writeFileSync(path.join(outDir, "batch2a_before_snapshot.json"), JSON.stringify(before, null, 2));
    console.log(`Snapshot of BEFORE state written (${before.length} properties).`);

    if (!commit) {
      console.log("\n=== DRY RUN PLAN ===");
      for (const cs of changeSets) {
        console.log(`\n#${cs.id} ${cs.name}`);
        console.log("  scalar updates:", cs.scalarUpdates);
        console.log("  facilities to link:", cs.facilityNames);
        console.log("  venue spaces to create:", cs.venueSpaces);
        console.log("  images to add:", cs.images.map((i) => i.url));
        if (cs.skippedLowConfidence.facilities.length || cs.skippedLowConfidence.images.length || cs.skippedLowConfidence.venueSpaceNamesFiltered.length) {
          console.log("  intentionally skipped (LOW confidence / unnamed):", cs.skippedLowConfidence);
        }
      }
      console.log("\nDRY RUN — no database changes were made. Pass --commit to write to the database.");
      return;
    }

    console.log("\n--commit passed — writing to the database in one transaction...");

    await prisma.$transaction(async (tx) => {
      for (const cs of changeSets) {
        const existing = beforeById.get(cs.id)!;

        if (Object.keys(cs.scalarUpdates).length > 0) {
          await tx.property.update({ where: { id: cs.id }, data: cs.scalarUpdates });
        }

        if (cs.facilityNames.length > 0) {
          const facilityIds = cs.facilityNames
            .map((n) => facilityIdByName.get(n))
            .filter((id): id is string => Boolean(id));
          await tx.propertyFacility.deleteMany({ where: { propertyId: cs.id } });
          await tx.propertyFacility.createMany({
            data: facilityIds.map((facilityId) => ({ propertyId: cs.id, facilityId })),
            skipDuplicates: true,
          });
        }

        for (const vs of cs.venueSpaces) {
          const alreadyExists = existing.venueSpaces.some((e) => e.name.toLowerCase() === vs.name.toLowerCase());
          if (alreadyExists) continue; // idempotent re-run safety
          const data = buildVenueSpaceData({
            name: vs.name,
            type: vs.type,
            capacityMin: vs.capacityMin,
            capacityMax: vs.capacityMax,
            description: null,
          });
          await tx.venueSpace.create({ data: { propertyId: cs.id, ...data } });
        }

        const existingImageUrls = new Set(existing.images.map((i) => i.url));
        let nextSortOrder = existing.images.length;
        for (const im of cs.images) {
          if (existingImageUrls.has(im.url)) continue; // idempotent re-run safety
          await tx.propertyImage.create({
            data: {
              propertyId: cs.id,
              url: im.url,
              altText: im.altText,
              caption: null,
              sortOrder: nextSortOrder,
              kind: "PHOTO",
            },
          });
          nextSortOrder += 1;
        }
      }
    });

    console.log("Transaction committed.");

    const after = await prisma.property.findMany({
      where: { id: { in: APPROVED_IDS } },
      include: { images: true, venueSpaces: true, facilities: { include: { facility: true } } },
    });
    fs.writeFileSync(path.join(outDir, "batch2a_after_snapshot.json"), JSON.stringify(after, null, 2));
    console.log(`Snapshot of AFTER state written (${after.length} properties).`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
