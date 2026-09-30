import Link from "next/link";
import DashboardTile from "@/components/site/DashboardTile";
import { getCreatorAccessInfluencerId } from "@/lib/auth/creatorAccess";
import { prisma } from "@/lib/prisma";
import { averageInfluencerRating } from "@/lib/influencers";
import { logoutCreator } from "./actions";
import ShareButtons from "@/components/site/ShareButtons";
import { absoluteUrl } from "@/lib/public/site";

export const dynamic = "force-dynamic";

interface PageSearchParams {
  error?: string;
}

const ERROR_MESSAGES: Record<string, string> = {
  "missing-token": "That link is missing its access code. Please use the full link exactly as it was shared with you.",
  "invalid-token": "That link has already been used, has expired, or is no longer valid. Ask us to approve a fresh claim to get a new one.",
};

function AccessInstructions({ errorMessage }: { errorMessage?: string }) {
  return (
    <div className="mx-auto max-w-xl px-4 py-16">
      <h1 className="text-center font-serif text-2xl font-semibold text-brand-dark">Creator login</h1>
      {errorMessage ? (
        <p className="mt-3 rounded-md bg-amber-50 px-3 py-2 text-center text-sm text-amber-800" role="alert">
          {errorMessage}
        </p>
      ) : (
        <p className="mt-3 text-center text-sm text-brand/70">
          Use the one-time access link sent to you after your creator profile claim was approved.
        </p>
      )}

      <div className="mt-8 rounded-lg border border-brand/10 bg-white p-5 shadow-sm">
        <p className="font-medium text-brand-dark">How creator access works</p>
        <ol className="mt-3 space-y-3 text-sm leading-6 text-brand-dark/75">
          <li>
            <span className="font-semibold text-brand-dark">1. Find your profile</span> — search{" "}
            <Link href="/influencers" className="text-brand-teal hover:underline">
              Ranchi Creators &amp; Influencers
            </Link>{" "}
            for your name and open it.
          </li>
          <li>
            <span className="font-semibold text-brand-dark">2. Claim it</span> — use &quot;Claim this profile&quot; on your page. Not listed yet?{" "}
            <Link href="/contact" className="text-brand-teal hover:underline">
              Contact us
            </Link>{" "}
            to get added.
          </li>
          <li>
            <span className="font-semibold text-brand-dark">3. We review your claim</span> — once approved, we
            send you a private access link. It works once, so keep the browser you open it in.
          </li>
          <li>
            <span className="font-semibold text-brand-dark">4. Manage your profile</span> — add your photo,
            feature video, bio, social links and contact details, share your profile link, and see + reply to
            people who contact you. You stay signed in for about 3 months.
          </li>
        </ol>
      </div>
    </div>
  );
}

export default async function CreatorDashboardPage({ searchParams }: { searchParams: Promise<PageSearchParams> }) {
  const influencerId = await getCreatorAccessInfluencerId();
  if (!influencerId) {
    const { error } = await searchParams;
    return <AccessInstructions errorMessage={error ? ERROR_MESSAGES[error] : undefined} />;
  }

  const [influencer, totalEnquiries, newEnquiries] = await Promise.all([
    prisma.influencer.findUnique({
      where: { id: influencerId },
      include: { ratings: { select: { score: true, criterionId: true } } },
    }),
    prisma.influencerEnquiry.count({ where: { influencerId } }),
    prisma.influencerEnquiry.count({ where: { influencerId, status: "NEW" } }),
  ]);
  if (!influencer) return <AccessInstructions />;

  const rating = averageInfluencerRating(influencer.ratings);
  const profileUrl = absoluteUrl(`/influencers/${influencer.slug}`);

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <p className="text-xs font-medium uppercase tracking-wide text-brand-teal">Creator dashboard</p>
      <h1 className="mt-1 font-serif text-2xl font-semibold text-brand-dark sm:text-3xl">{influencer.name}</h1>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-brand/10 px-2.5 py-0.5 text-xs font-medium text-brand-dark/60">
          {influencer.status === "PUBLISHED" ? "Live on the public site" : "Not currently live"}
        </span>
        {influencer.featured && (
          <span className="rounded-full bg-brand-orange/15 px-2.5 py-0.5 text-xs font-medium text-brand-orange">Featured</span>
        )}
        {rating !== null && <span className="rounded-full bg-brand-gold/15 px-2.5 py-0.5 text-xs font-medium text-brand-gold">★ {rating.toFixed(1)} / 5</span>}
      </div>

      <p className="mt-4 text-sm leading-6 text-brand-dark/70">
        From here you can update your photo, feature video, bio, social links and contact details, share your
        profile with others, and see people who&apos;ve contacted you. Featured status and your editorial rating
        stay a separate decision made by our team.
      </p>

      <div className="mt-6 rounded-lg border border-brand/10 bg-white p-4 shadow-sm">
        <p className="font-medium text-brand-dark">Your public profile</p>
        <p className="mt-1 break-all text-sm text-brand-teal">{profileUrl}</p>
        <ShareButtons url={profileUrl} title={influencer.name} />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <DashboardTile
          href="/creator/edit"
          title="Edit profile"
          description="Photo, video, bio, category, social links."
          gradient="from-blue-500 to-indigo-600"
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
              <path d="M12 20h9" />
              <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
            </svg>
          }
        />
        <DashboardTile
          href="/creator/enquiries"
          title="Messages"
          description={totalEnquiries > 0 ? `${totalEnquiries} received so far.` : "No messages yet."}
          badge={newEnquiries > 0 ? `${newEnquiries} new` : undefined}
          gradient="from-rose-500 to-red-600"
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
              <rect x="3" y="5" width="18" height="14" rx="2" />
              <path d="M3 7l9 6 9-6" />
            </svg>
          }
        />
        {influencer.status === "PUBLISHED" && (
          <DashboardTile
            href={`/influencers/${influencer.slug}`}
            title="View public profile"
            description="See it exactly as visitors see it."
            gradient="from-emerald-500 to-teal-600"
            icon={
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            }
          />
        )}
      </div>

      <form action={logoutCreator} className="mt-8 text-center">
        <button type="submit" className="text-sm text-brand/60 hover:text-brand-dark hover:underline">
          Sign out
        </button>
      </form>
    </div>
  );
}
