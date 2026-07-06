import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { websites, links } from "@/db/schema";
import { and, eq, desc } from "drizzle-orm";

interface Params {
  params: Promise<{ slug: string }>;
}

/**
 * Public API: GET /api/public/websites/[slug]/links
 *
 * Returns the active links for a website, grouped by platform. For platforms
 * with multiple active links, the one with the highest priority wins.
 *
 * Response shape:
 * {
 *   "website": "website-a",
 *   "whatsapp": "https://wa.me/123456789" | null,
 *   "telegram": "https://t.me/example" | null
 * }
 */
export async function GET(request: NextRequest, { params }: Params) {
  const { slug } = await params;

  const website = await db
    .select()
    .from(websites)
    .where(and(eq(websites.slug, slug), eq(websites.status, "active")))
    .limit(1);

  if (website.length === 0) {
    return NextResponse.json(
      { error: "Website not found or inactive" },
      { status: 404 }
    );
  }

  const activeLinks = await db
    .select()
    .from(links)
    .where(and(eq(links.websiteId, website[0].id), eq(links.status, "active")))
    .orderBy(desc(links.priority));

  const topByPlatform: Record<string, string> = {};
  for (const link of activeLinks) {
    if (!(link.platform in topByPlatform)) {
      topByPlatform[link.platform] = link.url;
    }
  }

  return NextResponse.json(
    {
      website: website[0].slug,
      whatsapp: topByPlatform.whatsapp || null,
      telegram: topByPlatform.telegram || null,
      ...topByPlatform,
    },
    {
      headers: {
        // Allow shared/CDN caches (Vercel's Data Cache/CDN, browsers) to serve
        // this response for 60s without hitting this server or the consuming
        // site's serverless function, and keep serving a stale copy for up to
        // 5 minutes while a fresh copy is fetched in the background. This is
        // the main lever for cutting down invocations on the consuming
        // (Vercel free-tier) sites — see replit.md for the full guidance.
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
      },
    }
  );
}
