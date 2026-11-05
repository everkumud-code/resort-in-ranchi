"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/session";
import { logSettingChange } from "@/lib/settings/store";
import { canOpenSettings } from "@/lib/settings/team";
import { ensureStarterSaved } from "@/lib/promo/store";
import { PROMO_SPOTS, isPromoSpot, parseAdHref, parsePointsText, promoAdSchema, slugifyKey } from "@/lib/promo/catalog";

export interface PromoFormState {
  error?: string;
  success?: string;
}

const NOT_ALLOWED: PromoFormState = { error: "Only Admins and Super admins can change the promo ads." };

async function promoAdmin() {
  const admin = await requireAdmin();
  return canOpenSettings(admin.role) ? admin : null;
}

function refresh() {
  revalidatePath("/admin/promos");
  // The ads sit on many public pages; refresh them all so a change shows at once.
  revalidatePath("/", "layout");
}

/** Create a new ad (no `key` in the form) or edit one (`key` identifies it, so the starter ads work before they are stored). */
export async function saveAd(_prev: PromoFormState, formData: FormData): Promise<PromoFormState> {
  const admin = await promoAdmin();
  if (!admin) return NOT_ALLOWED;

  const existingKey = String(formData.get("key") ?? "").trim();
  const parsed = promoAdSchema.safeParse({
    brand: formData.get("brand"),
    tag: formData.get("tag"),
    headline: formData.get("headline"),
    body: formData.get("body"),
    ctaLabel: formData.get("ctaLabel"),
    accent: formData.get("accent"),
    points: parsePointsText(String(formData.get("points") ?? "")),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check the fields and try again." };
  const href = parseAdHref(String(formData.get("href") ?? ""));
  if (!href.ok) return { error: href.error };
  const active = formData.get("active") === "on";
  const data = { ...parsed.data, href: href.value, active };

  try {
    await prisma.$transaction(async (tx) => {
      await ensureStarterSaved(tx);
      if (existingKey) {
        const found = await tx.promoAd.findUnique({ where: { key: existingKey }, select: { id: true } });
        if (!found) throw new Error("missing");
        await tx.promoAd.update({ where: { key: existingKey }, data });
        return;
      }
      const base = slugifyKey(data.brand) || "ad";
      let key = base;
      for (let n = 2; await tx.promoAd.findUnique({ where: { key }, select: { id: true } }); n++) key = `${base}-${n}`;
      const last = await tx.promoAd.aggregate({ _max: { sortOrder: true } });
      await tx.promoAd.create({ data: { ...data, key, sortOrder: (last._max.sortOrder ?? 0) + 1 } });
    });
  } catch (e) {
    if (e instanceof Error && e.message === "missing") return { error: "That ad no longer exists. Reload the page." };
    return { error: "Could not save the ad. Try again." };
  }

  await logSettingChange("Promos", existingKey ? `Edited the “${data.brand}” ad` : `Added the “${data.brand}” ad`, admin.email);
  refresh();
  return { success: existingKey ? "Saved." : "Ad added. Choose where it appears in the list above." };
}

export async function setAdActive(_prev: PromoFormState, formData: FormData): Promise<PromoFormState> {
  const admin = await promoAdmin();
  if (!admin) return NOT_ALLOWED;
  const key = String(formData.get("key") ?? "");
  const active = formData.get("active") === "true";
  let brand = "";
  try {
    await prisma.$transaction(async (tx) => {
      await ensureStarterSaved(tx);
      const row = await tx.promoAd.update({ where: { key }, data: { active }, select: { brand: true } });
      brand = row.brand;
    });
  } catch {
    return { error: "Could not change that ad. Reload the page." };
  }
  await logSettingChange("Promos", `${active ? "Switched on" : "Switched off"} the “${brand}” ad`, admin.email);
  refresh();
  return { success: active ? "Switched on." : "Switched off." };
}

export async function deleteAd(_prev: PromoFormState, formData: FormData): Promise<PromoFormState> {
  const admin = await promoAdmin();
  if (!admin) return NOT_ALLOWED;
  const key = String(formData.get("key") ?? "");
  let brand = "";
  try {
    await prisma.$transaction(async (tx) => {
      await ensureStarterSaved(tx);
      const row = await tx.promoAd.delete({ where: { key }, select: { brand: true } });
      brand = row.brand;
    });
  } catch {
    return { error: "Could not delete that ad. Reload the page." };
  }
  await logSettingChange("Promos", `Deleted the “${brand}” ad`, admin.email);
  refresh();
  return { success: "Deleted. Any spot it held is now empty." };
}

/** Choose which ad sits in a spot, or none. The spot is one fixed row, so it can never hold two ads. */
export async function setSpotAd(_prev: PromoFormState, formData: FormData): Promise<PromoFormState> {
  const admin = await promoAdmin();
  if (!admin) return NOT_ALLOWED;
  const slot = String(formData.get("slot") ?? "");
  if (!isPromoSpot(slot)) return { error: "Unknown spot." };
  const adKey = String(formData.get("adKey") ?? "");
  const spotLabel = PROMO_SPOTS.find((s) => s.key === slot)?.label ?? slot;

  let brand = "";
  try {
    await prisma.$transaction(async (tx) => {
      await ensureStarterSaved(tx);
      let adId: string | null = null;
      if (adKey) {
        const ad = await tx.promoAd.findUnique({ where: { key: adKey }, select: { id: true, brand: true } });
        if (!ad) throw new Error("missing");
        adId = ad.id;
        brand = ad.brand;
      }
      await tx.promoPlacement.upsert({ where: { slot }, create: { slot, adId }, update: { adId } });
    });
  } catch {
    return { error: "Could not change that spot. Reload the page." };
  }
  await logSettingChange("Promos", brand ? `Put the “${brand}” ad on: ${spotLabel}` : `Emptied the spot: ${spotLabel}`, admin.email);
  refresh();
  return { success: brand ? "Saved." : "Spot emptied." };
}
