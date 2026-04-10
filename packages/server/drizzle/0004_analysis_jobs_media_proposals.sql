-- Analysis job queue (async AI processing)
CREATE TABLE IF NOT EXISTS "analysis_jobs" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "status" text NOT NULL DEFAULT 'pending',
  "request_data" jsonb NOT NULL,
  "result_data" jsonb,
  "error_message" text,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "completed_at" timestamp
);
CREATE INDEX IF NOT EXISTS "analysis_jobs_status_idx" ON "analysis_jobs" ("status");
CREATE INDEX IF NOT EXISTS "analysis_jobs_created_at_idx" ON "analysis_jobs" ("created_at");

-- Media proposals (users can suggest unlisted media outlets)
CREATE TABLE IF NOT EXISTS "media_proposals" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "url" text NOT NULL,
  "label" text NOT NULL,
  "notes" text,
  "status" text NOT NULL DEFAULT 'pending',
  "created_at" timestamp NOT NULL DEFAULT now()
);

-- Clean up old jobs after 7 days (run manually or via cron)
-- DELETE FROM analysis_jobs WHERE created_at < NOW() - INTERVAL '7 days';
