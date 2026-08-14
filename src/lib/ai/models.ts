import { openrouter } from "./openrouter";

// Model identifiers on OpenRouter
export const MODELS = {
  // Primary model: DeepSeek V3
  primary: "deepseek/deepseek-chat",
  // Secondary fallback: Gemini Flash
  fallback1: "google/gemini-2.5-flash",
  // Tertiary fallback: Claude 3.5 Sonnet
  fallback2: "anthropic/claude-3.5-sonnet",
  // Embedding model (if supported by OpenRouter, otherwise used with compatible providers)
  embedding: "openai/text-embedding-3-small",
} as const;

export type ModelRole = keyof typeof MODELS;

/**
 * Get the OpenRouter model instance for Vercel AI SDK
 */
export function getModel(role: ModelRole) {
  const modelId = MODELS[role];
  return openrouter(modelId);
}
