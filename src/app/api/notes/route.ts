import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { notes } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return new Response("Unauthorized", { status: 401 });
    }

    const userNotes = await db
      .select()
      .from(notes)
      .where(eq(notes.userId, user.id))
      .orderBy(desc(notes.updatedAt));

    return NextResponse.json(userNotes);
  } catch (error: any) {
    console.error("GET /api/notes error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return new Response("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const { title, content, folderId } = body;

    const [newNote] = await db
      .insert(notes)
      .values({
        userId: user.id,
        title: title || "Untitled Note",
        content: content || "",
        folderId: folderId || null,
      })
      .returning();

    return NextResponse.json(newNote);
  } catch (error: any) {
    console.error("POST /api/notes error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
