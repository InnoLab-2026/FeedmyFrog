CREATE TYPE "public"."listing_type" AS ENUM('need', 'offer');--> statement-breakpoint
CREATE TABLE "listings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"email" text NOT NULL,
	"type" "listing_type" NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"tags" text[] DEFAULT '{}' NOT NULL,
	"location" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "magic_tokens" (
	"token_hash" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"consumed" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rate_limits" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"key" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "idx_listings_type_created" ON "listings" USING btree ("type","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "idx_listings_user" ON "listings" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_magic_tokens_email" ON "magic_tokens" USING btree ("email");--> statement-breakpoint
CREATE INDEX "idx_magic_tokens_expires" ON "magic_tokens" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "idx_rate_limits_key_created" ON "rate_limits" USING btree ("key","created_at");