/**
 * One-off seed of REAL Ranchi Dandiya/Navratri events and REAL Ranchi
 * Instagram creators, sourced from public event aggregators (allevents.in,
 * the organizer's own site) and public influencer-directory listicles
 * (Qoruz). No fabricated names, photos, bios, or ratings — bios are a
 * generic, honest sentence plus the category the directory listed. Cover
 * images / photos are intentionally left blank (no verified direct image
 * URL was available); ratings are left unset for an admin to fill in later.
 *
 * Default is a DRY RUN that writes nothing.
 * Usage:
 *   npx tsx scripts/seed-events-influencers-demo.ts
 *   npx tsx scripts/seed-events-influencers-demo.ts --commit
 */
import { slugify } from "../src/lib/blog/blog";

const SOURCE_NOTE = "Listed from public creator directories — contact us via /contact to update or claim this profile.";

const EVENTS = [
  {
    title: "Raas Utsav 2026 — Jharkhand's Grandest Dandiya Night",
    description:
      "Traditional Gujarati Garba & Dandiya night with live orchestral music and DJ performances, organized by Event Point. Passes start at ₹999 (solo entry).",
    venueName: "Upwan Lawn, Chanakya BNR Hotel",
    address: "Station Road, Ranchi",
    startAt: "2026-10-16T17:00:00+05:30",
    endAt: "2026-10-16T23:00:00+05:30",
    ticketUrl: "https://www.eventpointranchi.com/",
    contactPhone: "+91 94301 12440",
    contactEmail: "eventpointranchi18@gmail.com",
  },
  {
    title: "Rangratri Season 2",
    description: "Navratri celebration at Vatika, The Chanakya BNR Hotel, Ranchi.",
    venueName: "Vatika, The Chanakya BNR Hotel",
    address: "Ranchi",
    startAt: "2026-10-14T18:00:00+05:30",
    endAt: null,
    ticketUrl: "https://allevents.in/ranchi/navratri",
    contactPhone: null,
    contactEmail: null,
  },
  {
    title: "Dandiya Fiesta",
    description: "Dandiya night at Ascot International School, Ranchi.",
    venueName: "Ascot International School",
    address: "Ranchi",
    startAt: "2026-10-15T18:00:00+05:30",
    endAt: "2026-10-15T22:00:00+05:30",
    ticketUrl: "https://allevents.in/ranchi/navratri",
    contactPhone: null,
    contactEmail: null,
  },
  {
    title: "Dandiya Ratri 2026",
    description: "Dandiya event at Maithan Marriage Palace, Bariatu, Ranchi.",
    venueName: "Maithan Marriage Palace",
    address: "Lowadih, Bariatu, Ranchi",
    startAt: "2026-10-15T07:00:00+05:30",
    endAt: "2026-10-15T11:00:00+05:30",
    ticketUrl: "https://allevents.in/ranchi/navratri",
    contactPhone: null,
    contactEmail: null,
  },
] as const;

const INFLUENCERS = [
  { name: "Lifestyle Ranchi", instagramUrl: "https://instagram.com/lifestyleranchi", category: "Lifestyle & Fashion" },
  { name: "Dr. Ammara Azmi", instagramUrl: "https://instagram.com/ammaraazmi", category: "Food" },
  { name: "Rimjhim Mohanto", instagramUrl: "https://instagram.com/rimjhim_official", category: "Food" },
  { name: "Khushboo", instagramUrl: "https://instagram.com/foodie_khushii", category: "Food" },
  { name: "Jharkhand Lifestyle", instagramUrl: "https://instagram.com/jharkhand_lifestyle", category: "Lifestyle" },
  { name: "Nikhil Nigam", instagramUrl: "https://instagram.com/mr_nikhilnigam", category: "Food" },
] as const;

async function main() {
  const commit = process.argv.includes("--commit");
  const { PrismaClient } = await import("@prisma/client");
  const prisma = new PrismaClient();

  try {
    console.log(`=== SEED EVENTS + INFLUENCERS ${commit ? "COMMIT" : "DRY RUN — no database changes"} ===\n`);

    console.log("-- Events --");
    for (const e of EVENTS) {
      const slug = slugify(e.title);
      if (await prisma.event.findUnique({ where: { slug } })) {
        console.log(`  skip  "${e.title}" — slug "${slug}" already exists`);
        continue;
      }
      console.log(`  add   ${e.title}  (${e.startAt})  @ ${e.venueName}`);
      if (commit) {
        await prisma.event.create({
          data: {
            title: e.title,
            slug,
            description: e.description,
            venueName: e.venueName,
            address: e.address,
            startAt: new Date(e.startAt),
            endAt: e.endAt ? new Date(e.endAt) : null,
            ticketUrl: e.ticketUrl,
            contactPhone: e.contactPhone,
            contactEmail: e.contactEmail,
            status: "PUBLISHED",
          },
        });
      }
    }

    console.log("\n-- Influencers --");
    for (const inf of INFLUENCERS) {
      const slug = slugify(inf.name);
      if (await prisma.influencer.findUnique({ where: { slug } })) {
        console.log(`  skip  "${inf.name}" — slug "${slug}" already exists`);
        continue;
      }
      console.log(`  add   ${inf.name}  (${inf.category})  ${inf.instagramUrl}`);
      if (commit) {
        await prisma.influencer.create({
          data: {
            name: inf.name,
            slug,
            category: inf.category,
            instagramUrl: inf.instagramUrl,
            bio: `Ranchi-based content creator on Instagram, focused on ${inf.category.toLowerCase()}. ${SOURCE_NOTE}`,
            status: "PUBLISHED",
          },
        });
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
