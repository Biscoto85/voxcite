-- Migration: audit sources d'information v2
-- Ajoute les colonnes pour les 5 nouvelles questions de profil
-- Les anciennes colonnes (info_source) sont conservées pour la rétrocompatibilité

ALTER TABLE "snapshots"
  ADD COLUMN IF NOT EXISTS "info_formats" jsonb,
  ADD COLUMN IF NOT EXISTS "media_sources" jsonb,
  ADD COLUMN IF NOT EXISTS "info_diversity" text,
  ADD COLUMN IF NOT EXISTS "media_relationship" text;
