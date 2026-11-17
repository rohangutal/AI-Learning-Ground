CREATE TYPE "public"."study_document_status" AS ENUM('queued', 'processing', 'ready', 'failed');--> statement-breakpoint
CREATE TYPE "public"."study_document_type" AS ENUM('pdf', 'docx', 'pptx');--> statement-breakpoint
CREATE TABLE "study_document_chunks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"document_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"chunk_index" integer NOT NULL,
	"content" text NOT NULL,
	"page_number" integer,
	"slide_number" integer,
	"section" varchar(255),
	"embedding" vector(1536),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "study_documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"filename" varchar(255) NOT NULL,
	"storage_path" text NOT NULL,
	"mime_type" varchar(127) NOT NULL,
	"size_bytes" integer NOT NULL,
	"type" "study_document_type" NOT NULL,
	"status" "study_document_status" DEFAULT 'queued' NOT NULL,
	"processing_error" text,
	"chunk_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "study_document_chunks" ADD CONSTRAINT "study_document_chunks_document_id_study_documents_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."study_documents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "study_document_chunks" ADD CONSTRAINT "study_document_chunks_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "study_documents" ADD CONSTRAINT "study_documents_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "study_document_chunks_document_chunk_unique" ON "study_document_chunks" USING btree ("document_id","chunk_index");--> statement-breakpoint
CREATE INDEX "study_document_chunks_user_document_idx" ON "study_document_chunks" USING btree ("user_id","document_id");--> statement-breakpoint
CREATE INDEX "study_documents_user_created_idx" ON "study_documents" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "study_documents_storage_path_unique" ON "study_documents" USING btree ("storage_path");