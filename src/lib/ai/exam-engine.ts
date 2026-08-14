import { z } from "zod";
import { generateObjectWithFallback } from "./fallback";
import { logAIGeneration } from "./engine";

// ==========================================
// Zod Schemas for Exam Prep Structured Outputs
// ==========================================

export const ExtractedQuestionSchema = z.object({
  questionText: z.string().describe("The exact text of the question. Include sub-parts if any."),
  marks: z.number().nullable().describe("The marks assigned to the question. Null if not specified."),
  questionType: z.enum(["MCQ", "Short Answer", "Long Answer", "Numerical", "Practical"]).describe("The format/type of the question."),
  topics: z.array(z.string()).describe("A list of key topics/chapters this question covers."),
  difficulty: z.enum(["easy", "medium", "hard"]).describe("The estimated difficulty level of this question."),
});

export const PaperQuestionsExtractionSchema = z.object({
  year: z.number().nullable().describe("The year of the exam paper if specified (e.g. 2024, 2023), otherwise null."),
  questions: z.array(ExtractedQuestionSchema).describe("The list of questions extracted from the paper."),
});

export const RepeatedQuestionGroupSchema = z.object({
  questionText: z.string().describe("The canonical or most representative text of this repeated question group."),
  frequency: z.number().describe("The number of times this question (or semantically identical ones) was asked across the papers."),
  years: z.array(z.number()).describe("The years this question appeared."),
  whyImportant: z.string().describe("Reasoning explaining why this question is considered important and its frequency pattern."),
  originalQuestions: z.array(z.string()).describe("The original question strings from the papers that match this group."),
});

export const ImportantTopicSchema = z.object({
  topic: z.string().describe("The name of the topic or chapter."),
  importanceScore: z.number().describe("An importance score from 0 to 100 based on question density and repetition."),
  reason: z.string().describe("Detailed reasoning explaining why this topic is highly important for the upcoming exam."),
});

export const FrequentlyAskedTopicSchema = z.object({
  topic: z.string().describe("The name of the topic."),
  frequency: z.number().describe("Number of questions related to this topic across all papers."),
});

export const ProbableQuestionSchema = z.object({
  questionText: z.string().describe("A high-probability question predicted for the upcoming exam based on the syllabus and past patterns."),
  probabilityScore: z.number().describe("Estimated probability score (0 to 100)."),
  explanation: z.string().describe("Detailed logical reasoning of why this question is highly likely to appear (e.g. 'It hasn't been asked in 2 years but was previously highly recurring')."),
  suggestedAnswerOutline: z.string().describe("A brief, bulleted guide or structure on how to answer this question to score full marks."),
});

export const ExamPatternAnalyticsSchema = z.object({
  topicFrequency: z.array(z.object({
    topic: z.string(),
    count: z.number(),
  })).describe("Frequency of each topic across all questions."),
  unitWeightage: z.array(z.object({
    unit: z.string().describe("Unit or major chapter name."),
    weight: z.number().describe("Percentage weightage or marks allocated (0-100)."),
  })).describe("Estimated weightage of each major unit based on marks distribution."),
  marksDistribution: z.array(z.object({
    range: z.string().describe("Marks bracket (e.g. '1-2 Marks', '3-5 Marks', '10+ Marks')"),
    count: z.number(),
  })).describe("Count of questions in different marks ranges."),
  questionTypes: z.array(z.object({
    type: z.string(),
    count: z.number(),
  })).describe("Distribution of different question types."),
  difficultyDistribution: z.array(z.object({
    difficulty: z.string(), // easy, medium, hard
    count: z.number(),
  })).describe("Distribution of question difficulties."),
  yearWiseTrends: z.array(z.object({
    year: z.number(),
    averageMarksPerQuestion: z.number(),
    questionCount: z.number(),
  })).describe("Year-over-year metrics of the papers."),
});

export const UnifiedExamAnalysisSchema = z.object({
  mostRepeatedQuestions: z.array(RepeatedQuestionGroupSchema),
  importantTopics: z.array(ImportantTopicSchema),
  frequentlyAskedTopics: z.array(FrequentlyAskedTopicSchema),
  mostProbableQuestions: z.array(ProbableQuestionSchema),
  analytics: ExamPatternAnalyticsSchema,
});

// ==========================================
// AI Generation Functions
// ==========================================

/**
 * Extracts questions from text content (PDF, DOCX).
 */
