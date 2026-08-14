import { createOpenAICompatible } from "@ai-sdk/openai-compatible";

export const openrouter = createOpenAICompatible({
  name: "openrouter",
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: "https://openrouter.ai/api/v1",
  headers: {
    "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000", // Required by OpenRouter
    "X-Title": "AI Study Platform", // Required by OpenRouter
  },
  fetch: async (url, init) => {
    // Intercept request to cap max_tokens to prevent OpenRouter from rejecting due to budget limits
    if (init && init.body && typeof init.body === "string") {
      try {
        const bodyObj = JSON.parse(init.body);
        if (!bodyObj.max_tokens || bodyObj.max_tokens > 2000) {
          bodyObj.max_tokens = 2000;
          init.body = JSON.stringify(bodyObj);
        }
      } catch (e) {
        console.error("[OpenRouter Fetch Interceptor Error]", e);
      }
    }
    return fetch(url, init);
  }
});

// Example usage:
// import { generateText } from "ai";
// import { openrouter } from "@/lib/ai/openrouter";
// 
// const { text } = await generateText({
//   model: openrouter("deepseek/deepseek-chat"),
//   prompt: "Explain quantum computing",
// });
