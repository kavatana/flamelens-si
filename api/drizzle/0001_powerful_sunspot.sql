CREATE TABLE "feedback" (
	"id" serial PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"visitor" text NOT NULL,
	"kind" text NOT NULL,
	"rating" text NOT NULL,
	"page" text NOT NULL,
	"question" text,
	"cabin" jsonb
);
--> statement-breakpoint
CREATE TABLE "footage" (
	"id" text PRIMARY KEY NOT NULL,
	"record_id" text NOT NULL,
	"accession" text NOT NULL,
	"view" text NOT NULL,
	"file_name" text NOT NULL,
	"version" integer NOT NULL,
	"size_bytes" bigint NOT NULL
);
--> statement-breakpoint
ALTER TABLE "footage" ADD CONSTRAINT "footage_record_id_record_id_fk" FOREIGN KEY ("record_id") REFERENCES "public"."record"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "feedback_visitor_idx" ON "feedback" USING btree ("visitor","created_at");--> statement-breakpoint
CREATE INDEX "footage_record_idx" ON "footage" USING btree ("record_id");