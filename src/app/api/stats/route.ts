import { NextResponse } from "next/server";
import { db } from "@/db";
import { websites, links } from "@/db/schema";
import { and, eq, sql } from "drizzle-orm";

export async function GET() {
  try {
    const [totalWebsites] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(websites);

    const [activeWebsites] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(websites)
      .where(eq(websites.status, "active"));

    const [totalLinks] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(links);

    const [activeWhatsapp] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(links)
      .where(and(eq(links.platform, "whatsapp"), eq(links.status, "active")));

    const [activeTelegram] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(links)
      .where(and(eq(links.platform, "telegram"), eq(links.status, "active")));

    const [inactiveLinks] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(links)
      .where(eq(links.status, "inactive"));

    return NextResponse.json({
      totalWebsites: totalWebsites.count,
      activeWebsites: activeWebsites.count,
      totalLinks: totalLinks.count,
      activeWhatsappLinks: activeWhatsapp.count,
      activeTelegramLinks: activeTelegram.count,
      inactiveLinks: inactiveLinks.count,
    });
  } catch (error) {
    console.error("Error fetching stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch stats" },
      { status: 500 }
    );
  }
}
