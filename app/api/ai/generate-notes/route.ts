import {
  generateStudyNotesStream,
  summarizeTextStream,
  generateRevisionNotesStream,
  extractFormulas,
  explainTopic,
} from "@/lib/ai/engine";
import { createClient } from "@/lib/supabase/server";

export const maxDuration = 60; // Notes generation might take a bit longer

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const body = await req.json();
    const { action, sourceText, topic, context, style, depth, tone, length } = body;

    if (!action) {
      return new Response("Bad Request: 'action' is required", { status: 400 });
    }

    const options = { userId: user.id };

    switch (action) {
      case "notes": {
        if (!sourceText) {
          return new Response("Bad Request: 'sourceText' is required for notes generation", { status: 400 });
        }
        const result = await generateStudyNotesStream(sourceText, {
          ...options,
          style,
          depth,
          tone,
          length,
        });
        return result.toTextStreamResponse();
      }

      case "summary": {
        if (!sourceText) {
          return new Response("Bad Request: 'sourceText' is required for summarization", { status: 400 });
        }
        const result = await summarizeTextStream(sourceText, options);
        return result.toTextStreamResponse();
      }

      case "revision": {
        if (!sourceText) {
          return new Response("Bad Request: 'sourceText' is required for revision notes generation", { status: 400 });
        }
        const result = await generateRevisionNotesStream(sourceText, options);
        return result.toTextStreamResponse();
      }

      case "formulas": {
        if (!sourceText) {
          return new Response("Bad Request: 'sourceText' is required for formula extraction", { status: 400 });
        }
        const formulas = await extractFormulas(sourceText, options);
        return new Response(JSON.stringify(formulas), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }

      case "explain": {
        if (!topic) {
          return new Response("Bad Request: 'topic' is required for topic explanation", { status: 400 });
        }
        const explanation = await explainTopic(topic, context, options);
        return new Response(JSON.stringify(explanation), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }

      default:
        return new Response(`Bad Request: Unknown action '${action}'`, { status: 400 });
    }
  } catch (error: any) {
    console.error(`[Generate Notes API Error] Action failed:`, error);
    return new Response(JSON.stringify({ error: error.message || "Failed to process request" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
