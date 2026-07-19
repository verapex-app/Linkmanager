import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { links, websites } from "@/db/schema";
import { eq } from "drizzle-orm";
import { linkUpdateSchema } from "@/lib/validation";

interface Params {
  params: Promise<{ id: string }>;
}

async function revalidateForLink(linkId: number) {
  try {
    const [link] = await db
      .select({ websiteId: links.websiteId })
      .from(links)
      .where(eq(links.id, linkId))
      .limit(1);
    if (!link) return;
    const [website] = await db
      .select({ slug: websites.slug })
      .from(websites)
      .where(eq(websites.id, link.websiteId))
      .limit(1);
    if (website) {
      revalidatePath(`/api/public/websites/${website.slug}/links`);
    }
  } catch {
  }
}

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const linkId = Number(id);
    if (!Number.isInteger(linkId)) {
      return NextResponse.json({ error: "Invalid link id" }, { status: 400 });
    }

    const body = await request.json();
    const parsed = linkUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid input" },
        { status: 400 }
      );
    }

    const [updated] = await db
      .update(links)
      .set({ ...parsed.data, updatedAt: new Date() })
      .where(eq(links.id, linkId))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: "Link not found" }, { status: 404 });
    }

    revalidateForLink(updated.id).catch(() => {});

    return NextResponse.json({ link: updated });
  } catch (error) {
    console.error("Error updating link:", error);
    return NextResponse.json(
      { error: "Failed to update link" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const linkId = Number(id);
    if (!Number.isInteger(linkId)) {
      return NextResponse.json({ error: "Invalid link id" }, { status: 400 });
    }

    const [linkRow] = await db
      .select({ websiteId: links.websiteId })
      .from(links)
      .where(eq(links.id, linkId))
      .limit(1);

    const [deleted] = await db
      .delete(links)
      .where(eq(links.id, linkId))
      .returning();

    if (!deleted) {
      return NextResponse.json({ error: "Link not found" }, { status: 404 });
    }

    if (linkRow) {
      const [website] = await db
        .select({ slug: websites.slug })
        .from(websites)
        .where(eq(websites.id, linkRow.websiteId))
        .limit(1);
      if (website) {
        revalidatePath(`/api/public/websites/${website.slug}/links`);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting link:", error);
    return NextResponse.json(
      { error: "Failed to delete link" },
      { status: 500 }
    );
  }
}
