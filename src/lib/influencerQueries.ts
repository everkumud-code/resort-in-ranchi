import { prisma } from "@/lib/prisma";
import { averageInfluencerRating } from "./influencers";

export const influencerCardSelect = {
  id: true,
  name: true,
  slug: true,
  photoUrl: true,
  bio: true,
  category: true,
  instagramUrl: true,
  youtubeUrl: true,
  websiteUrl: true,
  featured: true,
  ratings: { select: { score: true, criterionId: true } },
} as const;

export interface PublicInfluencer {
  id: string;
  name: string;
  slug: string;
  photoUrl: string | null;
  bio: string | null;
  category: string | null;
  instagramUrl: string | null;
  youtubeUrl: string | null;
  websiteUrl: string | null;
  featured: boolean;
  rating: number | null;
}

/** Every published influencer, featured first — for the homepage scroll album and /influencers. Never throws — an unmigrated table just yields none. */
export async function listPublishedInfluencers(): Promise<PublicInfluencer[]> {
  try {
    const rows = await prisma.influencer.findMany({
      where: { status: "PUBLISHED" },
      select: influencerCardSelect,
      orderBy: [{ featured: "desc" }, { order: "asc" }, { name: "asc" }],
    });
    return rows.map((r) => ({ ...r, rating: averageInfluencerRating(r.ratings) }));
  } catch (error) {
    console.error("[influencers] read failed:", error instanceof Error ? error.message.split("\n").pop() : error);
    return [];
  }
}

export async function getPublishedInfluencer(slug: string): Promise<(PublicInfluencer & { ratings: { score: number; criterion: { name: string } }[] }) | null> {
  try {
    const row = await prisma.influencer.findFirst({
      where: { slug, status: "PUBLISHED" },
      select: { ...influencerCardSelect, ratings: { select: { score: true, criterionId: true, criterion: { select: { name: true } } } } },
    });
    if (!row) return null;
    return { ...row, rating: averageInfluencerRating(row.ratings) };
  } catch {
    return null;
  }
}
