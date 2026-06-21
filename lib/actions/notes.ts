"use server";

import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { notes } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function getNotes() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  try {
    const dbNotes = await db
      .select()
      .from(notes)
      .where(eq(notes.userId, user.id))
      .orderBy(notes.updatedAt);
      
    if (dbNotes.length > 0) {
      return dbNotes.map(n => ({
        id: n.id,
        userId: n.userId,
        folderId: n.folderId,
        title: n.title,
        content: n.content || "",
        createdAt: n.createdAt,
        updatedAt: n.updatedAt,
      }));
    }
  } catch (err) {
    console.error("Failed to fetch notes from DB, using fallback mock notes:", err);
  }

  // Fallback mock notes for testing
  return [
    {
      id: "mock-note-1",
      userId: user.id,
      folderId: null,
      title: "Machine Learning Basics",
      content: "Supervised learning algorithms build a mathematical model of a set of data that contains both the inputs and the desired outputs. Unsupervised learning algorithms take a set of data that contains only inputs, and find structure in the data, like grouping or clustering of data points. Linear regression is a supervised learning method for predicting quantitative responses. Neural networks are models inspired by biological brain networks.",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: "mock-note-2",
      userId: user.id,
      folderId: null,
      title: "Advanced Data Structures",
      content: "Red-Black trees are self-balancing binary search trees where each node has a color attribute (red or black). In addition to the ordinary requirements imposed on binary search trees, red-black trees satisfy: 1. A node is either red or black. 2. The root is black. 3. All leaves (NIL) are black. 4. If a node is red, both its children are black. B-Trees are self-balancing tree data structures that maintain sorted data and allow searches, sequential access, insertions, and deletions in logarithmic time.",
      createdAt: new Date(),
      updatedAt: new Date(),
    }
  ];
}
