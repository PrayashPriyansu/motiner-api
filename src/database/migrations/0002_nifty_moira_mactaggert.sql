ALTER TABLE "sites" ALTER COLUMN "status" SET DATA TYPE text;--> statement-breakpoint
DROP TYPE "public"."status";--> statement-breakpoint
CREATE TYPE "public"."status" AS ENUM('active', 'archive', 'not_tracking', 'delete');--> statement-breakpoint
ALTER TABLE "sites" ALTER COLUMN "status" SET DATA TYPE "public"."status" USING "status"::"public"."status";