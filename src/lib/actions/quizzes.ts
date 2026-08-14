"use server";

import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { quizzes, notes } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { generateQuiz as generateAI } from "@/lib/ai/engine";

export async function getQuizzes() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  const mockFallbackQuizzes = [
    {
      id: "mock-quiz-1",
      userId: user.id,
      noteId: null,
      title: "Machine Learning Basics Quiz",
      questions: [
        {
          question: "Which of the following is a supervised learning method?",
          options: [
            "K-Means Clustering",
            "Linear Regression",
            "Principal Component Analysis",
            "Apriori Algorithm"
          ],
          answer: "Linear Regression",
          explanation: "Linear Regression is a supervised learning algorithm because it uses labeled training data (input-output pairs) to learn a function that maps inputs to outputs."
        },
        {
          question: "What is the primary objective of unsupervised learning?",
          options: [
            "Predict quantitative responses",
            "Label training data",
            "Find hidden structure or groupings in unlabeled data",
            "Minimize output classification error"
          ],
          answer: "Find hidden structure or groupings in unlabeled data",
          explanation: "Unsupervised learning works with unlabeled data, aiming to find patterns, structures, or clustering without pre-defined labels."
        }
      ],
      score: 80,
      totalQuestions: 2,
      createdAt: new Date(),
    },
    {
      id: "mock-quiz-2",
      userId: user.id,
      noteId: null,
      title: "Advanced Data Structures Quiz",
      questions: [
        {
          question: "Which of the following is true about Red-Black tree properties?",
          options: [
            "The root can be red or black.",
            "All leaves (NIL) are black.",
            "If a node is red, its children must also be red.",
            "Red-Black trees do not need to be balanced."
          ],
          answer: "All leaves (NIL) are black.",
          explanation: "According to Red-Black tree properties, all leaf nodes (which are represented by NIL) must be colored black."
        }
      ],
      score: null,
      totalQuestions: 1,
      createdAt: new Date(),
    }
  ];

  try {
    const dbQuizzes = await db
      .select()
      .from(quizzes)
      .where(eq(quizzes.userId, user.id))
      .orderBy(quizzes.createdAt);
      
    if (dbQuizzes.length > 0) {
      return dbQuizzes;
    }
  } catch (err) {
    console.error("Failed to fetch quizzes from database, falling back to mock list:", err);
  }

  return mockFallbackQuizzes;
}

export async function generateQuizAction(topic: string, count = 5) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  // Generate quiz via AI
  const quizData = await generateAI(topic, { userId: user.id, count });

  try {
    const [inserted] = await db
      .insert(quizzes)
      .values({
        userId: user.id,
        title: quizData.title,
        questions: quizData.questions,
        totalQuestions: quizData.questions.length,
        score: null, // Initial score is null until taken
      })
      .returning();
      
    revalidatePath("/dashboard/quizzes");
    return inserted;
  } catch (err) {
    console.error("Failed to insert quiz to DB, returning transient quiz:", err);
    return {
      id: Math.random().toString(),
      userId: user.id,
      noteId: null,
      title: quizData.title,
      questions: quizData.questions,
      totalQuestions: quizData.questions.length,
      score: null,
      createdAt: new Date(),
    };
  }
}

export async function generateQuizFromNoteAction(noteId: string, count = 5) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  let noteTitle = "Study Note Quiz";
  let noteContent = "";

  if (noteId.startsWith("mock-note-")) {
    const mockNotes = [
      {
        id: "mock-note-1",
        title: "Machine Learning Basics",
        content: "Supervised learning algorithms build a mathematical model of a set of data that contains both the inputs and the desired outputs. Unsupervised learning algorithms take a set of data that contains only inputs, and find structure in the data, like grouping or clustering of data points. Linear regression is a supervised learning method for predicting quantitative responses. Neural networks are models inspired by biological brain networks.",
      },
      {
        id: "mock-note-2",
        title: "Advanced Data Structures",
        content: "Red-Black trees are self-balancing binary search trees where each node has a color attribute (red or black). In addition to the ordinary requirements imposed on binary search trees, red-black trees satisfy: 1. A node is either red or black. 2. The root is black. 3. All leaves (NIL) are black. 4. If a node is red, both its children are black. B-Trees are self-balancing tree data structures that maintain sorted data and allow searches, sequential access, insertions, and deletions in logarithmic time.",
      }
    ];
    const found = mockNotes.find(n => n.id === noteId);
    if (found) {
      noteTitle = found.title;
      noteContent = found.content;
    }
  } else {
    try {
      const [dbNote] = await db
        .select()
        .from(notes)
        .where(eq(notes.id, noteId))
        .limit(1);
      if (dbNote) {
        noteTitle = dbNote.title;
        noteContent = dbNote.content || "";
      }
    } catch (err) {
      console.error("Failed to load note from DB:", err);
    }
  }

  if (!noteContent) {
    throw new Error("Note content is empty or not found.");
  }

  // Generate quiz via AI using the note content as context
  const quizData = await generateAI(noteTitle, { userId: user.id, count, context: noteContent });

  const noteUUID = noteId.startsWith("mock-note-") ? null : noteId;

  try {
    const [inserted] = await db
      .insert(quizzes)
      .values({
        userId: user.id,
        noteId: noteUUID,
        title: quizData.title,
        questions: quizData.questions,
        totalQuestions: quizData.questions.length,
        score: null,
      })
      .returning();
      
    revalidatePath("/dashboard/quizzes");
    return inserted;
  } catch (err) {
    console.error("Failed to insert quiz to DB, returning transient quiz:", err);
    return {
      id: Math.random().toString(),
      userId: user.id,
      noteId: noteUUID,
      title: quizData.title,
      questions: quizData.questions,
      totalQuestions: quizData.questions.length,
      score: null,
      createdAt: new Date(),
    };
  }
}

export async function submitQuizScoreAction(quizId: string, score: number) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  try {
    await db
      .update(quizzes)
      .set({
        score: score,
      })
      .where(and(eq(quizzes.id, quizId), eq(quizzes.userId, user.id)));
  } catch (err) {
    console.error("Failed to save quiz score:", err);
  }

  revalidatePath("/dashboard/quizzes");
}

export async function deleteQuizAction(quizId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  try {
    await db
      .delete(quizzes)
      .where(and(eq(quizzes.id, quizId), eq(quizzes.userId, user.id)));
  } catch (err) {
    console.error("Failed to delete quiz:", err);
  }

  revalidatePath("/dashboard/quizzes");
}
