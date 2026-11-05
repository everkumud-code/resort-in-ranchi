import { prisma } from "@/lib/prisma";
import {
  DEFAULT_PLACEMENTS,
  DEFAULT_PROMO_ADS,
  PROMO_SPOTS,
  pickAdForSpot,
  type PromoAdData,
  type PromoSpotKey,
} from "./catalog";

export interface PromoState {
  ads: PromoAdData[];
  placements: { slot: string; adId: string | null }[];
  /** True until the owner saves anything in Admin -> Promos: the starter set is shown but not stored yet. */
  usingStarter: boolean;
}

/** The starter set as in-memory data (ids are the keys), used until it is saved. */
export function starterState(): PromoState {
  return {
    ads: DEFAULT_PROMO_ADS.map((a) => ({ ...a, id: a.key })),
    placements: PROMO_SPOTS.map((s) => ({ slot: s.key, adId: DEFAULT_PLACEMENTS[s.key] })),
    usingStarter: true,
  };
}

export async function loadPromoState(): Promise<PromoState> {
  const [placements, ads] = await Promise.all([
    prisma.promoPlacement.findMany({ select: { slot: true, adId: true } }),
    prisma.promoAd.findMany({ orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] }),
  ]);
  // No placement rows at all means nothing has been saved yet. Rows are never deleted, so this cannot happen by accident later.
  if (placements.length === 0) return starterState();
  return { ads, placements, usingStarter: false };
}

/**
 * What a public page renders. Never throws: if the database cannot be read
 * (for example a migration has not run yet) the page simply shows no ad.
 */
export async function getAdForSpot(spot: PromoSpotKey): Promise<PromoAdData | null> {
  try {
    const state = await loadPromoState();
    return pickAdForSpot(spot, state.placements, state.ads);
  } catch {
    return null;
  }
}

type Tx = Parameters<Parameters<typeof prisma.$transaction>[0]>[0];

/**
 * Stores the starter ads and their spots the first time the owner changes
 * anything, so editing works on real rows. Safe to call again: once the spots
 * exist it does nothing.
 */
export async function ensureStarterSaved(tx: Tx): Promise<void> {
  if ((await tx.promoPlacement.count()) > 0) return;
  const idByKey = new Map<string, string>();
  for (const ad of DEFAULT_PROMO_ADS) {
    const row = await tx.promoAd.upsert({ where: { key: ad.key }, create: ad, update: {} });
    idByKey.set(ad.key, row.id);
  }
  for (const spot of PROMO_SPOTS) {
    await tx.promoPlacement.create({ data: { slot: spot.key, adId: idByKey.get(DEFAULT_PLACEMENTS[spot.key]) ?? null } });
  }
}
