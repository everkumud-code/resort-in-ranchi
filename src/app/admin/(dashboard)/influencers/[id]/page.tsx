import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import InfluencerForm from "../InfluencerForm";
import RatingsPanel from "../RatingsPanel";

export const dynamic = "force-dynamic";

export default async function EditInfluencerPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string }>;
}) {
  const { id } = await params;
  const { saved } = await searchParams;

  const [influencer, criteria] = await Promise.all([
    prisma.influencer.findUnique({ where: { id }, include: { ratings: true } }),
    prisma.influencerCriterion.findMany({ orderBy: { order: "asc" } }),
  ]);
  if (!influencer) notFound();

  const scoresByCriterion = Object.fromEntries(influencer.ratings.map((r) => [r.criterionId, r.score]));

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/influencers" className="text-sm text-slate-500 hover:underline">← Back to influencers</Link>
        <h1 className="mt-1 text-xl font-semibold text-slate-900">Edit influencer</h1>
      </div>
      {saved === "1" && <p className="rounded-md bg-green-50 px-3 py-2 text-sm text-green-700">Changes saved.</p>}

      <InfluencerForm influencer={influencer} />

      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-900">Editorial ratings</h2>
        <p className="mt-1 text-xs text-slate-500">Admin-set scores (1–5) per criterion — never a public/crowd-sourced review.</p>
        <div className="mt-3">
          <RatingsPanel influencerId={influencer.id} criteria={criteria} scoresByCriterion={scoresByCriterion} />
        </div>
      </div>
    </div>
  );
}
