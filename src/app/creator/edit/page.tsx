import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCreatorAccessInfluencerId } from "@/lib/auth/creatorAccess";
import CreatorProfileForm from "./CreatorProfileForm";

export const dynamic = "force-dynamic";

export default async function EditCreatorProfilePage() {
  const influencerId = await getCreatorAccessInfluencerId();
  if (!influencerId) redirect("/creator");

  const influencer = await prisma.influencer.findUnique({ where: { id: influencerId } });
  if (!influencer) redirect("/creator");

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <Link href="/creator" className="text-sm text-brand-teal hover:underline">
        &larr; Back to dashboard
      </Link>
      <h1 className="mt-3 font-serif text-2xl font-semibold text-brand-dark">Edit your profile</h1>
      <p className="mt-1 text-sm text-brand/60">Changes save immediately and go live on your public profile.</p>

      <div className="mt-6 rounded-lg border border-brand/10 bg-white p-5">
        <CreatorProfileForm influencer={influencer} />
      </div>
    </div>
  );
}
