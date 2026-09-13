import Link from "next/link";
import JsonLd from "./JsonLd";
import { breadcrumbJsonLd, type BreadcrumbItem } from "@/lib/public/structuredData";

export default function Breadcrumbs({ items }: { items: BreadcrumbItem[] }) {
  const withHome: BreadcrumbItem[] = [{ name: "Home", path: "/" }, ...items];

  return (
    <>
      <JsonLd data={breadcrumbJsonLd(withHome)} />
      <nav aria-label="Breadcrumb" className="text-sm text-brand/60">
        <ol className="flex flex-wrap items-center gap-1">
          {withHome.map((item, index) => (
            <li key={item.path} className="flex items-center gap-1">
              {index > 0 && <span aria-hidden="true">/</span>}
              {index === withHome.length - 1 ? (
                <span className="text-brand-dark">{item.name}</span>
              ) : (
                <Link href={item.path} className="hover:text-brand hover:underline">
                  {item.name}
                </Link>
              )}
            </li>
          ))}
        </ol>
      </nav>
    </>
  );
}
