import type { VenueSpace } from "@prisma/client";
import VenueSpaceRow from "./VenueSpaceRow";
import AddVenueSpaceForm from "./AddVenueSpaceForm";

export default function PropertyVenueSpacesPanel({
  propertyId,
  venueSpaces,
}: {
  propertyId: string;
  venueSpaces: VenueSpace[];
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-panel-green p-4 shadow-sm">
      <h2 className="text-sm font-semibold text-slate-900">Venue spaces ({venueSpaces.length})</h2>

      {venueSpaces.length === 0 ? (
        <p className="mt-2 text-sm text-slate-400">No venue spaces linked to this property.</p>
      ) : (
        <div className="mt-3">
          {venueSpaces.map((vs) => (
            <VenueSpaceRow key={vs.id} venueSpace={vs} />
          ))}
        </div>
      )}

      <div className="mt-4">
        <AddVenueSpaceForm propertyId={propertyId} />
      </div>
    </div>
  );
}
