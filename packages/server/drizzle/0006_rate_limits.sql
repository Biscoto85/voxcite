-- Rate-limiting table for cross-process (PM2 cluster) rate limiting.
-- Uses atomic upsert (INSERT ... ON CONFLICT DO UPDATE) to correctly
-- count requests across multiple Node.js worker processes.

CREATE TABLE IF NOT EXISTS "rate_limits" (
  "ip"       text    NOT NULL,
  "limiter"  text    NOT NULL,
  "count"    integer NOT NULL DEFAULT 1,
  "reset_at" timestamp NOT NULL,
  CONSTRAINT "rate_limits_pk" PRIMARY KEY ("ip", "limiter")
);

CREATE INDEX IF NOT EXISTS "rate_limits_reset_at_idx" ON "rate_limits" ("reset_at");
