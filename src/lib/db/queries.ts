import { db } from "@/lib/db";
import { notes, folders, users } from "@/lib/db/schema";
import { eq, desc, and } from "drizzle-orm";

export async function getUserProfile(userId: string) {
  const result = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  return result[0] || null;
}

export async function getNotesForUser(userId: string, folderId?: string) {
  if (folderId) {
    return db
      .select()
      .from(notes)
      .where(and(eq(notes.userId, userId), eq(notes.folderId, folderId)))
      .orderBy(desc(notes.updatedAt));
  }
  
  return db
    .select()
    .from(notes)
    .where(eq(notes.userId, userId))
    .orderBy(desc(notes.updatedAt));
}

export async function getFoldersForUser(userId: string) {
  return db
    .select()
    .from(folders)
    .where(eq(folders.userId, userId))
    .orderBy(desc(folders.createdAt));
}

export async function createNote(userId: string, title: string, content: string, folderId?: string) {
  const result = await db.insert(notes).values({
    userId,
    title,
    content,
    folderId,
  }).returning();
  return result[0];
}

export async function createFolder(userId: string, name: string) {
  const result = await db.insert(folders).values({
    userId,
    name,
  }).returning();
  return result[0];
}
