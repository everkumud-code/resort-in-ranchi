import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { averageInfluencerRating } from "@/lib/influencers";
import CriteriaManager from "./CriteriaManager";
import { deleteInfluencer } from "./actions";
import ConfirmForm from "@/components/admin/ConfirmForm";

export const dynamic = "force-dynamic";

export default async function AdminInfluencersPage() {
  const [influencers, criteria] = await Promise.all([
    prisma.influencer.findMany({
      orderBy: [{ featured: "desc" }, { order: "asc" }, { name: "asc" }],
      include: { ratings: { select: { score: true, criterionId: true } } },
    }),
    prisma.influencerCriterion.findMany({ orderBy: { order: "asc" } }),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Influencers</h1>
          <p className="mt-1 text-sm text-slate-500">
            {influencers.length} total. Published ones appear at <Link href="/influencers" className="underline">/influencers</Link> and on the homepage.
          </p>
        </div>
        <Link href="/admin/influencers/new" className="rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-700">
          New influencer
        </Link>
      </div>

      <CriteriaManager criteria={criteria} />

      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-2 text-left font-medium text-slate-500">Name</th>
              <th className="px-4 py-2 text-left font-medium text-slate-500">Status</th>
              <th className="px-4 py-2 text-left font-medium text-slate-500">Featured</th>
              <th className="px-4 py-2 text-left font-medium text-slate-500">Rating</th>
              <th className="px-4 py-2" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {influencers.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-400">No influencers yet.</td></tr>
            )}
            {influencers.map((inf) => {
              const rating = averageInfluencerRating(inf.ratings);
              return (
                <tr key={inf.id} className="hover:bg-slate-50">
                  <td className="px-4 py-2 font-medium text-slate-900">{inf.name}</td>
                  <td className="px-4 py-2">
                    <span
                      className={
                        inf.status === "PUBLISHED"
                          ? "rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700"
                          : "rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600"
                      }
                    >
                      {inf.status === "PUBLISHED" ? "Published" : "Draft"}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-slate-600">{inf.featured ? "Yes" : "—"}</td>
                  <td className="px-4 py-2 text-slate-600">{rating !== null ? `${rating.toFixed(1)} / 5` : "—"}</td>
                  <td className="px-4 py-2 text-right">
                    {inf.status === "PUBLISHED" && (
                      <Link href={`/influencers/${inf.slug}`} className="mr-3 text-slate-500 hover:text-slate-900 hover:underline">View</Link>
                    )}
                    <Link href={`/admin/influencers/${inf.id}`} className="mr-3 text-slate-600 hover:text-slate-900 hover:underline">Edit</Link>
                    <ConfirmForm
                      action={deleteInfluencer.bind(null, inf.id)}
                      confirmMessage={`Delete "${inf.name}"? This can't be undone.`}
                      label="Delete"
                      className="text-red-600 hover:underline"
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
