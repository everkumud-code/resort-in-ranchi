import Link from "next/link";
import { prisma } from "@/lib/prisma";
import EventForm from "../EventForm";

export const dynamic = "force-dynamic";

export default async function NewEventPage() {
  const [locations, properties] = await Promise.all([
    prisma.location.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.property.findMany({ where: { status: "PUBLISHED" }, orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/events" className="text-sm text-slate-500 hover:underline">← Back to events</Link>
        <h1 className="mt-1 text-xl font-semibold text-slate-900">New event</h1>
      </div>
      <EventForm locations={locations} properties={properties} />
    </div>
  );
}
