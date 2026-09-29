"use client";

import { setInfluencerRating } from "./actions";

export default function RatingsPanel({
  influencerId,
  criteria,
  scoresByCriterion,
}: {
  influencerId: string;
  criteria: { id: string; name: string }[];
  scoresByCriterion: Record<string, number>;
}) {
  if (criteria.length === 0) {
    return <p className="text-sm text-slate-400">No rating criteria yet — add one above to start rating this influencer.</p>;
  }

  return (
    <div className="space-y-2">
      {criteria.map((c) => (
        <form key={c.id} action={setInfluencerRating.bind(null, influencerId, c.id)} className="flex items-center justify-between gap-3">
          <label htmlFor={`score-${c.id}`} className="text-sm text-slate-700">{c.name}</label>
          <div className="flex items-center gap-2">
            <select id={`score-${c.id}`} name="score" defaultValue={scoresByCriterion[c.id] ?? ""} className="rounded-md border border-slate-300 px-2 py-1 text-sm">
              <option value="">—</option>
              {[1, 2, 3, 4, 5].map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
            <button type="submit" className="text-xs font-medium text-slate-600 hover:underline">Save</button>
          </div>
        </form>
      ))}
    </div>
  );
}
