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

export const FlashcardItemSchema = z.object({
  front: z.string().describe("A concise question or term to trigger active recall (e.g. 'What is the speed of light?')"),
  back: z.string().describe("A clear, concise answer, explanation, or definition (e.g. 'Approximately 299,792,458 meters per second (c).')"),
});

export const FlashcardListSchema = z.object({
  flashcards: z.array(FlashcardItemSchema).describe("A list of high-quality active recall flashcards"),
});

export const QuizQuestionSchema = z.object({
  question: z.string().describe("The multiple choice question text"),
  options: z.array(z.string()).min(2).max(6).describe("List of options (usually 4) for the question"),
  answer: z.string().describe("The exact correct option from the options list"),
  explanation: z.string().describe("Brief explanation of why this option is correct"),
});

export const QuizSchema = z.object({
  title: z.string().describe("A catchy, relevant title for the quiz"),
  questions: z.array(QuizQuestionSchema).describe("List of multiple choice questions (usually 5-10)"),
});

export const RoadmapMilestoneSchema = z.object({
  id: z.string().describe("A unique slug/ID for this milestone (e.g. 'm1', 'phase-1')"),
  title: z.string().describe("Title of this phase (e.g. 'Basic Git Syntax')"),
  description: z.string().describe("Description of what this phase covers"),
  duration: z.string().describe("Recommended time (e.g. '2 days', '1 week')"),
  topics: z.array(z.string()).describe("Subtopics/concepts to learn in this phase"),
  keyTerms: z.array(z.string()).describe("Important terms to memorize"),
  resources: z.array(z.object({
    name: z.string().describe("Name of the resource/concept"),
    description: z.string().describe("Detailed strategy or sub-steps to study this concept")
  })).describe("Study recommendations and guides")
});

export const RoadmapSchema = z.object({
  title: z.string().describe("A descriptive, catchy title for this roadmap"),
  description: z.string().describe("An encouraging overview of the roadmap path"),
  milestones: z.array(RoadmapMilestoneSchema).describe("Sequential study path milestones")
});

export const CheatsheetItemSchema = z.object({
  title: z.string().describe("Concept or action (e.g. 'Commit Changes')"),
  syntax: z.string().describe("Actual code command, formula, or syntactical template (e.g. 'git commit -m \"message\"')"),
  description: z.string().describe("Brief explanation of what it does"),
  example: z.string().optional().describe("Example usage or sample output")
});

export const CheatsheetSectionSchema = z.object({
  category: z.string().describe("Category/grouping name (e.g. 'Staging & Committing', 'React State Hook')"),
  items: z.array(CheatsheetItemSchema)
});

export const CheatsheetSchema = z.object({
  title: z.string().describe("A descriptive, catchy title for this cheatsheet"),
  description: z.string().describe("Overview of the cheatsheet coverage"),
  sections: z.array(CheatsheetSectionSchema)
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

  flashcardGenerator: `
You are an expert academic tutor.
Your task is to generate high-yield, active-recall flashcards on a requested topic or concept.
Each flashcard must contain a front (a clear, concise question or term) and a back (a concise, accurate, and easy-to-understand explanation or answer).
Avoid double-barreled questions. Keep cards focused on a single concept.
`.trim(),

  quizGenerator: `
You are an expert academic tutor.
Your task is to generate high-yield, multiple-choice quizzes on a requested topic or concept.
Each question must have a clear question, a set of options, the exact correct answer (which MUST match one of the options exactly), and a helpful explanation of why it is correct.
Ensure the questions test understanding of core concepts.
`.trim(),

  roadmapGenerator: `
You are a senior curriculum designer and educational architect.
Your goal is to build an interactive, logically ordered learning roadmap for any topic, concept, or domain.
Break the topic down into structured milestones/phases. Make it progressive, starting from foundational concepts and moving to advanced execution.
Each milestone must have clear topics to learn, key terms to memorize, and study recommendations.
`.trim(),

  cheatsheetGenerator: `
You are a world-class reference documentation writer.
Your job is to generate a comprehensive, highly structured reference sheet (cheatsheet) for a specific topic, library, framework, or language.
Group items logically into sections (categories).
Ensure code snippets, syntax, formulas, or rules are practical, clean, and exact. Provide clear and concise examples.
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

  generateFlashcards: (topic: string, count = 5, context?: string) => `
Please generate ${count} high-yield flashcards for the topic: "${topic}".
${context ? `Use the following study note content as the source material for the cards:\n${context}` : ""}
Ensure they are optimal for spaced repetition and active recall.
`.trim(),

  generateQuiz: (topic: string, count = 5, context?: string) => `
Please generate a multiple-choice quiz with ${count} questions on the topic: "${topic}".
${context ? `Use the following study note content as the source material for the questions:\n${context}` : ""}
Make sure it tests critical concepts, is challenging yet fair, and provides clear explanations.
`.trim(),

  generateRoadmap: (topic: string, targetLevel: string, duration: string) => `
Please design a sequential, progressive study roadmap for the topic: "${topic}".
Target Student Level: "${targetLevel}"
Estimated duration: "${duration}"
Break down the roadmap into logical, sequential milestones. For each milestone, provide:
1. Title and concise description of the milestone goals.
2. Estimated duration of that milestone.
3. List of core subtopics to learn.
4. Important terms/concepts to master.
5. Actionable study recommendations and guidance on how to practice/understand them.
`.trim(),

  generateCheatsheet: (topic: string) => `
Please create a high-yield, comprehensive reference cheatsheet for: "${topic}".
Identify the most important syntax, commands, concepts, functions, or patterns.
Group them into logical sections/categories (e.g. "Basic Commands", "Advanced Patterns", "Error Handling").
Each item inside a section must have:
- A descriptive title
- The exact code/syntax/command (if code, keep it exact; if a concept, keep it concise)
- A brief explanation
- A practical, simple example of its usage
`.trim(),
};
