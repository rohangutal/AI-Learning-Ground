import { pgTable, text, timestamp, uuid, varchar, vector, integer, jsonb, boolean, pgEnum } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const subscriptionTierEnum = pgEnum("subscription_tier", ["free", "pro"]);
export const uploadTypeEnum = pgEnum("upload_type", ["pdf", "youtube", "image"]);
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
  flashcards: many(flashcards),
  quizzes: many(quizzes),
  studySessions: many(studySessions),
  aiGenerations: many(aiGenerations),
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
