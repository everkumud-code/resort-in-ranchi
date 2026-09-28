import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireOwnerAccessForProperty } from "@/lib/auth/ownerAccess";
import OwnerDetailsForm from "./OwnerDetailsForm";
import OwnerFacilitiesForm from "./OwnerFacilitiesForm";
import OwnerVenueSpaces from "./OwnerVenueSpaces";
import OwnerImages from "./OwnerImages";
import OwnerCategories from "./OwnerCategories";

export const dynamic = "force-dynamic";

export default async function OwnerListingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const authorized = await requireOwnerAccessForProperty(id);
  if (!authorized) redirect("/owner");

  const [property, allFacilities, allCategories] = await Promise.all([
    prisma.property.findUnique({
      where: { id },
      include: {
        images: { orderBy: [{ isHero: "desc" }, { sortOrder: "asc" }] },
        venueSpaces: true,
        facilities: true,
        category: { select: { id: true, name: true } },
        extraCategories: { select: { categoryId: true } },
      },
    }),
    prisma.facility.findMany({ orderBy: { name: "asc" } }),
    prisma.category.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
  ]);
  if (!property) notFound();

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-8">
      <div>
        <Link href="/owner" className="text-sm text-brand-teal hover:underline">
          &larr; Back to dashboard
        </Link>
        <p className="mt-3 text-xs font-medium uppercase tracking-wide text-brand-teal">Your claim has been approved</p>
        <h1 className="font-serif text-2xl font-semibold text-brand-dark">{property.name}</h1>
        <p className="mt-1 text-sm text-brand/60">
          Changes save immediately and go live on your public listing. This does not change your listing&apos;s
          trust status — that stays Discovery unless our team separately verifies it.
        </p>
      </div>

      <OwnerDetailsForm property={property} />
      <div id="facilities" className="scroll-mt-24">
        <OwnerFacilitiesForm
          propertyId={property.id}
          allFacilities={allFacilities}
          selectedFacilityIds={property.facilities.map((f) => f.facilityId)}
        />
      </div>
      <div id="categories" className="scroll-mt-24">
        <OwnerCategories
          propertyId={property.id}
          tier={property.commercialTier}
          primaryCategoryName={property.category.name}
          primaryCategoryId={property.category.id}
          categories={allCategories}
          extraCategoryIds={property.extraCategories.map((e) => e.categoryId)}
        />
      </div>
      <div id="venue-spaces" className="scroll-mt-24">
        <OwnerVenueSpaces propertyId={property.id} venueSpaces={property.venueSpaces} />
      </div>
      <div id="photos" className="scroll-mt-24">
        <OwnerImages propertyId={property.id} images={property.images} />
      </div>

      <Link href="/owner" className="block text-center text-sm text-brand-teal hover:underline">
        &larr; Back to dashboard
      </Link>
    </div>
  );
}
