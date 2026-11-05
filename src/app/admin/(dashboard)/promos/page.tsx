import { requireAdmin } from "@/lib/auth/session";
import { canOpenSettings } from "@/lib/settings/team";
import { PROMO_SPOTS } from "@/lib/promo/catalog";
import { loadPromoState } from "@/lib/promo/store";
import { Card } from "../settings/ui";
import { AdEditor, AdPreview, DeleteAdButton, SpotRow, ToggleAdButton } from "./PromoForms";

export const dynamic = "force-dynamic";

export default async function PromosPage() {
  const admin = await requireAdmin();
  if (!canOpenSettings(admin.role)) {
    return (
      <div role="alert" className="rounded-lg border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">
        <p className="font-semibold">This section is for Admins and Super admins.</p>
      </div>
    );
  }

  const state = await loadPromoState();
  const adByKeyId = new Map(state.ads.map((a) => [a.id, a]));
  const spotsOf = (adId: string) =>
    state.placements
      .filter((p) => p.adId === adId)
      .map((p): string => PROMO_SPOTS.find((s) => s.key === p.slot)?.label ?? "")
      .filter(Boolean);
  const currentKeyFor = (slot: string) => {
    const p = state.placements.find((x) => x.slot === slot);
    return (p?.adId && adByKeyId.get(p.adId)?.key) || "";
  };

  return (
    <div className="max-w-4xl space-y-5">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Promo ads</h1>
        <p className="mt-1 text-sm text-slate-600">
          Sponsored cards for Next Resource&apos;s services and products. Each spot below is a fixed place in the site and holds one ad, and no page
          has more than one, so ads never clash with each other. They sit in the normal page flow, are labelled “Ad”, and never cover the page.
          The Aangan Resort ads on blog posts, search and area pages are separate and are not touched here.
        </p>
        {state.usingStarter && (
          <p className="mt-3 rounded-md bg-sky-50 px-3 py-2 text-sm text-sky-800">
            You are seeing the starter set. It is already live on the site. Saving any change below keeps it as your own and lets you edit everything.
          </p>
        )}
      </div>

      <Card title="Where each ad appears" description="Pick one ad per spot, or “No ad” to leave a spot empty. The same ad may be used in more than one spot.">
        <div>
          {PROMO_SPOTS.map((spot) => (
            <SpotRow
              key={spot.key}
              spotKey={spot.key}
              label={spot.label}
              where={spot.where}
              ads={state.ads.map((a) => ({ key: a.key, brand: a.brand, active: a.active }))}
              currentKey={currentKeyFor(spot.key)}
            />
          ))}
        </div>
      </Card>

      <div className="space-y-4">
        <h2 className="text-base font-semibold text-slate-900">Your ads</h2>
        {state.ads.length === 0 && <p className="text-sm text-slate-600">No ads yet. Add one below.</p>}
        {state.ads.map((ad) => {
          const shownOn = spotsOf(ad.id);
          return (
            <section key={ad.key} className="rounded-lg border border-slate-200 bg-panel-green p-5 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">
                    {ad.brand}
                    {!ad.active && <span className="ml-2 rounded-full bg-slate-200 px-2 py-0.5 text-[11px] font-medium text-slate-700">Switched off</span>}
                  </h3>
                  <p className="text-xs text-slate-500">{shownOn.length > 0 ? `Shown on: ${shownOn.join(", ")}` : "Not placed anywhere yet"}</p>
                </div>
                <div className="flex items-start gap-2">
                  <ToggleAdButton adKey={ad.key} active={ad.active} />
                  <DeleteAdButton adKey={ad.key} brand={ad.brand} />
                </div>
              </div>
              <div className="mt-4">
                <AdPreview ad={ad} />
              </div>
              <details className="mt-4">
                <summary className="cursor-pointer text-sm font-medium text-slate-800">Edit the words, link and colour</summary>
                <div className="mt-3">
                  <AdEditor ad={ad} />
                </div>
              </details>
            </section>
          );
        })}
      </div>

      <Card title="Add a new ad" description="For another Next Resource service, an offer, or anything you want to promote. It appears only where you place it above.">
        <AdEditor />
      </Card>
    </div>
  );
}
