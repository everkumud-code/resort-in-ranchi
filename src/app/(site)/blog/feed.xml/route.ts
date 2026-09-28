import { listPublishedPosts } from "@/lib/blog/queries";
import { buildRssFeed } from "@/lib/blog/rss";
import { SITE_NAME, SITE_URL } from "@/lib/public/site";

export const revalidate = 600;

/** RSS feed of published blog posts — lets feed readers and aggregators discover new posts. */
export async function GET() {
  const posts = await listPublishedPosts({ take: 50 });
  const xml = buildRssFeed({
    title: `${SITE_NAME} blog`,
    description: "Guides and ideas for stays, dining and celebrations in and around Ranchi.",
    siteUrl: SITE_URL,
    posts,
  });
  return new Response(xml, {
    headers: { "Content-Type": "application/rss+xml; charset=utf-8", "Cache-Control": "public, max-age=600" },
  });
}
