"use server";

import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { cheatsheets } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { generateCheatsheetStructure } from "@/lib/ai/engine";

export async function getCheatsheets() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  try {
    const dbCheatsheets = await db
      .select()
      .from(cheatsheets)
      .where(eq(cheatsheets.userId, user.id))
      .orderBy(desc(cheatsheets.createdAt));
      
    return dbCheatsheets;
  } catch (err) {
    console.error("Failed to fetch cheatsheets:", err);
    return [];
  }
}

export async function getCheatsheetById(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  try {
    const [cheatsheet] = await db
      .select()
      .from(cheatsheets)
      .where(and(eq(cheatsheets.id, id), eq(cheatsheets.userId, user.id)))
      .limit(1);
    return cheatsheet || null;
  } catch (err) {
    console.error("Failed to fetch cheatsheet by id:", err);
    return null;
  }
}

export async function generateCheatsheetAction(topic: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  try {
    const structuredOutput = await generateCheatsheetStructure(topic, {
      userId: user.id,
    });

    const [newCheatsheet] = await db
      .insert(cheatsheets)
      .values({
        userId: user.id,
        title: structuredOutput.title || `${topic} Cheatsheet`,
        description: structuredOutput.description || `Reference cheatsheet for ${topic}`,
        content: structuredOutput,
      })
      .returning();

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/cheatsheets");
    return newCheatsheet;
  } catch (err) {
    console.error("Failed to generate cheatsheet:", err);
    throw err;
  }
}

export async function deleteCheatsheetAction(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  try {
    await db
      .delete(cheatsheets)
      .where(and(eq(cheatsheets.id, id), eq(cheatsheets.userId, user.id)));

    revalidatePath("/dashboard/cheatsheets");
    return { success: true };
  } catch (err) {
    console.error("Failed to delete cheatsheet:", err);
    throw err;
  }
}
