import Link from "next/link";

export default function LocationCard({
  name,
  slug,
  count,
}: {
  name: string;
  slug: string;
  count: number;
}) {
  return (
    <Link
      href={`/locations/${slug}`}
      className="group relative overflow-hidden rounded-lg border border-brand/10 bg-white p-4 transition hover:border-brand/40 hover:shadow-md"
    >
      <span className="absolute top-0 left-0 h-full w-1 bg-brand-teal/60 transition group-hover:bg-brand-orange" />
      <p className="font-serif font-semibold text-brand-dark">{name}</p>
      <p className="mt-1 text-xs text-brand/60">
        {count > 0 ? `${count} ${count === 1 ? "listing" : "listings"}` : "Explore area"}
      </p>
    </Link>
  );
}
