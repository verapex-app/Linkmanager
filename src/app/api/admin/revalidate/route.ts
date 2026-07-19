import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { websites } from "@/db/schema";

export async function POST() {
  try {
    const allWebsites = await db.select({ slug: websites.slug }).from(websites);
    for (const website of allWebsites) {
      revalidatePath(`/api/public/websites/${website.slug}/links`);
    }
    return NextResponse.json({ revalidated: true, count: allWebsites.length });
  } catch (error) {
    console.error("Error revalidating:", error);
    return NextResponse.json({ error: "Failed to revalidate" }, { status: 500 });
  }
}
