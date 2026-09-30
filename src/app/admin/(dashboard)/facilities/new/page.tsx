import Link from "next/link";
import FacilityForm from "../FacilityForm";

export default function NewFacilityPage() {
  return (
    <div className="max-w-xl space-y-6">
      <div>
        <Link href="/admin/facilities" className="text-sm text-slate-500 hover:underline">
          ← Back to facilities
        </Link>
        <h1 className="mt-1 text-xl font-semibold text-slate-900">New facility</h1>
      </div>
      <div className="rounded-lg border border-slate-200 bg-panel-green p-6 shadow-sm">
        <FacilityForm />
      </div>
    </div>
  );
}