export async function extractQuestionsFromText(
  text: string,
  options: { userId: string; filename: string }
): Promise<z.infer<typeof PaperQuestionsExtractionSchema>> {
  const systemPrompt = `
You are a senior academic coordinator and OCR text extraction expert.
Analyze the raw text extracted from an exam paper named "${options.filename}".
Extract all questions from the text and structure them as JSON according to the schema.
Ensure you:
1. Do not miss any questions or sub-parts.
2. Clean up any scan artifacts, keeping the question text clear and readable.
3. Detect the marks for each question if available.
4. Categorize the question format (MCQ, Short Answer, Long Answer, Numerical, Practical).
5. Map each question to its sub-topics or chapters.
6. Estimate the difficulty level (easy, medium, hard) based on cognitive complexity.
7. Detect the year of the paper if mentioned (e.g., "Final Exam 2023", "December 2022").
  `.trim();

  const promptText = `
Here is the text extracted from the exam paper:
---
${text}
---
Please extract and structure the questions.
  `.trim();

  const result = await generateObjectWithFallback<z.infer<typeof PaperQuestionsExtractionSchema>>({
    system: systemPrompt,
    prompt: promptText,
    schema: PaperQuestionsExtractionSchema,
    temperature: 0.1,
  });

  if (result.usage) {
    const totalTokens = (result.usage.inputTokens ?? 0) + (result.usage.outputTokens ?? 0);
    await logAIGeneration(options.userId, "summary", totalTokens);
  }

  return result.object;
}

/**
 * Extracts questions from an image (PNG, JPG) using multimodal vision capability.
 */
export async function extractQuestionsFromImage(
  base64Data: string,
  mimeType: string,
  options: { userId: string; filename: string }
): Promise<z.infer<typeof PaperQuestionsExtractionSchema>> {
  const systemPrompt = `
You are an expert academic coordinator and visual OCR extractor.
Analyze the image of an exam paper page named "${options.filename}".
Extract all visible questions and structure them as JSON according to the schema.
Detect marks, type, topics, difficulty, and the year of the paper if specified.
  `.trim();

  const result = await generateObjectWithFallback<z.infer<typeof PaperQuestionsExtractionSchema>>({
    system: systemPrompt,
    schema: PaperQuestionsExtractionSchema,
    temperature: 0.1,
    messages: [
      {
        role: "user",
        content: [
          { type: "text", text: "Please extract all questions from this exam paper image." },
          {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            type: "image" as any,
            image: base64Data,
            mimeType: mimeType,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
          } as any,
        ],
      },
    ],
  });

  if (result.usage) {
    const totalTokens = (result.usage.inputTokens ?? 0) + (result.usage.outputTokens ?? 0);
    await logAIGeneration(options.userId, "summary", totalTokens);
  }

  return result.object;
}

/**
 * Generates unified analysis across all extracted questions.
 */
export async function generateUnifiedAnalysis(
  examDetails: { name: string; subject: string; semesterBranch: string; syllabus?: string | null },
  allQuestions: Array<{ questionText: string; marks: number | null; questionType: string | null; topics: string[] | null; difficulty: string | null; year: number | null }>,
  options: { userId: string }
): Promise<z.infer<typeof UnifiedExamAnalysisSchema>> {
  const systemPrompt = `
You are an advanced educational data scientist and expert examiner.
You will analyze a combined list of past exam questions for the exam: "${examDetails.name}" (Subject: "${examDetails.subject}", Semester/Branch: "${examDetails.semesterBranch}").
${examDetails.syllabus ? `Use this optional syllabus as a guideline for units and chapters:\n${examDetails.syllabus}\n` : ""}

Your task is to produce a structured JSON report that:
1. **Detects repeated questions**: Group semantically identical or highly similar questions together. Provide a canonical version, frequency, years, rationales, and the list of matching original questions.
2. **Identifies important topics**: Rank topics/chapters by their frequency, weightage, and critical value for exams. Provide an importance score (0-100) and rationale.
3. **Generates probable questions**: Predict 5-10 highly probable questions for the upcoming exam. Provide a probability score (0-100), detailed pattern-based justification (e.g. gaps in years, syllabus coverage), and a brief bulleted structural answer outline.
4. **Computes Pattern Analytics**:
   - Topic frequency counts.
   - Unit weightage percentages (totaling roughly 100% across units).
   - Marks distribution (count of questions in brackets like '1-2 Marks', '3-5 Marks', '6-10 Marks', '10+ Marks').
   - Question type distributions (MCQ, Short Answer, Long Answer, Numerical, Practical).
   - Difficulty level distributions (easy, medium, hard).
   - Year-wise trend summaries (question count, average marks per question for each year).
  `.trim();

  const promptText = `
Here is the complete list of questions extracted from past papers:
${JSON.stringify(allQuestions, null, 2)}

Please perform the unified exam analysis and return the structured report.
  `.trim();

  const result = await generateObjectWithFallback<z.infer<typeof UnifiedExamAnalysisSchema>>({
    system: systemPrompt,
    prompt: promptText,
    schema: UnifiedExamAnalysisSchema,
    temperature: 0.3,
  });

  if (result.usage) {
    const totalTokens = (result.usage.inputTokens ?? 0) + (result.usage.outputTokens ?? 0);
    await logAIGeneration(options.userId, "summary", totalTokens);
  }

  return result.object;
}
