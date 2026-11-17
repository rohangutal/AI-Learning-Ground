"use server";

import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { notes } from "@/lib/db/schema";
import { ensureUserExists } from "@/lib/db/queries";
import { eq, and, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { unstable_noStore as noStore } from "next/cache";

export async function getNotes() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  noStore();

  try {
    const dbNotes = await db
      .select()
      .from(notes)
      .where(eq(notes.userId, user.id))
      .orderBy(desc(notes.updatedAt));
      
    return dbNotes;
  } catch (err) {
    console.error("Failed to fetch notes from DB:", err);
    return [];
  }
}

export async function getNoteById(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  noStore();

  try {
    const [note] = await db
      .select()
      .from(notes)
      .where(and(eq(notes.id, id), eq(notes.userId, user.id)))
      .limit(1);
    return note || null;
  } catch (err) {
    console.error("Failed to fetch note by id:", err);
    return null;
  }
}

export async function createNoteAction(title: string, content: string, folderId?: string | null) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  await ensureUserExists(user);

  const sanitizedFolderId = folderId && typeof folderId === "string" && folderId.trim() !== "" ? folderId.trim() : null;

  try {
    const [newNote] = await db
      .insert(notes)
      .values({
        userId: user.id,
        title: title || "Untitled Note",
        content: content || "",
        folderId: sanitizedFolderId,
      })
      .returning();

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/notes");
    return newNote;
  } catch (err) {
    console.error("Failed to create note:", err);
    throw err;
  }
}

export async function updateNoteAction(id: string, title: string, content: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  try {
    const [updatedNote] = await db
      .update(notes)
      .set({
        title: title || "Untitled Note",
        content: content || "",
        updatedAt: new Date(),
      })
      .where(and(eq(notes.id, id), eq(notes.userId, user.id)))
      .returning();

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/notes");
    return updatedNote;
  } catch (err) {
    console.error("Failed to update note:", err);
    throw err;
  }
}

export async function deleteNoteAction(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  try {
    await db
      .delete(notes)
      .where(and(eq(notes.id, id), eq(notes.userId, user.id)));

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/notes");
    return { success: true };
  } catch (err) {
    console.error("Failed to delete note:", err);
    throw err;
  }
}

