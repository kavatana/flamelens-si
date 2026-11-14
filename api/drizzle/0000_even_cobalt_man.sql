CREATE TABLE "document" (
	"id" serial PRIMARY KEY NOT NULL,
	"accession" text,
	"kind" text NOT NULL,
	"title" text NOT NULL,
	"body" text NOT NULL,
	"url" text NOT NULL,
	"search" "tsvector" GENERATED ALWAYS AS (setweight(to_tsvector('english', coalesce(title, '')), 'A') || setweight(to_tsvector('english', coalesce(body, '')), 'B')) STORED
);
--> statement-breakpoint
CREATE TABLE "interpretation" (
	"key" text PRIMARY KEY NOT NULL,
	"body" jsonb NOT NULL,
	"model" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "investigation" (
	"accession" text PRIMARY KEY NOT NULL,
	"sort" integer NOT NULL,
	"short" text NOT NULL,
	"expansion" text NOT NULL,
	"title" text NOT NULL,
	"acronym" text NOT NULL,
	"one_line" text NOT NULL,
	"project_type" text NOT NULL,
	"sub_research_area" text NOT NULL,
	"flight_platform" text NOT NULL,
	"platform" text NOT NULL,
	"family" text NOT NULL,
	"builds_on" text[] NOT NULL,
	"related" text[] NOT NULL,
	"fuel_phases" text[] NOT NULL,
	"emulates" jsonb,
	"fire_phases" text[] NOT NULL,
	"varied" text[] NOT NULL,
	"keywords" text[] NOT NULL,
	"relevance_level" integer NOT NULL,
	"relevance" jsonb NOT NULL,
	"pillars" jsonb NOT NULL,
	"insights" jsonb NOT NULL,
	"earth" jsonb,
	"measurements" jsonb NOT NULL,
	"objective" text NOT NULL,
	"approach" text NOT NULL,
	"hypothesis" text NOT NULL,
	"research_impacts" text NOT NULL,
	"hardware" jsonb NOT NULL,
	"contacts" jsonb NOT NULL,
	"start_date" text NOT NULL,
	"end_date" text NOT NULL,
	"release_date" text NOT NULL,
	"doi" text NOT NULL,
	"license" text NOT NULL,
	"total_bytes" bigint NOT NULL,
	"file_count" integer NOT NULL,
	"files" jsonb NOT NULL,
	"stats" jsonb NOT NULL,
	"psi_url" text NOT NULL,
	"record_complete" boolean NOT NULL
);
--> statement-breakpoint
CREATE TABLE "publication" (
	"id" serial PRIMARY KEY NOT NULL,
	"accession" text NOT NULL,
	"seq" integer NOT NULL,
	"title" text NOT NULL,
	"authors" text NOT NULL,
	"doi" text NOT NULL,
	"status" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "quality_finding" (
	"id" serial PRIMARY KEY NOT NULL,
	"accession" text NOT NULL,
	"table_file" text NOT NULL,
	"kind" text NOT NULL,
	"message" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "record_value" (
	"record_id" text NOT NULL,
	"variable_id" text NOT NULL,
	"num_min" double precision,
	"num_max" double precision,
	"levels" double precision[],
	"text_value" text,
	"bool_value" boolean,
	"approx" boolean DEFAULT false NOT NULL,
	"suspect" boolean DEFAULT false NOT NULL,
	"raw" text NOT NULL,
	"source_column" text NOT NULL,
	"quality" text NOT NULL,
	"note" text,
	"evidence" text,
	"evidence_source" text,
	CONSTRAINT "record_value_record_id_variable_id_pk" PRIMARY KEY("record_id","variable_id")
);
--> statement-breakpoint
CREATE TABLE "record" (
	"id" text PRIMARY KEY NOT NULL,
	"accession" text NOT NULL,
	"table_file" text NOT NULL,
	"row" integer NOT NULL,
	"kind" text NOT NULL,
	"label" text NOT NULL,
	"test_date" text,
	"o2_min" double precision,
	"o2_max" double precision,
	"o2_levels" double precision[],
	"o2_quality" text,
	"o2_basis" text,
	"pressure_min" double precision,
	"pressure_max" double precision,
	"pressure_levels" double precision[],
	"pressure_quality" text,
	"flow_min" double precision,
	"flow_max" double precision,
	"fuel" text,
	"fuel_phase" text,
	"geometry" text,
	"end_mode" text,
	"ignited" boolean,
	"original" jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reference" (
	"key" text PRIMARY KEY NOT NULL,
	"data" jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "source_table" (
	"file_name" text PRIMARY KEY NOT NULL,
	"accession" text NOT NULL,
	"code" text NOT NULL,
	"title" text NOT NULL,
	"record_kind" text NOT NULL,
	"rows_in_file" integer NOT NULL,
	"records" integer NOT NULL,
	"columns" jsonb NOT NULL,
	"constants" jsonb NOT NULL,
	"footnotes" jsonb NOT NULL,
	"header_notes" jsonb NOT NULL,
	"record_note" text NOT NULL,
	"excluded" jsonb NOT NULL,
	"source_url" text NOT NULL,
	"sha256" text NOT NULL,
	"fetched_at" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "usage" (
	"id" serial PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"visitor" text NOT NULL,
	"route" text NOT NULL,
	"input_tokens" integer DEFAULT 0 NOT NULL,
	"output_tokens" integer DEFAULT 0 NOT NULL,
	"cost_usd" double precision DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "variable" (
	"id" text PRIMARY KEY NOT NULL,
	"sort" integer NOT NULL,
	"label" text NOT NULL,
	"unit" text NOT NULL,
	"kind" text NOT NULL,
	"grp" text NOT NULL,
	"description" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "publication" ADD CONSTRAINT "publication_accession_investigation_accession_fk" FOREIGN KEY ("accession") REFERENCES "public"."investigation"("accession") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "record_value" ADD CONSTRAINT "record_value_record_id_record_id_fk" FOREIGN KEY ("record_id") REFERENCES "public"."record"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "record_value" ADD CONSTRAINT "record_value_variable_id_variable_id_fk" FOREIGN KEY ("variable_id") REFERENCES "public"."variable"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "record" ADD CONSTRAINT "record_accession_investigation_accession_fk" FOREIGN KEY ("accession") REFERENCES "public"."investigation"("accession") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "record" ADD CONSTRAINT "record_table_file_source_table_file_name_fk" FOREIGN KEY ("table_file") REFERENCES "public"."source_table"("file_name") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "source_table" ADD CONSTRAINT "source_table_accession_investigation_accession_fk" FOREIGN KEY ("accession") REFERENCES "public"."investigation"("accession") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "document_search_idx" ON "document" USING gin ("search");--> statement-breakpoint
CREATE INDEX "publication_accession_idx" ON "publication" USING btree ("accession");--> statement-breakpoint
CREATE INDEX "record_value_variable_idx" ON "record_value" USING btree ("variable_id","num_min");--> statement-breakpoint
CREATE INDEX "record_accession_idx" ON "record" USING btree ("accession");--> statement-breakpoint
CREATE INDEX "record_o2_pressure_idx" ON "record" USING btree ("o2_min","pressure_min");--> statement-breakpoint
CREATE INDEX "record_fuel_phase_idx" ON "record" USING btree ("fuel_phase");--> statement-breakpoint
CREATE INDEX "usage_created_idx" ON "usage" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "usage_visitor_idx" ON "usage" USING btree ("visitor","created_at");