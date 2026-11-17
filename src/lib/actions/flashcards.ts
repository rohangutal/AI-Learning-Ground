"use server";

import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { flashcards, notes } from "@/lib/db/schema";
import { ensureUserExists } from "@/lib/db/queries";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { unstable_noStore as noStore } from "next/cache";
import { generateFlashcards as generateAI } from "@/lib/ai/engine";
import { generateEmbedding } from "@/lib/ai/embeddings";

export async function getFlashcards() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  noStore();

  try {
    return await db
      .select()
      .from(flashcards)
      .where(eq(flashcards.userId, user.id))
      .orderBy(flashcards.createdAt);
  } catch (err) {
    console.error("Failed to fetch flashcards from database, falling back to empty list:", err);
    return [];
  }
}

export async function generateFlashcardsAction(topic: string, count = 5) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  await ensureUserExists(user);

  // Generate cards via AI
  const generated = await generateAI(topic, { userId: user.id, count });

  const results = [];
  for (const card of generated) {
    let embedding: number[] | null = null;
    try {
      embedding = await generateEmbedding(`${card.front} ${card.back}`);
    } catch (err) {
      console.error("Failed to generate embedding for card:", err);
    }

    try {
      const [inserted] = await db
        .insert(flashcards)
        .values({
          userId: user.id,
          front: card.front,
          back: card.back,
          embedding,
        })
        .returning();
      results.push(inserted);
    } catch (err) {
      console.error("Failed to insert card to DB, returning in-memory only:", err);
      // Fallback for paused DB: return transient card with mock ID
      results.push({
        id: Math.random().toString(),
        userId: user.id,
        noteId: null,
        front: card.front,
        back: card.back,
        embedding: null,
        nextReviewDate: new Date(),
        interval: 0,
        easeFactor: 250,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }
  }

  revalidatePath("/dashboard/flashcards");
  return results;
}

export async function reviewFlashcardAction(cardId: string, grade: "again" | "good" | "easy") {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  try {
    // Fetch the current card parameters
    const [card] = await db
      .select()
      .from(flashcards)
      .where(and(eq(flashcards.id, cardId), eq(flashcards.userId, user.id)))
      .limit(1);

    if (!card) {
      return { error: "Flashcard not found" };
    }

    let interval = card.interval;
    let easeFactor = card.easeFactor;

    if (grade === "again") {
      interval = 0;
      easeFactor = Math.max(130, easeFactor - 20);
    } else if (grade === "good") {
      if (interval === 0) {
        interval = 1;
      } else if (interval === 1) {
        interval = 3;
      } else {
        interval = Math.round(interval * (easeFactor / 100));
      }
    } else if (grade === "easy") {
      if (interval === 0) {
        interval = 3;
      } else if (interval === 1) {
        interval = 5;
      } else {
        interval = Math.round(interval * (easeFactor / 100) * 1.5);
      }
      easeFactor = Math.min(300, easeFactor + 15);
    }

    const nextReviewDate = new Date();
    nextReviewDate.setDate(nextReviewDate.getDate() + (interval === 0 ? 1 : interval));

    await db
      .update(flashcards)
      .set({
        interval,
        easeFactor,
        nextReviewDate,
        updatedAt: new Date(),
      })
      .where(eq(flashcards.id, cardId));
  } catch (err) {
    console.error("Failed to update flashcard review status:", err);
    // Silent fail for in-memory/transient cards
  }

  revalidatePath("/dashboard/flashcards");
}

export async function deleteFlashcardAction(cardId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  try {
    await db
      .delete(flashcards)
      .where(and(eq(flashcards.id, cardId), eq(flashcards.userId, user.id)));
  } catch (err) {
    console.error("Failed to delete flashcard:", err);
  }

  revalidatePath("/dashboard/flashcards");
}

export async function createFlashcardAction(front: string, back: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  let embedding: number[] | null = null;
  try {
    embedding = await generateEmbedding(`${front} ${back}`);
  } catch (err) {
    console.error("Failed to generate embedding for custom flashcard:", err);
  }

  try {
    const [inserted] = await db
      .insert(flashcards)
      .values({
        userId: user.id,
        front,
        back,
        embedding,
      })
      .returning();
    revalidatePath("/dashboard/flashcards");
    return inserted;
  } catch (err) {
    console.error("Failed to create custom flashcard:", err);
    throw err;
  }
}

export async function generateFlashcardsFromNoteAction(noteId: string, count = 5) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  let noteTitle = "Study Note Cards";
  let noteContent = "";

  try {
    const [dbNote] = await db
      .select()
      .from(notes)
      .where(and(eq(notes.id, noteId), eq(notes.userId, user.id)))
      .limit(1);
    if (dbNote) {
      noteTitle = dbNote.title;
      noteContent = dbNote.content || "";
    }
  } catch (err) {
    console.error("Failed to load note from DB for flashcards:", err);
  }

  if (!noteContent) {
    throw new Error("Note content is empty or not found.");
  }

  // Generate cards via AI using the note content as context
  const generated = await generateAI(noteTitle, { userId: user.id, count, context: noteContent } as any);

  const results = [];
  for (const card of generated) {
    let embedding: number[] | null = null;
    try {
      embedding = await generateEmbedding(`${card.front} ${card.back}`);
    } catch (err) {
      console.error("Failed to generate embedding for card:", err);
    }

    try {
      const [inserted] = await db
        .insert(flashcards)
        .values({
          userId: user.id,
          noteId: noteId,
          front: card.front,
          back: card.back,
          embedding,
        })
        .returning();
      results.push(inserted);
    } catch (err) {
      console.error("Failed to insert card to DB:", err);
    }
  }

  revalidatePath("/dashboard/flashcards");
  return results;
}
