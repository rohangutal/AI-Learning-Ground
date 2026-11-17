import { db } from "@/lib/db";
import { notes, folders, users } from "@/lib/db/schema";
import { eq, desc, and } from "drizzle-orm";

export async function ensureUserExists(user: { id: string; email?: string | null; user_metadata?: Record<string, any> }) {
  if (!user || !user.id) return;
  try {
    const existing = await db.select({ id: users.id }).from(users).where(eq(users.id, user.id)).limit(1);
    if (existing.length === 0) {
      await db.insert(users).values({
        id: user.id,
        email: user.email || `${user.id}@example.com`,
        fullName: user.user_metadata?.full_name || user.user_metadata?.name || "User",
        avatarUrl: user.user_metadata?.avatar_url || "",
        createdAt: new Date(),
        updatedAt: new Date(),
      }).onConflictDoUpdate({
        target: users.id,
        set: {
          email: user.email || `${user.id}@example.com`,
          fullName: user.user_metadata?.full_name || user.user_metadata?.name || "User",
          updatedAt: new Date(),
        }
      });
    }
  } catch (err) {
    console.error("Failed to ensure user exists in DB:", err);
  }
}

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

export async function createNote(userId: string, title: string, content: string, folderId?: string | null) {
  const sanitizedFolderId = folderId && typeof folderId === "string" && folderId.trim() !== "" ? folderId.trim() : null;
  const result = await db.insert(notes).values({
    userId,
    title: title || "Untitled Note",
    content: content || "",
    folderId: sanitizedFolderId,
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

