import { streamTextWithFallback, generateObjectWithFallback } from "./fallback";
import { SYSTEM_PROMPTS, promptTemplates, FormulaExtractionSchema, TopicExplanationSchema } from "./prompts";
import { db } from "../db";
import { aiGenerations } from "../db/schema";
import { z } from "zod";

/**
 * Log token usage to the database
 */
export async function logAIGeneration(
  userId: string,
  promptType: "summary" | "flashcard" | "quiz" | "chat",
  tokenCount: number
) {
  try {
    await db.insert(aiGenerations).values({
      userId,
      promptType,
      tokenCount,
    });
    console.log(`[AI Billing] Logged ${tokenCount} tokens for user ${userId} (${promptType})`);
  } catch (error) {
    console.error("[AI Billing] Failed to log AI generation usage:", error);
  }
}

interface StreamOptions {
  userId: string;
  onModelChange?: (modelId: string) => void;
}

interface NotesStreamOptions extends StreamOptions {
  style?: string;
  depth?: string;
  tone?: string;
  length?: string;
}

/**
 * Stream structured Study Notes generation
 */
export async function generateStudyNotesStream(sourceText: string, options: NotesStreamOptions) {
  const { userId, onModelChange, ...generationOpts } = options;
  return streamTextWithFallback(
    {
      system: SYSTEM_PROMPTS.notesGenerator,
      prompt: promptTemplates.generateNotes(sourceText, generationOpts),
      temperature: 0.3,
      onFinish: async ({ usage }: { usage: any }) => {
        const totalTokens = (usage.inputTokens ?? 0) + (usage.outputTokens ?? 0);
        await logAIGeneration(options.userId, "summary", totalTokens);
      },
    },
    {
      onModelChange: options.onModelChange,
    }
  );
}

/**
 * Stream Summarization of source text
 */
export async function summarizeTextStream(sourceText: string, options: StreamOptions) {
  return streamTextWithFallback(
    {
      system: SYSTEM_PROMPTS.summarizer,
      prompt: promptTemplates.summarize(sourceText),
      temperature: 0.3,
      onFinish: async ({ usage }: { usage: any }) => {
        const totalTokens = (usage.inputTokens ?? 0) + (usage.outputTokens ?? 0);
        await logAIGeneration(options.userId, "summary", totalTokens);
      },
    },
    {
      onModelChange: options.onModelChange,
    }
  );
}

/**
 * Stream Revision Notes (Active Recall focused)
 */
export async function generateRevisionNotesStream(sourceText: string, options: StreamOptions) {
  return streamTextWithFallback(
    {
      system: SYSTEM_PROMPTS.revisionNotes,
      prompt: promptTemplates.revisionNotes(sourceText),
      temperature: 0.4,
      onFinish: async ({ usage }: { usage: any }) => {
        const totalTokens = (usage.inputTokens ?? 0) + (usage.outputTokens ?? 0);
        await logAIGeneration(options.userId, "flashcard", totalTokens);
      },
    },
    {
      onModelChange: options.onModelChange,
    }
  );
}

/**
 * Extract mathematical/scientific formulas as JSON structure
 */
export async function extractFormulas(sourceText: string, options: { userId: string; onModelChange?: (modelId: string) => void }) {
  const result = await generateObjectWithFallback<z.infer<typeof FormulaExtractionSchema>>(
    {
      system: SYSTEM_PROMPTS.formulaExtractor,
      prompt: promptTemplates.extractFormulas(sourceText),
      schema: FormulaExtractionSchema,
      temperature: 0.1,
    },
    {
      onModelChange: options.onModelChange,
    }
  );

  if (result.usage) {
    const totalTokens = (result.usage.inputTokens ?? 0) + (result.usage.outputTokens ?? 0);
    await logAIGeneration(options.userId, "summary", totalTokens);
  }

  return result.object;
}

/**
 * Detailed Topic Explanation with ELI5, technical breakdown, analogy, and takeaways
 */
export async function explainTopic(
  topic: string,
  context: string | undefined,
  options: { userId: string; onModelChange?: (modelId: string) => void }
) {
  const result = await generateObjectWithFallback<z.infer<typeof TopicExplanationSchema>>(
    {
      system: SYSTEM_PROMPTS.topicExplainer,
      prompt: promptTemplates.explainTopic(topic, context),
      schema: TopicExplanationSchema,
      temperature: 0.5,
    },
    {
      onModelChange: options.onModelChange,
    }
  );

  if (result.usage) {
    const totalTokens = (result.usage.inputTokens ?? 0) + (result.usage.outputTokens ?? 0);
    await logAIGeneration(options.userId, "chat", totalTokens);
  }

  return result.object;
}
