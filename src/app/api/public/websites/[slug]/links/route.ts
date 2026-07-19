import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { websites, links, apiRequests } from "@/db/schema";
import { and, eq, desc } from "drizzle-orm";

interface Params {
  params: Promise<{ slug: string }>;
}

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

  db.insert(apiRequests)
    .values({ websiteId: website[0].id })
    .catch(() => {});

  return NextResponse.json(
    {
      website: website[0].slug,
      whatsapp: topByPlatform.whatsapp || null,
      telegram: topByPlatform.telegram || null,
      ...topByPlatform,
    },
    {
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
      },
    }
  );
}
