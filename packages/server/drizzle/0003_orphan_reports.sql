-- Migration: table orphan_reports — déclarations "orphelin politique" anonymes
-- Séparée des snapshots pour permettre une réponse tardive (dans Mon analyse / vs Partis)

CREATE TABLE IF NOT EXISTS "orphan_reports" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "is_orphan" boolean NOT NULL,
  "created_at" timestamp NOT NULL DEFAULT now()
);
