"use server";

import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { users, exams, examPapers, examQuestions, examAnalysis } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { parsePdf, parseDocx } from "@/lib/ai/exam-parser";
import { 
  extractQuestionsFromText, 
  extractQuestionsFromImage, 
  generateUnifiedAnalysis 
} from "@/lib/ai/exam-engine";

/**
 * Fetch all exams for the current user.
 */
export async function getExams() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error("Unauthorized");

  try {
    const list = await db
      .select()
      .from(exams)
      .where(eq(exams.userId, user.id))
      .orderBy(desc(exams.createdAt));
    return list.map(item => ({
      id: item.id,
      userId: item.userId,
      name: item.name,
      subject: item.subject,
      semesterBranch: item.semesterBranch,
      examDate: item.examDate.toISOString(),
      totalMarks: item.totalMarks,
      syllabus: item.syllabus,
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
    }));
  } catch (err) {
    console.error("Failed to fetch exams:", err);
    return [];
  }
}

/**
 * Fetch a single exam by ID.
 */
export async function getExamById(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error("Unauthorized");

  try {
    const [exam] = await db
      .select()
      .from(exams)
      .where(and(eq(exams.id, id), eq(exams.userId, user.id)))
      .limit(1);
    if (!exam) return null;
    return {
      id: exam.id,
      userId: exam.userId,
      name: exam.name,
      subject: exam.subject,
      semesterBranch: exam.semesterBranch,
      examDate: exam.examDate.toISOString(),
      totalMarks: exam.totalMarks,
      syllabus: exam.syllabus,
      createdAt: exam.createdAt.toISOString(),
      updatedAt: exam.updatedAt.toISOString(),
    };
  } catch (err) {
    console.error("Failed to fetch exam:", err);
    return null;
  }
}

/**
 * Create a new exam setup (Step 1).
 */
export async function createExamAction(data: {
  name: string;
  subject: string;
  examDateString: string;
}) {
  console.log("[Exam Prep Action] createExamAction input data:", data);
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  console.log("[Exam Prep Action] Authenticated user from Supabase:", user ? user.id : "null");

  if (!user) throw new Error("Unauthorized");

  // Self-healing database check: ensure user exists in public users table
  try {
    const [existingUser] = await db
      .select()
      .from(users)
      .where(eq(users.id, user.id))
      .limit(1);

    if (!existingUser) {
      console.log(`[Exam Prep] User profile for ${user.id} is missing in DB. Creating dynamically...`);
      await db.insert(users).values({
        id: user.id,
        email: user.email || "student@example.com",
        fullName: user.user_metadata?.full_name || user.email?.split("@")[0] || "Student",
        avatarUrl: user.user_metadata?.avatar_url || "",
      });
    }
  } catch (userErr) {
    console.error("[Exam Prep] Failed checking/creating user profile:", userErr);
  }

  try {
    const dateObj = new Date(data.examDateString);
    console.log("[Exam Prep Action] Attempting insert of exam with parsed date:", dateObj);
    const [newExam] = await db
      .insert(exams)
      .values({
        userId: user.id,
        name: data.name,
        subject: data.subject,
        semesterBranch: "General",
        examDate: dateObj,
        totalMarks: 100,
        syllabus: null,
      })
      .returning();

    console.log("[Exam Prep Action] Insert successful, new exam id:", newExam ? newExam.id : "null");
    revalidatePath("/dashboard/exam-prep");
    return {
      id: newExam.id,
      name: newExam.name,
      subject: newExam.subject,
    };
  } catch (err) {
    console.error("[Exam Prep Action] Failed to create exam database insert error:", err);
    throw err;
  }
}

/**
 * Delete an exam and all nested resources.
 */
export async function deleteExamAction(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error("Unauthorized");

  try {
    await db
      .delete(exams)
      .where(and(eq(exams.id, id), eq(exams.userId, user.id)));

    revalidatePath("/dashboard/exam-prep");
    return { success: true };
  } catch (err) {
    console.error("Failed to delete exam:", err);
    throw err;
  }
}

/**
 * Get all papers for an exam.
 */
export async function getExamPapers(examId: string) {
  try {
    const list = await db
      .select()
      .from(examPapers)
      .where(eq(examPapers.examId, examId))
      .orderBy(desc(examPapers.createdAt));
    return list.map(item => ({
      id: item.id,
      examId: item.examId,
      filename: item.filename,
      fileUrl: item.fileUrl,
      status: item.status,
      year: item.year,
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
    }));
  } catch (err) {
    console.error("Failed to fetch exam papers:", err);
    return [];
  }
}

