"use client";

import { useActionState } from "react";
import type { Influencer } from "@prisma/client";
import { updateCreatorProfile, type CreatorActionState } from "../actions";

const initialState: CreatorActionState = {};
const inputClass =
  "w-full rounded-md border border-brand/20 px-3 py-2 text-sm focus:border-brand-teal focus:outline-none focus:ring-1 focus:ring-brand-teal";
const labelClass = "block text-sm font-medium text-brand-dark";

export default function CreatorProfileForm({ influencer }: { influencer: Influencer }) {
  const action = updateCreatorProfile.bind(null, influencer.id);
  const [state, formAction, pending] = useActionState(action, initialState);
  const errors = state.fieldErrors ?? {};

  return (
    <form action={formAction} className="space-y-6">
      {state.error && <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>}
      {state.success && <p role="status" className="rounded-md bg-green-50 px-3 py-2 text-sm text-green-800">Saved.</p>}

      <div>
        <label htmlFor="name" className={labelClass}>Name</label>
        <input id="name" name="name" defaultValue={influencer.name} className={`mt-1 ${inputClass}`} required />
        {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name}</p>}
      </div>

      <div>
        <label htmlFor="slug" className={labelClass}>
          Username <span className="text-brand/50">(your profile URL: /influencers/your-username)</span>
        </label>
        <input id="slug" name="slug" defaultValue={influencer.slug} className={`mt-1 ${inputClass}`} required />
        {errors.slug && <p className="mt-1 text-xs text-red-600">{errors.slug}</p>}
        <p className="mt-1 text-xs text-brand/50">Changing this changes your public link — update anywhere you&apos;ve already shared it.</p>
      </div>

      <div>
        <label htmlFor="category" className={labelClass}>Category</label>
        <input id="category" name="category" defaultValue={influencer.category ?? ""} placeholder="e.g. Travel, Food, Wedding" className={`mt-1 ${inputClass}`} />
      </div>

      <div>
        <label htmlFor="bio" className={labelClass}>About you</label>
        <textarea id="bio" name="bio" rows={5} defaultValue={influencer.bio ?? ""} className={`mt-1 ${inputClass}`} />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="photoUrl" className={labelClass}>Photo URL</label>
          <input id="photoUrl" name="photoUrl" defaultValue={influencer.photoUrl ?? ""} placeholder="https://" className={`mt-1 ${inputClass}`} />
          {errors.photoUrl && <p className="mt-1 text-xs text-red-600">{errors.photoUrl}</p>}
          <p className="mt-1 text-xs text-brand/50">Paste a link to an image already hosted online (your own photo).</p>
        </div>
        <div>
          <label htmlFor="videoUrl" className={labelClass}>Feature video URL</label>
          <input id="videoUrl" name="videoUrl" defaultValue={influencer.videoUrl ?? ""} placeholder="https://" className={`mt-1 ${inputClass}`} />
          {errors.videoUrl && <p className="mt-1 text-xs text-red-600">{errors.videoUrl}</p>}
          <p className="mt-1 text-xs text-brand/50">A link to a YouTube video, Instagram Reel, etc.</p>
        </div>
      </div>

      <fieldset className="space-y-3 rounded-md border border-brand/10 p-4">
        <legend className="px-1 text-sm font-semibold text-brand-dark">Social media</legend>
        <div>
          <label htmlFor="instagramUrl" className={labelClass}>Instagram</label>
          <input id="instagramUrl" name="instagramUrl" defaultValue={influencer.instagramUrl ?? ""} placeholder="https://" className={`mt-1 ${inputClass}`} />
          {errors.instagramUrl && <p className="mt-1 text-xs text-red-600">{errors.instagramUrl}</p>}
        </div>
        <div>
          <label htmlFor="youtubeUrl" className={labelClass}>YouTube</label>
          <input id="youtubeUrl" name="youtubeUrl" defaultValue={influencer.youtubeUrl ?? ""} placeholder="https://" className={`mt-1 ${inputClass}`} />
          {errors.youtubeUrl && <p className="mt-1 text-xs text-red-600">{errors.youtubeUrl}</p>}
        </div>
        <div>
          <label htmlFor="websiteUrl" className={labelClass}>Website</label>
          <input id="websiteUrl" name="websiteUrl" defaultValue={influencer.websiteUrl ?? ""} placeholder="https://" className={`mt-1 ${inputClass}`} />
          {errors.websiteUrl && <p className="mt-1 text-xs text-red-600">{errors.websiteUrl}</p>}
        </div>
      </fieldset>

      <fieldset className="space-y-3 rounded-md border border-brand/10 p-4">
        <legend className="px-1 text-sm font-semibold text-brand-dark">Contact details (shown on your public profile)</legend>
        <div>
          <label htmlFor="contactEmail" className={labelClass}>Contact email</label>
          <input id="contactEmail" name="contactEmail" type="email" defaultValue={influencer.contactEmail ?? ""} className={`mt-1 ${inputClass}`} />
          {errors.contactEmail && <p className="mt-1 text-xs text-red-600">{errors.contactEmail}</p>}
        </div>
        <div>
          <label htmlFor="contactPhone" className={labelClass}>Contact phone</label>
          <input id="contactPhone" name="contactPhone" defaultValue={influencer.contactPhone ?? ""} className={`mt-1 ${inputClass}`} />
        </div>
      </fieldset>

      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-brand-teal px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-teal/90 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? "Saving…" : "Save changes"}
      </button>
    </form>
  );
}
