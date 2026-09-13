import type { PropertyImage } from "@prisma/client";
import PropertyImageRow from "./PropertyImageRow";
import AddPropertyImageForm from "./AddPropertyImageForm";

export default function PropertyImagesPanel({ propertyId, images }: { propertyId: string; images: PropertyImage[] }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <h2 className="text-sm font-semibold text-slate-900">Images ({images.length})</h2>

      {images.length === 0 ? (
        <p className="mt-2 text-sm text-slate-400">No images yet.</p>
      ) : (
        <div className="mt-3">
          {images.map((image) => (
            <PropertyImageRow key={image.id} image={image} />
          ))}
        </div>
      )}

      <div className="mt-4">
        <AddPropertyImageForm propertyId={propertyId} />
      </div>
    </div>
  );
}
