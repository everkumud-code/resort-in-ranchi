import Link from "next/link";
import InfluencerForm from "../InfluencerForm";

export const dynamic = "force-dynamic";

export default function NewInfluencerPage() {
  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/influencers" className="text-sm text-slate-500 hover:underline">← Back to influencers</Link>
        <h1 className="mt-1 text-xl font-semibold text-slate-900">New influencer</h1>
      </div>
      <InfluencerForm />
    </div>
  );
}
