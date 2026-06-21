import { streamTextWithFallback } from "@/lib/ai/fallback";
import { retrieveRAGContext } from "@/lib/ai/retrieval";
import { logAIGeneration } from "@/lib/ai/engine";
import { createClient } from "@/lib/supabase/server";

export const maxDuration = 30;

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { messages, rag = false }: { messages: any[]; rag?: boolean } = await req.json();

  if (!messages || messages.length === 0) {
    return new Response("Bad Request: messages array is required", { status: 400 });
  }

  // Retrieve RAG context if requested and there is a query
  let systemMessage = "You are a helpful, extremely concise AI tutor for a university student. Explain complex concepts simply.";
  const latestMessage = messages[messages.length - 1];

  if (rag && latestMessage && latestMessage.role === "user") {
    console.log(`[RAG] Retrieving context for query: "${latestMessage.content.slice(0, 50)}..."`);
    const context = await retrieveRAGContext(user.id, latestMessage.content as string);
    if (context && context !== "No relevant study notes found for this context.") {
      systemMessage += `\n\nUse the following relevant context from the student's study notes to answer their question if applicable:\n${context}`;
    }
  }

  try {
    const result = await streamTextWithFallback({
      messages,
      system: systemMessage,
      temperature: 0.5,
      onFinish: async ({ usage }: { usage: any }) => {
        const totalTokens = (usage.inputTokens ?? 0) + (usage.outputTokens ?? 0);
        await logAIGeneration(user.id, "chat", totalTokens);
      },
    });

    return result.toTextStreamResponse();
  } catch (error: any) {
    console.error("[Chat Route Error]", error);
    return new Response(JSON.stringify({ error: error.message || "Failed to generate AI response" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
