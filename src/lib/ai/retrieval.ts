import { db } from "../db";
import { notes, flashcards } from "../db/schema";
import { and, eq, sql } from "drizzle-orm";
import { generateEmbedding } from "./embeddings";

export interface SemanticSearchResult {
  id: string;
  title: string;
  content: string | null;
  similarity: number;
}

export interface FlashcardSearchResult {
  id: string;
  front: string;
  back: string;
  similarity: number;
}

/**
 * Find notes that are semantically similar to a query embedding
 */
export async function findSimilarNotes(
  userId: string,
  embedding: number[],
  limit = 5
): Promise<SemanticSearchResult[]> {
  const vectorStr = `[${embedding.join(",")}]`;
  
  // Cosine similarity = 1 - Cosine Distance
  // In pgvector, <=> is cosine distance
  const similaritySql = sql<number>`1 - (${notes.embedding} <=> ${vectorStr})`;
  
  const results = await db
    .select({
      id: notes.id,
      title: notes.title,
      content: notes.content,
      similarity: similaritySql,
    })
    .from(notes)
    .where(
      and(
        eq(notes.userId, userId),
        sql`${notes.embedding} IS NOT NULL`
      )
    )
    .orderBy(sql`${notes.embedding} <=> ${vectorStr}`)
    .limit(limit);

  return results;
}

/**
 * Find flashcards that are semantically similar to a query embedding
 */
export async function findSimilarFlashcards(
  userId: string,
  embedding: number[],
  limit = 5
): Promise<FlashcardSearchResult[]> {
  const vectorStr = `[${embedding.join(",")}]`;
  const similaritySql = sql<number>`1 - (${flashcards.embedding} <=> ${vectorStr})`;

  const results = await db
    .select({
      id: flashcards.id,
      front: flashcards.front,
      back: flashcards.back,
      similarity: similaritySql,
    })
    .from(flashcards)
    .where(
      and(
        eq(flashcards.userId, userId),
        sql`${flashcards.embedding} IS NOT NULL`
      )
    )
    .orderBy(sql`${flashcards.embedding} <=> ${vectorStr}`)
    .limit(limit);

  return results;
}

/**
 * Generate context for RAG by retrieving semantically relevant study notes
 */
export async function retrieveRAGContext(
  userId: string,
  query: string,
  limit = 3
): Promise<string> {
  try {
    const embedding = await generateEmbedding(query);
    const similarNotes = await findSimilarNotes(userId, embedding, limit);

    if (similarNotes.length === 0) {
      return "No relevant study notes found for this context.";
    }

    return similarNotes
      .map(
        (note) => `---
Title: ${note.title}
Content:
${note.content || "Empty content"}
---`
      )
      .join("\n\n");
  } catch (error) {
    console.error("[RAG] Failed to retrieve context:", error);
    return "Error retrieving study context for this query.";
  }
}
