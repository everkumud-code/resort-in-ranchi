import Link from "next/link";
import BadgeForm from "../BadgeForm";

export const dynamic = "force-dynamic";

export default function NewBadgePage() {
  return (
    <div className="max-w-xl space-y-6">
      <div>
        <Link href="/admin/badges" className="text-sm text-slate-500 hover:underline">
          ← Back to badges
        </Link>
        <h1 className="mt-1 text-xl font-semibold text-slate-900">New badge</h1>
      </div>
      <div className="rounded-lg border border-slate-200 bg-panel-green p-6 shadow-sm">
        <BadgeForm />
      </div>
    </div>
  );
}
