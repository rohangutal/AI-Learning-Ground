"use server";

import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { roadmaps } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { generateRoadmapStructure } from "@/lib/ai/engine";

export async function getRoadmaps() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  try {
    const dbRoadmaps = await db
      .select()
      .from(roadmaps)
      .where(eq(roadmaps.userId, user.id))
      .orderBy(desc(roadmaps.createdAt));
      
    return dbRoadmaps;
  } catch (err) {
    console.error("Failed to fetch roadmaps:", err);
    return [];
  }
}

export async function getRoadmapById(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  try {
    const [roadmap] = await db
      .select()
      .from(roadmaps)
      .where(and(eq(roadmaps.id, id), eq(roadmaps.userId, user.id)))
      .limit(1);
    return roadmap || null;
  } catch (err) {
    console.error("Failed to fetch roadmap by id:", err);
    return null;
  }
}

export async function generateRoadmapAction(topic: string, targetLevel: string, duration: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  try {
    const structuredOutput = await generateRoadmapStructure(topic, targetLevel, duration, {
      userId: user.id,
    });

    const [newRoadmap] = await db
      .insert(roadmaps)
      .values({
        userId: user.id,
        title: structuredOutput.title || `${topic} Roadmap`,
        description: structuredOutput.description || `Roadmap for mastering ${topic}`,
        targetLevel,
        duration,
        content: structuredOutput,
        progress: [], // Start with empty completed tasks list
      })
      .returning();

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/roadmaps");
    return newRoadmap;
  } catch (err) {
    console.error("Failed to generate roadmap:", err);
    throw err;
  }
}

export async function updateRoadmapProgressAction(id: string, progress: string[]) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  try {
    const [updatedRoadmap] = await db
      .update(roadmaps)
      .set({
        progress,
        updatedAt: new Date(),
      })
      .where(and(eq(roadmaps.id, id), eq(roadmaps.userId, user.id)))
      .returning();

    revalidatePath(`/dashboard/roadmaps/${id}`);
    return updatedRoadmap;
  } catch (err) {
    console.error("Failed to update roadmap progress:", err);
    throw err;
  }
}

export async function deleteRoadmapAction(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  try {
    await db
      .delete(roadmaps)
      .where(and(eq(roadmaps.id, id), eq(roadmaps.userId, user.id)));

    revalidatePath("/dashboard/roadmaps");
    return { success: true };
  } catch (err) {
    console.error("Failed to delete roadmap:", err);
    throw err;
  }
}
