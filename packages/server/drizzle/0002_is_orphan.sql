-- Migration: add is_orphan column to snapshots
-- Sprint 2 — question "orphelin politique" posée dans CompassReveal

ALTER TABLE "snapshots"
  ADD COLUMN IF NOT EXISTS "is_orphan" boolean;
