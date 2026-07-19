import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { websites, links, linkClicks, platformEnum } from "@/db/schema";
import { and, eq, desc } from "drizzle-orm";

type PlatformValue = typeof platformEnum.enumValues[number];

interface Params {
  params: Promise<{ slug: string; platform: string }>;
}

export async function GET(request: NextRequest, { params }: Params) {
  const { slug, platform } = await params;

  const website = await db
    .select()
    .from(websites)
    .where(and(eq(websites.slug, slug), eq(websites.status, "active")))
    .limit(1);

  if (website.length === 0) {
    return NextResponse.json({ error: "Website not found" }, { status: 404 });
  }

  const validPlatforms = [
    "whatsapp",
    "telegram",
    "signal",
    "messenger",
    "instagram",
    "discord",
    "other",
  ];
  if (!validPlatforms.includes(platform)) {
    return NextResponse.json({ error: "Invalid platform" }, { status: 400 });
  }

  const platformValue = platform as PlatformValue;

  const activeLinks = await db
    .select()
    .from(links)
    .where(
      and(
        eq(links.websiteId, website[0].id),
        eq(links.platform, platformValue),
        eq(links.status, "active")
      )
    )
    .orderBy(desc(links.priority))
    .limit(1);

  if (activeLinks.length === 0) {
    return NextResponse.json(
      { error: "No active link for this platform" },
      { status: 404 }
    );
  }

  const link = activeLinks[0];

  db.insert(linkClicks)
    .values({
      linkId: link.id,
      websiteId: website[0].id,
      platform: platformValue,
    })
    .catch(() => {});

  return NextResponse.redirect(link.url, { status: 302 });
}
