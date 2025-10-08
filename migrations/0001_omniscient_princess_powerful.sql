CREATE TYPE "public"."decision" AS ENUM('APPROVE', 'REJECT');--> statement-breakpoint
CREATE TYPE "public"."file_kind" AS ENUM('FACTURE', 'CONTRAT', 'RECU', 'AUTRE');--> statement-breakpoint
CREATE TYPE "public"."submission_status" AS ENUM('DRAFT', 'SUBMITTED', 'IN_REVIEW', 'APPROVED', 'REJECTED');--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "comment" (
	"id" text PRIMARY KEY DEFAULT 'cuid()' NOT NULL,
	"submission_id" text NOT NULL,
	"user_id" text NOT NULL,
	"text" text NOT NULL,
	"decision" "decision",
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "file" (
	"id" text PRIMARY KEY DEFAULT 'cuid()' NOT NULL,
	"submission_id" text NOT NULL,
	"kind" "file_kind" NOT NULL,
	"object_key" text NOT NULL,
	"size" integer NOT NULL,
	"mime" text NOT NULL,
	"ocr_text" text,
	"ai_data" json,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "submission" (
	"id" text PRIMARY KEY DEFAULT 'cuid()' NOT NULL,
	"organization_id" text NOT NULL,
	"type" text NOT NULL,
	"title" text,
	"amount" numeric(10, 2),
	"spent_at" timestamp,
	"status" "submission_status" DEFAULT 'DRAFT' NOT NULL,
	"created_by" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "organization" ADD COLUMN "name" text NOT NULL;--> statement-breakpoint
ALTER TABLE "organization" ADD COLUMN "subdomain" text NOT NULL;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "comment" ADD CONSTRAINT "comment_submission_id_submission_id_fk" FOREIGN KEY ("submission_id") REFERENCES "public"."submission"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "file" ADD CONSTRAINT "file_submission_id_submission_id_fk" FOREIGN KEY ("submission_id") REFERENCES "public"."submission"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "submission" ADD CONSTRAINT "submission_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "comment_submission_id_idx" ON "comment" USING btree ("submission_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "comment_user_id_idx" ON "comment" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "comment_created_at_idx" ON "comment" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "file_submission_id_idx" ON "file" USING btree ("submission_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "file_object_key_idx" ON "file" USING btree ("object_key");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "submission_organization_id_idx" ON "submission" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "submission_status_idx" ON "submission" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "submission_created_at_idx" ON "submission" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "organization_subdomain_idx" ON "organization" USING btree ("subdomain");--> statement-breakpoint
ALTER TABLE "organization" ADD CONSTRAINT "organization_subdomain_unique" UNIQUE("subdomain");