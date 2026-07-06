import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { websites } from "@/db/schema";
import { eq, and, ne } from "drizzle-orm";
import { websiteUpdateSchema } from "@/lib/validation";

interface Params {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const websiteId = Number(id);
  if (!Number.isInteger(websiteId)) {
    return NextResponse.json({ error: "Invalid website id" }, { status: 400 });
  }

  const website = await db.query.websites.findFirst({
    where: eq(websites.id, websiteId),
    with: { links: true },
  });

  if (!website) {
    return NextResponse.json({ error: "Website not found" }, { status: 404 });
  }

  return NextResponse.json({ website });
}

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const websiteId = Number(id);
    if (!Number.isInteger(websiteId)) {
      return NextResponse.json({ error: "Invalid website id" }, { status: 400 });
    }

    const body = await request.json();
    const parsed = websiteUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid input" },
        { status: 400 }
      );
    }

    if (parsed.data.slug) {
      const existing = await db
        .select()
        .from(websites)
        .where(
          and(eq(websites.slug, parsed.data.slug), ne(websites.id, websiteId))
        )
        .limit(1);

      if (existing.length > 0) {
        return NextResponse.json(
          { error: "A website with this slug already exists" },
          { status: 409 }
        );
      }
    }

    const [updated] = await db
      .update(websites)
      .set({ ...parsed.data, updatedAt: new Date() })
      .where(eq(websites.id, websiteId))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: "Website not found" }, { status: 404 });
    }

    return NextResponse.json({ website: updated });
  } catch (error) {
    console.error("Error updating website:", error);
    return NextResponse.json(
      { error: "Failed to update website" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const websiteId = Number(id);
    if (!Number.isInteger(websiteId)) {
      return NextResponse.json({ error: "Invalid website id" }, { status: 400 });
    }

    const [deleted] = await db
      .delete(websites)
      .where(eq(websites.id, websiteId))
      .returning();

    if (!deleted) {
      return NextResponse.json({ error: "Website not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting website:", error);
    return NextResponse.json(
      { error: "Failed to delete website" },
      { status: 500 }
    );
  }
}