/**
 * Get all questions for an exam.
 */
export async function getExamQuestions(examId: string) {
  try {
    const list = await db
      .select()
      .from(examQuestions)
      .where(eq(examQuestions.examId, examId))
      .orderBy(desc(examQuestions.createdAt));
    return list.map(item => ({
      id: item.id,
      examId: item.examId,
      paperId: item.paperId,
      questionText: item.questionText,
      marks: item.marks,
      questionType: item.questionType,
      topics: item.topics,
      difficulty: item.difficulty,
      year: item.year,
      isRepeated: item.isRepeated,
      repeatedQuestionId: item.repeatedQuestionId,
      explanation: item.explanation,
      createdAt: item.createdAt.toISOString(),
    }));
  } catch (err) {
    console.error("Failed to fetch exam questions:", err);
    return [];
  }
}

/**
 * Get exam analysis for an exam.
 */
export async function getExamAnalysis(examId: string) {
  try {
    const [analysis] = await db
      .select()
      .from(examAnalysis)
      .where(eq(examAnalysis.examId, examId))
      .limit(1);
    if (!analysis) return null;
    return {
      id: analysis.id,
      examId: analysis.examId,
      mostRepeatedQuestions: analysis.mostRepeatedQuestions,
      importantTopics: analysis.importantTopics,
      frequentlyAskedTopics: analysis.frequentlyAskedTopics,
      mostProbableQuestions: analysis.mostProbableQuestions,
      topicFrequency: analysis.topicFrequency,
      unitWeightage: analysis.unitWeightage,
      marksDistribution: analysis.marksDistribution,
      questionTypes: analysis.questionTypes,
      difficultyDistribution: analysis.difficultyDistribution,
      yearWiseTrends: analysis.yearWiseTrends,
      createdAt: analysis.createdAt.toISOString(),
      updatedAt: analysis.updatedAt.toISOString(),
    };
  } catch (err) {
    console.error("Failed to fetch exam analysis:", err);
    return null;
  }
}

/**
 * Delete a single exam paper.
 */
export async function deletePaperAction(paperId: string, examId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error("Unauthorized");

  try {
    await db
      .delete(examPapers)
      .where(eq(examPapers.id, paperId));

    revalidatePath(`/dashboard/exam-prep/${examId}`);
    return { success: true };
  } catch (err) {
    console.error("Failed to delete paper:", err);
    throw err;
  }
}

/**
 * Upload and parse a single paper (Step 2 & 3).
 * Accepts base64 encoded data to bypass complicated multipart form parsers.
 */
export async function uploadPaperAction(
  examId: string,
  filename: string,
  base64Data: string,
  mimeType: string
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error("Unauthorized");

  // Create paper entry as extracting
  const [paper] = await db
    .insert(examPapers)
    .values({
      examId,
      filename,
      fileUrl: "", // Loaded directly via base64, or could map to local/Supabase URL
      status: "extracting",
    })
    .returning();

  try {
    let extractedQuestionsData;
    const isImage = mimeType.startsWith("image/");
    const isPdf = mimeType === "application/pdf" || filename.endsWith(".pdf");
    const isDocx = mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" || filename.endsWith(".docx");

    if (isImage) {
      // Multimodal vision extraction
      extractedQuestionsData = await extractQuestionsFromImage(
        base64Data,
        mimeType,
        { userId: user.id, filename }
      );
    } else {
      // Text extraction + Text extraction AI model
      let textContent = "";
      const buffer = Buffer.from(base64Data, "base64");

      if (isPdf) {
        textContent = await parsePdf(buffer);
      } else if (isDocx) {
        textContent = await parseDocx(buffer);
      } else if (mimeType.startsWith("text/") || filename.endsWith(".txt") || filename.endsWith(".md")) {
        textContent = buffer.toString("utf-8");
      } else {
        throw new Error("Unsupported file format. Please upload PDF, DOCX, PNG, or JPG.");
      }

      if (!textContent.trim()) {
        throw new Error("No text content could be extracted from the file.");
      }

      extractedQuestionsData = await extractQuestionsFromText(textContent, {
        userId: user.id,
        filename,
      });
    }

    // Update paper year if detected by AI
    if (extractedQuestionsData.year) {
      await db
        .update(examPapers)
        .set({ year: extractedQuestionsData.year })
        .where(eq(examPapers.id, paper.id));
    }

    // Save questions to database
    if (extractedQuestionsData.questions.length > 0) {
      const questionInserts = extractedQuestionsData.questions.map((q) => ({
        examId,
        paperId: paper.id,
        questionText: q.questionText,
        marks: q.marks,
        questionType: q.questionType,
        topics: q.topics,
        difficulty: q.difficulty,
        year: extractedQuestionsData.year || null,
      }));

      await db.insert(examQuestions).values(questionInserts);
    }

    // Set paper status to analyzed
    await db
      .update(examPapers)
      .set({
        status: "analyzed",
        updatedAt: new Date(),
      })
      .where(eq(examPapers.id, paper.id));

    revalidatePath(`/dashboard/exam-prep/${examId}`);
    return { success: true, count: extractedQuestionsData.questions.length };
  } catch (err) {
    console.error(`Failed to process paper ${filename}:`, err);
    await db
      .update(examPapers)
      .set({
        status: "failed",
        updatedAt: new Date(),
      })
      .where(eq(examPapers.id, paper.id));
    throw err;
  }
}

