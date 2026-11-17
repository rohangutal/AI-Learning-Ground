import { pgTable, text, timestamp, uuid, varchar, vector, integer, jsonb, boolean, pgEnum, index, uniqueIndex } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const subscriptionTierEnum = pgEnum("subscription_tier", ["free", "pro"]);
export const uploadTypeEnum = pgEnum("upload_type", ["pdf", "youtube", "image"]);
export const studyDocumentTypeEnum = pgEnum("study_document_type", ["pdf", "docx", "pptx"]);
export const studyDocumentStatusEnum = pgEnum("study_document_status", ["queued", "processing", "ready", "failed"]);
export const promptTypeEnum = pgEnum("prompt_type", ["summary", "flashcard", "quiz", "chat"]);

export const users = pgTable("users", {
  id: uuid("id").primaryKey(), // Maps directly to Supabase auth.users.id
  email: varchar("email", { length: 255 }).notNull().unique(),
  fullName: varchar("full_name", { length: 255 }),
  avatarUrl: text("avatar_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const subscriptions = pgTable("subscriptions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull().unique(),
  tier: subscriptionTierEnum("tier").default("free").notNull(),
  stripeCustomerId: varchar("stripe_customer_id", { length: 255 }),
  stripeSubscriptionId: varchar("stripe_subscription_id", { length: 255 }),
  currentPeriodEnd: timestamp("current_period_end"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const folders = pgTable("folders", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const notes = pgTable("notes", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  folderId: uuid("folder_id").references(() => folders.id, { onDelete: "set null" }),
  title: varchar("title", { length: 255 }).notNull(),
  content: text("content"),
  embedding: vector("embedding", { dimensions: 1536 }), // OpenAI/OpenRouter embeddings size
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const uploads = pgTable("uploads", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  noteId: uuid("note_id").references(() => notes.id, { onDelete: "set null" }),
  filename: varchar("filename", { length: 255 }).notNull(),
  fileUrl: text("file_url").notNull(),
  sizeBytes: integer("size_bytes").notNull(),
  type: uploadTypeEnum("type").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

/** Private source files managed by the AI tutor document library. */
export const studyDocuments = pgTable("study_documents", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  filename: varchar("filename", { length: 255 }).notNull(),
  storagePath: text("storage_path").notNull(),
  mimeType: varchar("mime_type", { length: 127 }).notNull(),
  sizeBytes: integer("size_bytes").notNull(),
  type: studyDocumentTypeEnum("type").notNull(),
  status: studyDocumentStatusEnum("status").default("queued").notNull(),
  processingError: text("processing_error"),
  chunkCount: integer("chunk_count").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  userCreatedIdx: index("study_documents_user_created_idx").on(table.userId, table.createdAt),
  storagePathUnique: uniqueIndex("study_documents_storage_path_unique").on(table.storagePath),
}));

/** Extracted text chunks with source location and vector for grounded tutor answers. */
export const studyDocumentChunks = pgTable("study_document_chunks", {
  id: uuid("id").primaryKey().defaultRandom(),
  documentId: uuid("document_id").references(() => studyDocuments.id, { onDelete: "cascade" }).notNull(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  chunkIndex: integer("chunk_index").notNull(),
  content: text("content").notNull(),
  pageNumber: integer("page_number"),
  slideNumber: integer("slide_number"),
  section: varchar("section", { length: 255 }),
  embedding: vector("embedding", { dimensions: 1536 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  documentChunkUnique: uniqueIndex("study_document_chunks_document_chunk_unique").on(table.documentId, table.chunkIndex),
  userDocumentIdx: index("study_document_chunks_user_document_idx").on(table.userId, table.documentId),
}));

export const flashcards = pgTable("flashcards", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  noteId: uuid("note_id").references(() => notes.id, { onDelete: "cascade" }),
  front: text("front").notNull(),
  back: text("back").notNull(),
  embedding: vector("embedding", { dimensions: 1536 }),
  nextReviewDate: timestamp("next_review_date").defaultNow().notNull(),
  interval: integer("interval").default(0).notNull(), // days
  easeFactor: integer("ease_factor").default(250).notNull(), // 2.5 * 100
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const quizzes = pgTable("quizzes", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  noteId: uuid("note_id").references(() => notes.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 255 }).notNull(),
  questions: jsonb("questions").notNull(), // Array of question objects
  score: integer("score"),
  totalQuestions: integer("total_questions").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const aiGenerations = pgTable("ai_generations", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  promptType: promptTypeEnum("prompt_type").notNull(),
  tokenCount: integer("token_count").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const studySessions = pgTable("study_sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time"),
  durationMinutes: integer("duration_minutes"),
  focusScore: integer("focus_score"), // 1-100
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Relations
export const usersRelations = relations(users, ({ one, many }) => ({
  subscription: one(subscriptions, {
    fields: [users.id],
    references: [subscriptions.userId],
  }),
  folders: many(folders),
  notes: many(notes),
  uploads: many(uploads),
  studyDocuments: many(studyDocuments),
  studyDocumentChunks: many(studyDocumentChunks),
  flashcards: many(flashcards),
  quizzes: many(quizzes),
  studySessions: many(studySessions),
  aiGenerations: many(aiGenerations),
  exams: many(exams),
  roadmaps: many(roadmaps),
  cheatsheets: many(cheatsheets),
}));

export const subscriptionsRelations = relations(subscriptions, ({ one }) => ({
  user: one(users, {
    fields: [subscriptions.userId],
    references: [users.id],
  }),
}));

export const foldersRelations = relations(folders, ({ one, many }) => ({
  user: one(users, {
    fields: [folders.userId],
    references: [users.id],
  }),
  notes: many(notes),
}));

export const notesRelations = relations(notes, ({ one, many }) => ({
  user: one(users, {
    fields: [notes.userId],
    references: [users.id],
  }),
  folder: one(folders, {
    fields: [notes.folderId],
    references: [folders.id],
  }),
  uploads: many(uploads),
  flashcards: many(flashcards),
  quizzes: many(quizzes),
}));

export const uploadsRelations = relations(uploads, ({ one }) => ({
  user: one(users, {
    fields: [uploads.userId],
    references: [users.id],
  }),
  note: one(notes, {
    fields: [uploads.noteId],
    references: [notes.id],
  }),
}));

export const studyDocumentsRelations = relations(studyDocuments, ({ one, many }) => ({
  user: one(users, { fields: [studyDocuments.userId], references: [users.id] }),
  chunks: many(studyDocumentChunks),
}));

export const studyDocumentChunksRelations = relations(studyDocumentChunks, ({ one }) => ({
  document: one(studyDocuments, { fields: [studyDocumentChunks.documentId], references: [studyDocuments.id] }),
  user: one(users, { fields: [studyDocumentChunks.userId], references: [users.id] }),
}));

export const flashcardsRelations = relations(flashcards, ({ one }) => ({
  user: one(users, {
    fields: [flashcards.userId],
    references: [users.id],
  }),
  note: one(notes, {
    fields: [flashcards.noteId],
    references: [notes.id],
  }),
}));

export const quizzesRelations = relations(quizzes, ({ one }) => ({
  user: one(users, {
    fields: [quizzes.userId],
    references: [users.id],
  }),
  note: one(notes, {
    fields: [quizzes.noteId],
    references: [notes.id],
  }),
}));

export const studySessionsRelations = relations(studySessions, ({ one }) => ({
  user: one(users, {
    fields: [studySessions.userId],
    references: [users.id],
  }),
}));

export const aiGenerationsRelations = relations(aiGenerations, ({ one }) => ({
  user: one(users, {
    fields: [aiGenerations.userId],
    references: [users.id],
  }),
}));

export const exams = pgTable("exams", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  subject: varchar("subject", { length: 255 }).notNull(),
  semesterBranch: varchar("semester_branch", { length: 255 }).notNull(),
  examDate: timestamp("exam_date").notNull(),
  totalMarks: integer("total_marks").notNull(),
  syllabus: text("syllabus"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const examPapers = pgTable("exam_papers", {
  id: uuid("id").primaryKey().defaultRandom(),
  examId: uuid("exam_id").references(() => exams.id, { onDelete: "cascade" }).notNull(),
  filename: varchar("filename", { length: 255 }).notNull(),
  fileUrl: text("file_url").notNull(),
  status: varchar("status", { length: 50 }).notNull(), // 'uploading' | 'extracting' | 'analyzed' | 'failed'
  year: integer("year"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const examQuestions = pgTable("exam_questions", {
  id: uuid("id").primaryKey().defaultRandom(),
  examId: uuid("exam_id").references(() => exams.id, { onDelete: "cascade" }).notNull(),
  paperId: uuid("paper_id").references(() => examPapers.id, { onDelete: "cascade" }),
  questionText: text("question_text").notNull(),
  marks: integer("marks"),
  questionType: varchar("question_type", { length: 100 }),
  topics: jsonb("topics"),
  difficulty: varchar("difficulty", { length: 50 }),
  year: integer("year"),
  isRepeated: boolean("is_repeated").default(false),
  repeatedQuestionId: uuid("repeated_question_id"),
  explanation: text("explanation"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const examAnalysis = pgTable("exam_analysis", {
  id: uuid("id").primaryKey().defaultRandom(),
  examId: uuid("exam_id").references(() => exams.id, { onDelete: "cascade" }).notNull().unique(),
  mostRepeatedQuestions: jsonb("most_repeated_questions").notNull(),
  importantTopics: jsonb("important_topics").notNull(),
  frequentlyAskedTopics: jsonb("frequently_asked_topics").notNull(),
  mostProbableQuestions: jsonb("most_probable_questions").notNull(),
  topicFrequency: jsonb("topic_frequency").notNull(),
  unitWeightage: jsonb("unit_weightage").notNull(),
  marksDistribution: jsonb("marks_distribution").notNull(),
  questionTypes: jsonb("question_types").notNull(),
  difficultyDistribution: jsonb("difficulty_distribution").notNull(),
  yearWiseTrends: jsonb("year_wise_trends").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const examsRelations = relations(exams, ({ one, many }) => ({
  user: one(users, {
    fields: [exams.userId],
    references: [users.id],
  }),
  papers: many(examPapers),
  questions: many(examQuestions),
  analysis: one(examAnalysis, {
    fields: [exams.id],
    references: [examAnalysis.examId],
  }),
}));

export const examPapersRelations = relations(examPapers, ({ one, many }) => ({
  exam: one(exams, {
    fields: [examPapers.examId],
    references: [exams.id],
  }),
  questions: many(examQuestions),
}));

export const examQuestionsRelations = relations(examQuestions, ({ one }) => ({
  exam: one(exams, {
    fields: [examQuestions.examId],
    references: [exams.id],
  }),
  paper: one(examPapers, {
    fields: [examQuestions.paperId],
    references: [examPapers.id],
  }),
}));

export const examAnalysisRelations = relations(examAnalysis, ({ one }) => ({
  exam: one(exams, {
    fields: [examAnalysis.examId],
    references: [exams.id],
  }),
}));

export const roadmaps = pgTable("roadmaps", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  targetLevel: varchar("target_level", { length: 50 }).notNull(), // 'Beginner' | 'Intermediate' | 'Advanced'
  duration: varchar("duration", { length: 50 }).notNull(),
  content: jsonb("content").notNull(),
  progress: jsonb("progress").default([]).notNull(), // list of completed milestone sub-task IDs or slugs
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const cheatsheets = pgTable("cheatsheets", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  content: jsonb("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const roadmapsRelations = relations(roadmaps, ({ one }) => ({
  user: one(users, {
    fields: [roadmaps.userId],
    references: [users.id],
  }),
}));

export const cheatsheetsRelations = relations(cheatsheets, ({ one }) => ({
  user: one(users, {
    fields: [cheatsheets.userId],
    references: [users.id],
  }),
}));

