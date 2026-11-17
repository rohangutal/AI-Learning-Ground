/**
 * Generate vector embeddings for a given text query.
 * Uses OpenRouter's embeddings API with openai/text-embedding-3-small (1536 dimensions).
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  const [embedding] = await generateEmbeddings([text]);
  return embedding;
}

/** Generate embeddings in batches to keep document ingestion bounded. */
export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  if (texts.length === 0) return [];
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY is not configured");
  }

  // Clean the text to optimize embedding generation
  const cleanTexts = texts.map((text) => text.trim().replace(/\n/g, " "));

  try {
    const response = await fetch("https://openrouter.ai/api/v1/embeddings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
        "X-Title": "AI Study Platform",
      },
      body: JSON.stringify({
        model: "openai/text-embedding-3-small", // Outputs 1536-dimensional embeddings
        input: cleanTexts,
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`Embeddings API failed: ${response.status} ${response.statusText} - ${errorBody}`);
    }

    const json = await response.json();
    if (!Array.isArray(json.data) || json.data.length !== cleanTexts.length || json.data.some((item: { embedding?: unknown }) => !Array.isArray(item.embedding))) {
      throw new Error("Invalid response format from embeddings API");
    }

    return json.data
      .sort((a: { index?: number }, b: { index?: number }) => (a.index ?? 0) - (b.index ?? 0))
      .map((item: { embedding: number[] }) => item.embedding);
  } catch (error) {
    console.error("[Embeddings] Error generating embedding:", error instanceof Error ? error.name : "UnknownError");
    throw error;
  }
}
