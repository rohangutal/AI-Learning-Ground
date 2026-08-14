CREATE TABLE "exam_analysis" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"exam_id" uuid NOT NULL,
	"most_repeated_questions" jsonb NOT NULL,
	"important_topics" jsonb NOT NULL,
	"frequently_asked_topics" jsonb NOT NULL,
	"most_probable_questions" jsonb NOT NULL,
	"topic_frequency" jsonb NOT NULL,
	"unit_weightage" jsonb NOT NULL,
	"marks_distribution" jsonb NOT NULL,
	"question_types" jsonb NOT NULL,
	"difficulty_distribution" jsonb NOT NULL,
	"year_wise_trends" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "exam_analysis_exam_id_unique" UNIQUE("exam_id")
);
--> statement-breakpoint
CREATE TABLE "exam_papers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"exam_id" uuid NOT NULL,
	"filename" varchar(255) NOT NULL,
	"file_url" text NOT NULL,
	"status" varchar(50) NOT NULL,
	"year" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "exam_questions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"exam_id" uuid NOT NULL,
	"paper_id" uuid,
	"question_text" text NOT NULL,
	"marks" integer,
	"question_type" varchar(100),
	"topics" jsonb,
	"difficulty" varchar(50),
	"year" integer,
	"is_repeated" boolean DEFAULT false,
	"repeated_question_id" uuid,
	"explanation" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "exams" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"subject" varchar(255) NOT NULL,
	"semester_branch" varchar(255) NOT NULL,
	"exam_date" timestamp NOT NULL,
	"total_marks" integer NOT NULL,
	"syllabus" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "exam_analysis" ADD CONSTRAINT "exam_analysis_exam_id_exams_id_fk" FOREIGN KEY ("exam_id") REFERENCES "public"."exams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exam_papers" ADD CONSTRAINT "exam_papers_exam_id_exams_id_fk" FOREIGN KEY ("exam_id") REFERENCES "public"."exams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exam_questions" ADD CONSTRAINT "exam_questions_exam_id_exams_id_fk" FOREIGN KEY ("exam_id") REFERENCES "public"."exams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exam_questions" ADD CONSTRAINT "exam_questions_paper_id_exam_papers_id_fk" FOREIGN KEY ("paper_id") REFERENCES "public"."exam_papers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exams" ADD CONSTRAINT "exams_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;