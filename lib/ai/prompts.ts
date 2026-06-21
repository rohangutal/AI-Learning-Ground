import { z } from "zod";

// ==========================================
// Zod Schemas for Structured AI Responses
// ==========================================

export const VariableSchema = z.object({
  symbol: z.string().describe("The variable symbol (e.g. 'E', 'm', 'c')"),
  meaning: z.string().describe("What the symbol represents (e.g. 'energy', 'mass', 'speed of light')"),
  unit: z.string().describe("The standard SI unit of the variable if applicable (e.g. 'Joules', 'kg', 'm/s')"),
});

export const FormulaItemSchema = z.object({
  name: z.string().describe("The name of the formula, theorem, or equation (e.g. 'Einstein's Mass-Energy Equivalence')"),
  latex: z.string().describe("The LaTeX representation of the formula (without outer $ or $$ delimiters)"),
  description: z.string().describe("Brief explanation of what the formula computes or represents"),
  variables: z.array(VariableSchema).describe("List of variables present in the formula"),
  example: z.string().describe("A clear, simple numerical example showing how to apply the formula step-by-step"),
});

export const FormulaExtractionSchema = z.object({
  formulas: z.array(FormulaItemSchema),
});

export const TopicExplanationSchema = z.object({
  topic: z.string().describe("The concept or topic being explained"),
  simpleExplanation: z.string().describe("A simple, intuitive explanation suitable for a beginner (Explain Like I'm 5 style)"),
  detailedExplanation: z.string().describe("A comprehensive, technically rigorous explanation including architectural or mathematical details where relevant"),
  analogy: z.string().describe("A memorable real-world analogy to help the student visualize and retain the concept"),
  keyTakeaways: z.array(z.string()).describe("3-5 high-yield key takeaways that are critical for exams or interviews"),
});

// ==========================================
// System Prompts & Prompt Templates
// ==========================================

export const SYSTEM_PROMPTS = {
  notesGenerator: `
You are an elite academic assistant and senior AI content curator. 
Your goal is to transform raw, unstructured text (lecture transcripts, documents, textbook excerpts) into highly structured, comprehensive, and beautiful study notes in Markdown format.

Follow these strict guidelines:
1. **Formatting**: Use clean Markdown. Utilize headers (##, ###), bold text, bullet lists, blockquotes, and tables for high readability.
2. **AI Formatting Pipeline**: 
   - Wrap technical terms or key vocabulary in **bold** or inline code tags.
   - Present comparative data in Markdown tables.
   - Use codeblocks with proper syntax highlighting for any programming code.
   - Ensure a clear hierarchy: Title (H1), core concepts (H2), sub-points (H3).
3. **Quality & Depth**: Do not skip details. Provide exhaustive coverage of the concepts presented in the source text. 
4. **Tone**: Educational, academic, encouraging, and clear.
5. **No Placeholders**: Write full explanations. Do not abbreviate or say "etc." without context.
`.trim(),

  summarizer: `
You are an expert summarization model. 
Your task is to review the provided material and generate a dense, high-impact summary.

Structure the output as follows:
- **High-Level Summary**: A 3-4 sentence paragraph summarizing the core theme.
- **Key Learning Objectives**: What the student should know after reading this.
- **Core Concepts Summary**: Bullet points explaining the essential pillars of the content.
- **Quick Recap Table**: A summary table mapping terms/components to their functions/roles.
`.trim(),

  revisionNotes: `
You are an expert revision notes developer. 
Your job is to convert long-form content into rapid-review revision sheets (cheat-sheets) optimized for active recall.

Structure:
- Use bullet points exclusively.
- Highlight critical formulas, definitions, and facts.
- Include "Active Recall Questions" (Q&A style prompt) at the end of each section to test student memory.
- Keep sentences short, punchy, and high-impact.
`.trim(),

  formulaExtractor: `
You are an advanced mathematical and scientific parser. 
Your task is to analyze the text, identify all mathematical, physical, statistical, or chemical formulas/equations, and extract them into a structured JSON schema.
Ensure all LaTeX expressions are valid, syntactically correct, and exclude outer delimiters like $ or $$.
`.trim(),

  topicExplainer: `
You are a world-class educator who specializes in breaking down complex topics.
Explain the requested topic in a structured JSON response, providing a simple beginner explanation, a detailed technical breakdown, a real-world analogy, and key takeaways.
Use clear, easy-to-understand language while maintaining technical accuracy.
`.trim(),
};

// ==========================================
export const promptTemplates = {
  generateNotes: (
    sourceText: string,
    opts?: { style?: string; depth?: string; tone?: string; length?: string }
  ) => `
Please transform the following source content into complete, structured study notes.
Ensure you implement the AI Formatting Pipeline (tables, code blocks, structured headers, and emphasized key terms).

${opts?.style ? `- **Format Style**: Write the notes in the style of "${opts.style}".` : ""}
${opts?.depth ? `- **Target Depth/Complexity**: Explanations should be tailored for an "${opts.depth}" level student.` : ""}
${opts?.tone ? `- **Tone**: Maintain a "${opts.tone}" tone throughout.` : ""}
${opts?.length ? `- **Target Length**: The notes should be "${opts.length}" in length.` : ""}

SOURCE CONTENT:
${sourceText}
`.trim(),

  summarize: (sourceText: string) => `
Please summarize the following source content according to the summarizer system instructions.

SOURCE CONTENT:
${sourceText}
`.trim(),

  revisionNotes: (sourceText: string) => `
Please extract active-recall-focused revision notes from the following content.

SOURCE CONTENT:
${sourceText}
`.trim(),

  extractFormulas: (sourceText: string) => `
Please extract all formulas and equations from the following text.

SOURCE CONTENT:
${sourceText}
`.trim(),

  explainTopic: (topic: string, context?: string) => `
Please explain the topic: "${topic}"
${context ? `Use the following context to enrich the explanation:\n${context}` : ""}
`.trim(),
};
