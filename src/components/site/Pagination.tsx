import Link from "next/link";
import { buildQueryString, type QueryParam } from "@/lib/public/filters";

export default function Pagination({
  basePath,
  page,
  totalPages,
  params = {},
}: {
  basePath: string;
  page: number;
  totalPages: number;
  params?: Record<string, QueryParam>;
}) {
  if (totalPages <= 1) return null;

  return (
    <nav aria-label="Pagination" className="flex items-center justify-between text-sm text-brand-dark">
      <span className="text-brand/70">
        Page {page} of {totalPages}
      </span>
      <div className="flex gap-2">
        {page > 1 && (
          <Link
            href={`${basePath}${buildQueryString({ ...params, page: String(page - 1) })}`}
            className="rounded-md border border-brand/20 px-3 py-1.5 hover:border-brand hover:bg-brand-cream"
          >
            Previous
          </Link>
        )}
        {page < totalPages && (
          <Link
            href={`${basePath}${buildQueryString({ ...params, page: String(page + 1) })}`}
            className="rounded-md border border-brand/20 px-3 py-1.5 hover:border-brand hover:bg-brand-cream"
          >
            Next
          </Link>
        )}
      </div>
    </nav>
  );
}
