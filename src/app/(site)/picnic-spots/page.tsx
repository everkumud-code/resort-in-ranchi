import type { Metadata } from "next";
import { UMBRELLA_CATEGORY_ROUTES } from "@/lib/public/categoryRoutes";
import { loadUmbrellaCategoryData } from "@/lib/public/umbrellaQueries";
import { buildPageMetadata } from "@/lib/public/seo";
import UmbrellaCategoryView from "@/components/site/UmbrellaCategoryView";

const ROUTE = UMBRELLA_CATEGORY_ROUTES["picnic-spots"];

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}): Promise<Metadata> {
  const sp = await searchParams;
  const data = await loadUmbrellaCategoryData(ROUTE, sp.page);
  return buildPageMetadata({
    title: ROUTE.title,
    description: ROUTE.intro,
    path: `/${ROUTE.slug}`,
    noindex: data.totalCount === 0,
  });
}

export default async function PicnicSpotsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const sp = await searchParams;
  const data = await loadUmbrellaCategoryData(ROUTE, sp.page);
  return <UmbrellaCategoryView route={ROUTE} data={data} />;
}
