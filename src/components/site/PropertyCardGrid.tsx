import PropertyCard from "./PropertyCard";
import type { PublicPropertyCard } from "@/lib/public/properties";
import type { PinnedEntry } from "@/lib/public/pinnedListing";

/** The standard browse grid; entries flagged `pinned` are rendered with a "Sponsored" label. */
export default function PropertyCardGrid({
  entries,
  className = "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3",
}: {
  entries: PinnedEntry<PublicPropertyCard>[];
  className?: string;
}) {
  return (
    <div className={className}>
      {entries.map((entry) => (
        <PropertyCard key={entry.key} property={entry.property} sponsored={entry.pinned} />
      ))}
    </div>
  );
}
