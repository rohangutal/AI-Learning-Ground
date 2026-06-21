import { createOpenAICompatible } from "@ai-sdk/openai-compatible";

export const openrouter = createOpenAICompatible({
  name: "openrouter",
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: "https://openrouter.ai/api/v1",
  headers: {
    "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000", // Required by OpenRouter
    "X-Title": "AI Study Platform", // Required by OpenRouter
  },
});

// Example usage:
// import { generateText } from "ai";
// import { openrouter } from "@/lib/ai/openrouter";
// 
// const { text } = await generateText({
//   model: openrouter("deepseek/deepseek-chat"),
//   prompt: "Explain quantum computing",
// });
