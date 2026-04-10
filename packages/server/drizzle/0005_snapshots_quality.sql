-- Migration 0005: add quality_score to snapshots for anti-rage/robot detection
ALTER TABLE "snapshots" ADD COLUMN IF NOT EXISTS "quality_score" real;
