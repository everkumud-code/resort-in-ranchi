import Link from "next/link";
import { selectCardImage, type PublicPropertyCard } from "@/lib/public/properties";
import CardImage from "./CardImage";
import CompareCheckbox from "./CompareCheckbox";
import TrustBadge from "./TrustBadge";
import BadgePills from "./BadgePills";

/**
 * The outer element is a <div>, not the <Link> itself — CompareCheckbox
 * must be a SIBLING of the property link, never a descendant of it (a
 * checkbox inside an <a> is an invalid nested-interactive-control and
 * breaks keyboard/screen-reader navigation). The <div> carries the card's
 * visual chrome (border/hover/rounded) so the whole card still reads and
 * behaves as one clickable unit; the checkbox floats above it independently.
 */
export default function PropertyCard({ property, sponsored = false }: { property: PublicPropertyCard; sponsored?: boolean }) {
  const image = selectCardImage(property);

  return (
    <div className="relative overflow-hidden rounded-lg border border-brand/10 bg-white transition hover:border-brand/40 hover:shadow-md">
      <CompareCheckbox
        item={{
          slug: property.slug,
          name: property.name,
          thumbnailUrl: image.kind === "photo" ? image.url : null,
        }}
      />
      <Link href={`/property/${property.slug}`} className="block">
        <CardImage image={image} categorySlug={property.category.slug} name={property.name} />
        <div className="p-4">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-serif text-base font-semibold text-brand-dark">{property.name}</h3>
            {sponsored ? (
              <span className="shrink-0 rounded-full bg-brand/10 px-2 py-0.5 text-xs font-medium text-brand-dark">
                Sponsored
              </span>
            ) : (
              property.featured && (
                <span className="shrink-0 rounded-full bg-brand-gold/20 px-2 py-0.5 text-xs font-medium text-brand-gold">
                  Featured
                </span>
              )
            )}
          </div>
          <p className="mt-1 text-sm text-brand/70">
            {property.category.name}
            {property.locality ? ` · ${property.locality.name}` : ""}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <TrustBadge verificationStatus={property.verificationStatus} />
            {property.badges.length > 0 && <BadgePills badges={property.badges.map((b) => b.badge)} />}
          </div>
          {property.shortDescription && (
            <p className="mt-2 line-clamp-2 text-sm text-brand-dark/70">{property.shortDescription}</p>
          )}
          <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-brand/70">
            {property.googleRating && (
              <span className="text-brand-gold">
                ★ {property.googleRating.toFixed(1)}
                {property.reviewCount ? ` (${property.reviewCount})` : ""}
              </span>
            )}
            {property.priceLabel && <span>{property.priceLabel}</span>}
          </div>
        </div>
      </Link>
    </div>
  );
}
