import Link from "next/link";
import CategoryIcon from "./CategoryIcon";

export default function CategoryCard({
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
      href={`/${slug}`}
      className="group block rounded-lg border border-brand/10 bg-white p-5 text-center transition hover:border-brand/40 hover:shadow-md"
    >
      <CategoryIcon
        slug={slug}
        className="mx-auto h-7 w-7 text-brand-olive transition group-hover:text-brand-orange"
      />
      <p className="mt-3 font-serif font-semibold text-brand-dark">{name}</p>
      <p className="mt-1 text-xs text-brand/60">
        {count} {count === 1 ? "listing" : "listings"}
      </p>
    </Link>
  );
}
