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
      console.warn(`[AI Fallback] Native generateObject failed using ${modelInfo.id}. Error:`, error);
      
      // Fallback to generateText + JSON parsing on the SAME model
      try {
        console.log(`[AI Fallback] Trying generateText JSON fallback on ${modelInfo.id}...`);
        const model = getModel(modelInfo.name);
        
        const schemaDesc = JSON.stringify(describeZodSchema(options.schema), null, 2);
        const systemPrompt = `${options.system || ""}\n\nYou must respond ONLY with a valid JSON object matching this schema:\n${schemaDesc}\n\nDo not wrap the response in markdown blocks like \`\`\`json or \`\`\`. Do not include any other text, explanation, or HTML tags. Just output the raw JSON object.`;
        
        const textResult = await generateText({
          model,
          system: systemPrompt,
          prompt: options.prompt,
          temperature: options.temperature ?? 0.5,
        });
        
        const cleanedText = cleanJsonText(textResult.text);
        const parsedObj = JSON.parse(cleanedText);
        
        let validatedObj = parsedObj;
        if (options.schema) {
          const parseResult = options.schema.safeParse(parsedObj);
          if (!parseResult.success) {
            console.error(`[AI Fallback] Zod validation failed for ${modelInfo.id}:`, parseResult.error);
            throw new Error(`JSON does not match schema: ${parseResult.error.message}`);
          }
          validatedObj = parseResult.data;
        }
        
        console.log(`[AI Fallback] Success using generateText JSON fallback on ${modelInfo.id}!`);
        
        return {
          object: validatedObj,
          usage: textResult.usage ? {
            inputTokens: textResult.usage.inputTokens,
            outputTokens: textResult.usage.outputTokens,
            totalTokens: textResult.usage.totalTokens,
          } : undefined,
        } as unknown as GenerateObjectResult<T>;
      } catch (fallbackError) {
        lastError = fallbackError;
        if (fallbackOpts?.onModelChange) {
          fallbackOpts.onModelChange(modelInfo.id, fallbackError);
        }
        console.warn(`[AI Fallback] JSON text fallback also failed using ${modelInfo.id}. Error:`, fallbackError);
      }
    }
  }

  throw new Error(`All AI object generation models failed. Last error: ${lastError?.message || lastError}`);
}

// Helper functions for structured JSON fallback
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function describeZodSchema(schema: any): any {
  if (!schema) return "any";
  const typeName = schema.constructor?.name;
  
  if (typeName === "ZodObject") {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const obj: Record<string, any> = {};
    const shape = schema.shape || schema._def?.shape?.();
    if (shape) {
      for (const key in shape) {
        obj[key] = describeZodSchema(shape[key]);
      }
    }
    return obj;
  }
  if (typeName === "ZodArray") {
    const elementSchema = schema.element || schema._def?.type;
    return [describeZodSchema(elementSchema)];
  }
  if (typeName === "ZodString") {
    return "string";
  }
  if (typeName === "ZodNumber") {
    return "number";
  }
  if (typeName === "ZodBoolean") {
    return "boolean";
  }
  if (typeName === "ZodEnum") {
    return schema._def.values?.join(" | ") || "string";
  }
  if (typeName === "ZodEffects") {
    return describeZodSchema(schema._def.schema || schema.innerType?.());
  }
  if (typeName === "ZodOptional" || typeName === "ZodNullable") {
    return describeZodSchema(schema._def.innerType || schema.unwrap?.());
  }
  return "any";
}

function cleanJsonText(text: string): string {
  let cleaned = text.trim();
  cleaned = cleaned.replace(/^```(?:json)?/gi, "");
  cleaned = cleaned.replace(/```$/gi, "");
  cleaned = cleaned.trim();
  
  const startIdx = cleaned.indexOf("{");
  const endIdx = cleaned.lastIndexOf("}");
  if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
    cleaned = cleaned.substring(startIdx, endIdx + 1);
  }
  return cleaned;
}

