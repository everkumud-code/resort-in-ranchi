"use client";

import { useActionState, useState } from "react";
import type { Influencer } from "@prisma/client";
import { createInfluencer, updateInfluencer, type InfluencerFormState } from "./actions";
import { slugify } from "@/lib/blog/blog";

const initialState: InfluencerFormState = {};
const inputClass =
  "w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500";
const labelClass = "block text-xs font-medium text-slate-500";

export default function InfluencerForm({ influencer }: { influencer?: Influencer }) {
  const action = influencer ? updateInfluencer.bind(null, influencer.id) : createInfluencer;
  const [state, formAction, pending] = useActionState(action, initialState);
  const errors = state.fieldErrors ?? {};
  const [name, setName] = useState(influencer?.name ?? "");
  const [slug, setSlug] = useState(influencer?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(Boolean(influencer));

  return (
    <form action={formAction} className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_14rem]">
      <div className="space-y-4">
        {state.error && <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>}

        <div>
          <label htmlFor="name" className={labelClass}>Name</label>
          <input
            id="name"
            name="name"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (!slugTouched) setSlug(slugify(e.target.value));
            }}
            className={inputClass}
            required
          />
          {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name}</p>}
        </div>
        <div>
          <label htmlFor="slug" className={labelClass}>
            Slug (URL: /influencers/<span className="font-mono">{slug || "your-slug"}</span>)
          </label>
          <input id="slug" name="slug" value={slug} onChange={(e) => { setSlugTouched(true); setSlug(e.target.value); }} className={inputClass} required />
          {errors.slug && <p className="mt-1 text-xs text-red-600">{errors.slug}</p>}
        </div>
        <div>
          <label htmlFor="category" className={labelClass}>Category</label>
          <input id="category" name="category" defaultValue={influencer?.category ?? ""} placeholder="e.g. Travel, Food, Wedding" className={inputClass} />
        </div>
        <div>
          <label htmlFor="bio" className={labelClass}>Bio</label>
          <textarea id="bio" name="bio" rows={4} defaultValue={influencer?.bio ?? ""} className={inputClass} />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="photoUrl" className={labelClass}>Photo URL</label>
            <input id="photoUrl" name="photoUrl" defaultValue={influencer?.photoUrl ?? ""} placeholder="https://" className={inputClass} />
            {errors.photoUrl && <p className="mt-1 text-xs text-red-600">{errors.photoUrl}</p>}
          </div>
          <div>
            <label htmlFor="videoUrl" className={labelClass}>Feature video URL (YouTube, Reel, ...)</label>
            <input id="videoUrl" name="videoUrl" defaultValue={influencer?.videoUrl ?? ""} placeholder="https://" className={inputClass} />
            {errors.videoUrl && <p className="mt-1 text-xs text-red-600">{errors.videoUrl}</p>}
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="contactEmail" className={labelClass}>Public contact email</label>
            <input id="contactEmail" name="contactEmail" type="email" defaultValue={influencer?.contactEmail ?? ""} className={inputClass} />
            {errors.contactEmail && <p className="mt-1 text-xs text-red-600">{errors.contactEmail}</p>}
          </div>
          <div>
            <label htmlFor="contactPhone" className={labelClass}>Public contact phone</label>
            <input id="contactPhone" name="contactPhone" defaultValue={influencer?.contactPhone ?? ""} className={inputClass} />
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label htmlFor="instagramUrl" className={labelClass}>Instagram</label>
            <input id="instagramUrl" name="instagramUrl" defaultValue={influencer?.instagramUrl ?? ""} placeholder="https://" className={inputClass} />
            {errors.instagramUrl && <p className="mt-1 text-xs text-red-600">{errors.instagramUrl}</p>}
          </div>
          <div>
            <label htmlFor="youtubeUrl" className={labelClass}>YouTube</label>
            <input id="youtubeUrl" name="youtubeUrl" defaultValue={influencer?.youtubeUrl ?? ""} placeholder="https://" className={inputClass} />
            {errors.youtubeUrl && <p className="mt-1 text-xs text-red-600">{errors.youtubeUrl}</p>}
          </div>
          <div>
            <label htmlFor="websiteUrl" className={labelClass}>Website</label>
            <input id="websiteUrl" name="websiteUrl" defaultValue={influencer?.websiteUrl ?? ""} placeholder="https://" className={inputClass} />
            {errors.websiteUrl && <p className="mt-1 text-xs text-red-600">{errors.websiteUrl}</p>}
          </div>
        </div>
      </div>

      <aside className="space-y-3 rounded-lg border border-slate-200 bg-panel-green p-4 lg:sticky lg:top-6 lg:self-start">
        <div>
          <label htmlFor="status" className={labelClass}>Status</label>
          <select id="status" name="status" defaultValue={influencer?.status ?? "DRAFT"} className={inputClass}>
            <option value="DRAFT">Draft (not public)</option>
            <option value="PUBLISHED">Published</option>
          </select>
        </div>
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input type="checkbox" name="featured" defaultChecked={influencer?.featured ?? false} />
          Featured
        </label>
        {influencer && (
          <p className="text-xs text-slate-500">
            Claimed: <span className="font-medium text-slate-700">{influencer.claimed ? "Yes" : "No"}</span>
            {!influencer.claimed && " — approve a claim for this creator under Creator claims above to let them manage their own profile."}
          </p>
        )}
        <div>
          <label htmlFor="order" className={labelClass}>Album order (lower shows first)</label>
          <input id="order" name="order" type="number" defaultValue={influencer?.order ?? 0} className={inputClass} />
          {errors.order && <p className="mt-1 text-xs text-red-600">{errors.order}</p>}
        </div>
        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? "Saving…" : influencer ? "Save changes" : "Create influencer"}
        </button>
      </aside>
    </form>
  );
}
