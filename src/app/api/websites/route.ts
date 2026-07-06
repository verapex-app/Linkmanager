import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { websites, links } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { websiteSchema } from "@/lib/validation";

export async function GET() {
  try {
    const allWebsites = await db.query.websites.findMany({
      orderBy: desc(websites.createdAt),
      with: {
        links: true,
      },
    });

    return NextResponse.json({ websites: allWebsites });
  } catch (error) {
    console.error("Error fetching websites:", error);
    return NextResponse.json(
      { error: "Failed to fetch websites" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = websiteSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid input" },
        { status: 400 }
      );
    }

    const existing = await db
      .select()
      .from(websites)
      .where(eq(websites.slug, parsed.data.slug))
      .limit(1);

    if (existing.length > 0) {
      return NextResponse.json(
        { error: "A website with this slug already exists" },
        { status: 409 }
      );
    }

    const [created] = await db
      .insert(websites)
      .values({
        name: parsed.data.name,
        slug: parsed.data.slug,
        domain: parsed.data.domain || null,
        status: parsed.data.status,
      })
      .returning();

    return NextResponse.json({ website: created }, { status: 201 });
  } catch (error) {
    console.error("Error creating website:", error);
    return NextResponse.json(
      { error: "Failed to create website" },
      { status: 500 }
    );
  }
}
