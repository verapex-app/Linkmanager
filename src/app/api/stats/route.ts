import { NextResponse } from "next/server";
import { db } from "@/db";
import { websites, links, apiRequests, linkClicks } from "@/db/schema";
import { and, eq, sql, gte, desc } from "drizzle-orm";

export async function GET() {
  try {
    const now = new Date();
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [
      totalWebsites,
      activeWebsites,
      totalLinks,
      activeWhatsapp,
      activeTelegram,
      inactiveLinks,
      totalClicks,
      clicks24h,
      clicks7d,
      totalRequests,
      requests24h,
      requests7d,
    ] = await Promise.all([
      db.select({ count: sql<number>`count(*)::int` }).from(websites),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(websites)
        .where(eq(websites.status, "active")),
      db.select({ count: sql<number>`count(*)::int` }).from(links),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(links)
        .where(and(eq(links.platform, "whatsapp"), eq(links.status, "active"))),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(links)
        .where(
          and(eq(links.platform, "telegram"), eq(links.status, "active"))
        ),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(links)
        .where(eq(links.status, "inactive")),
      db.select({ count: sql<number>`count(*)::int` }).from(linkClicks),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(linkClicks)
        .where(gte(linkClicks.clickedAt, last24h)),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(linkClicks)
        .where(gte(linkClicks.clickedAt, last7d)),
      db.select({ count: sql<number>`count(*)::int` }).from(apiRequests),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(apiRequests)
        .where(gte(apiRequests.requestedAt, last24h)),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(apiRequests)
        .where(gte(apiRequests.requestedAt, last7d)),
    ]);

    const topWebsitesByClicks = await db
      .select({
        websiteId: linkClicks.websiteId,
        name: websites.name,
        slug: websites.slug,
        clicks: sql<number>`count(*)::int`,
      })
      .from(linkClicks)
      .innerJoin(websites, eq(linkClicks.websiteId, websites.id))
      .where(gte(linkClicks.clickedAt, last7d))
      .groupBy(linkClicks.websiteId, websites.name, websites.slug)
      .orderBy(desc(sql`count(*)`))
      .limit(5);

    const topWebsitesByRequests = await db
      .select({
        websiteId: apiRequests.websiteId,
        name: websites.name,
        slug: websites.slug,
        requests: sql<number>`count(*)::int`,
      })
      .from(apiRequests)
      .innerJoin(websites, eq(apiRequests.websiteId, websites.id))
      .where(gte(apiRequests.requestedAt, last7d))
      .groupBy(apiRequests.websiteId, websites.name, websites.slug)
      .orderBy(desc(sql`count(*)`))
      .limit(5);

    return NextResponse.json({
      totalWebsites: totalWebsites[0].count,
      activeWebsites: activeWebsites[0].count,
      totalLinks: totalLinks[0].count,
      activeWhatsappLinks: activeWhatsapp[0].count,
      activeTelegramLinks: activeTelegram[0].count,
      inactiveLinks: inactiveLinks[0].count,
      clicks: {
        total: totalClicks[0].count,
        last24h: clicks24h[0].count,
        last7d: clicks7d[0].count,
      },
      requests: {
        total: totalRequests[0].count,
        last24h: requests24h[0].count,
        last7d: requests7d[0].count,
      },
      topWebsitesByClicks,
      topWebsitesByRequests,
    });
  } catch (error) {
    console.error("Error fetching stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch stats" },
      { status: 500 }
    );
  }
}
