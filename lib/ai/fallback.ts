import { generateText, streamText, generateObject, type GenerateTextResult, type StreamTextResult, type GenerateObjectResult } from "ai";
import { getModel } from "./models";

// Define generic options that match Vercel AI SDK parameters
type GenerateTextOptions = any;
type StreamTextOptions = any;
type GenerateObjectOptions = any;

export interface FallbackOptions {
  onModelChange?: (modelId: string, error: any) => void;
}

/**
 * Attempts to generate text using a primary model, falling back to alternative models on failure.
 * Fallback path: DeepSeek V3 -> Gemini Flash -> Claude Sonnet
 */
export async function generateTextWithFallback(
  options: GenerateTextOptions,
  fallbackOpts?: FallbackOptions
): Promise<GenerateTextResult<any, any>> {
  const modelsToTry = [
    { name: "primary" as const, id: "deepseek/deepseek-chat" },
    { name: "fallback1" as const, id: "google/gemini-2.5-flash" },
    { name: "fallback2" as const, id: "anthropic/claude-3.5-sonnet" },
  ];

  let lastError: any = null;

  for (const modelInfo of modelsToTry) {
    try {
      const model = getModel(modelInfo.name);
      const result = await generateText({
        ...options,
        model,
      } as any);
      return result;
    } catch (error) {
      lastError = error;
      if (fallbackOpts?.onModelChange) {
        fallbackOpts.onModelChange(modelInfo.id, error);
      }
      console.warn(`[AI Fallback] Failed using ${modelInfo.id}. Error:`, error);
    }
  }

  throw new Error(`All AI models failed. Last error: ${lastError?.message || lastError}`);
}

/**
 * Attempts to stream text using a primary model, falling back to alternative models on initialization failure.
 * Fallback path: DeepSeek V3 -> Gemini Flash -> Claude Sonnet
 */
export async function streamTextWithFallback(
  options: StreamTextOptions,
  fallbackOpts?: FallbackOptions
): Promise<StreamTextResult<any, any>> {
  const modelsToTry = [
    { name: "primary" as const, id: "deepseek/deepseek-chat" },
    { name: "fallback1" as const, id: "google/gemini-2.5-flash" },
    { name: "fallback2" as const, id: "anthropic/claude-3.5-sonnet" },
  ];

  let lastError: any = null;

  for (const modelInfo of modelsToTry) {
    try {
      const model = getModel(modelInfo.name);
      const result = await streamText({
        ...options,
        model,
      } as any);
      
      // We return the stream. Note: If streaming fails mid-flight, this doesn't capture it.
      // But standard API setup errors (429, 500, Auth) are captured here.
      return result;
    } catch (error) {
      lastError = error;
      if (fallbackOpts?.onModelChange) {
        fallbackOpts.onModelChange(modelInfo.id, error);
      }
      console.warn(`[AI Fallback] Streaming failed using ${modelInfo.id}. Error:`, error);
    }
  }

  throw new Error(`All AI streaming models failed. Last error: ${lastError?.message || lastError}`);
}

/**
 * Attempts to generate structured JSON objects using a primary model, falling back to alternative models on failure.
 * Fallback path: DeepSeek V3 -> Gemini Flash -> Claude Sonnet
 */
export async function generateObjectWithFallback<T>(
  options: GenerateObjectOptions,
  fallbackOpts?: FallbackOptions
): Promise<GenerateObjectResult<T>> {
  const modelsToTry = [
    { name: "primary" as const, id: "deepseek/deepseek-chat" },
    { name: "fallback1" as const, id: "google/gemini-2.5-flash" },
    { name: "fallback2" as const, id: "anthropic/claude-3.5-sonnet" },
  ];

  let lastError: any = null;

  for (const modelInfo of modelsToTry) {
    try {
      const model = getModel(modelInfo.name);
      const result = await generateObject({
        ...options,
        model,
      } as any);
      return result as GenerateObjectResult<T>;
    } catch (error) {
      lastError = error;
      if (fallbackOpts?.onModelChange) {
        fallbackOpts.onModelChange(modelInfo.id, error);
      }
      console.warn(`[AI Fallback] generateObject failed using ${modelInfo.id}. Error:`, error);
    }
  }

  throw new Error(`All AI object generation models failed. Last error: ${lastError?.message || lastError}`);
}

