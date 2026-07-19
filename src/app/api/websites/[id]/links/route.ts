import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { links, websites } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { linkSchema } from "@/lib/validation";

interface Params {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const websiteId = Number(id);
  if (!Number.isInteger(websiteId)) {
    return NextResponse.json({ error: "Invalid website id" }, { status: 400 });
  }

  const websiteLinks = await db
    .select()
    .from(links)
    .where(eq(links.websiteId, websiteId))
    .orderBy(desc(links.priority), desc(links.createdAt));

  return NextResponse.json({ links: websiteLinks });
}

export async function POST(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const websiteId = Number(id);
    if (!Number.isInteger(websiteId)) {
      return NextResponse.json({ error: "Invalid website id" }, { status: 400 });
    }

    const website = await db
      .select()
      .from(websites)
      .where(eq(websites.id, websiteId))
      .limit(1);

    if (website.length === 0) {
      return NextResponse.json({ error: "Website not found" }, { status: 404 });
    }

    const body = await request.json();
    const parsed = linkSchema.safeParse({ ...body, websiteId });

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid input" },
        { status: 400 }
      );
    }

    const [created] = await db
      .insert(links)
      .values({
        websiteId,
        platform: parsed.data.platform,
        name: parsed.data.name,
        url: parsed.data.url,
        status: parsed.data.status,
        priority: parsed.data.priority,
        notes: parsed.data.notes || null,
      })
      .returning();

    revalidatePath(`/api/public/websites/${website[0].slug}/links`);

    return NextResponse.json({ link: created }, { status: 201 });
  } catch (error) {
    console.error("Error creating link:", error);
    return NextResponse.json(
      { error: "Failed to create link" },
      { status: 500 }
    );
  }
}
