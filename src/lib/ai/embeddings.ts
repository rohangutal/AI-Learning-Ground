/**
 * Generate vector embeddings for a given text query.
 * Uses OpenRouter's embeddings API with openai/text-embedding-3-small (1536 dimensions).
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY is not configured");
  }

  // Clean the text to optimize embedding generation
  const cleanText = text.trim().replace(/\n/g, " ");

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
        input: cleanText,
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`Embeddings API failed: ${response.status} ${response.statusText} - ${errorBody}`);
    }

    const json = await response.json();
    if (!json.data || !json.data[0] || !json.data[0].embedding) {
      throw new Error("Invalid response format from embeddings API");
    }

    return json.data[0].embedding;
  } catch (error) {
    console.error("[Embeddings] Error generating embedding:", error);
    throw error;
  }
}