/**
 * Execute unified analysis across all uploaded exam papers (Step 4 & 5).
 */
export async function runUnifiedAnalysisAction(examId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error("Unauthorized");

  const [exam] = await db
    .select()
    .from(exams)
    .where(and(eq(exams.id, examId), eq(exams.userId, user.id)))
    .limit(1);

  if (!exam) throw new Error("Exam not found");

  const allQuestions = await db
    .select()
    .from(examQuestions)
    .where(eq(examQuestions.examId, examId));

  if (allQuestions.length === 0) {
    throw new Error("No questions extracted yet. Please upload papers first.");
  }

  try {
    const analysisData = await generateUnifiedAnalysis(
      {
        name: exam.name,
        subject: exam.subject,
        semesterBranch: exam.semesterBranch,
        syllabus: exam.syllabus,
      },
      allQuestions.map((q) => ({
        questionText: q.questionText,
        marks: q.marks,
        questionType: q.questionType,
        topics: q.topics as string[] | null,
        difficulty: q.difficulty,
        year: q.year,
      })),
      { userId: user.id }
    );

    // Upsert into exam_analysis
    const [existing] = await db
      .select()
      .from(examAnalysis)
      .where(eq(examAnalysis.examId, examId))
      .limit(1);

    if (existing) {
      await db
        .update(examAnalysis)
        .set({
          mostRepeatedQuestions: analysisData.mostRepeatedQuestions,
          importantTopics: analysisData.importantTopics,
          frequentlyAskedTopics: analysisData.frequentlyAskedTopics,
          mostProbableQuestions: analysisData.mostProbableQuestions,
          topicFrequency: analysisData.analytics.topicFrequency,
          unitWeightage: analysisData.analytics.unitWeightage,
          marksDistribution: analysisData.analytics.marksDistribution,
          questionTypes: analysisData.analytics.questionTypes,
          difficultyDistribution: analysisData.analytics.difficultyDistribution,
          yearWiseTrends: analysisData.analytics.yearWiseTrends,
          updatedAt: new Date(),
        })
        .where(eq(examAnalysis.examId, examId));
    } else {
      await db.insert(examAnalysis).values({
        examId,
        mostRepeatedQuestions: analysisData.mostRepeatedQuestions,
        importantTopics: analysisData.importantTopics,
        frequentlyAskedTopics: analysisData.frequentlyAskedTopics,
        mostProbableQuestions: analysisData.mostProbableQuestions,
        topicFrequency: analysisData.analytics.topicFrequency,
        unitWeightage: analysisData.analytics.unitWeightage,
        marksDistribution: analysisData.analytics.marksDistribution,
        questionTypes: analysisData.analytics.questionTypes,
        difficultyDistribution: analysisData.analytics.difficultyDistribution,
        yearWiseTrends: analysisData.analytics.yearWiseTrends,
      });
    }

    // Match repeated questions in the database
    // Iterate through groups of repeated questions and mark the corresponding database rows
    for (const group of analysisData.mostRepeatedQuestions) {
      // Find database rows matching the original question text in the originalQuestions list
      if (group.originalQuestions && group.originalQuestions.length > 0) {
        // Flag all matching questions as repeated
        for (const matchText of group.originalQuestions) {
          await db
            .update(examQuestions)
            .set({
              isRepeated: true,
              explanation: group.whyImportant,
            })
            .where(and(eq(examQuestions.examId, examId), eq(examQuestions.questionText, matchText)));
        }
      }
    }

    revalidatePath(`/dashboard/exam-prep/${examId}`);
    return { success: true };
  } catch (err) {
    console.error("Unified analysis failed:", err);
    throw err;
  }
}
