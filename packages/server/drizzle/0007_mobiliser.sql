-- Migration 0007 — Me mobiliser : newsletter + événements citoyens
-- Données entièrement séparées des scores politiques.
-- Les emails ne sont jamais liés au positionnement. Jamais.

-- Abonnements newsletter (base légale : consentement explicite, art. 6.1.a RGPD)
CREATE TABLE IF NOT EXISTS "newsletter_subscriptions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "email" text NOT NULL,
  "domains" jsonb,
  "unsubscribe_token" uuid NOT NULL DEFAULT gen_random_uuid(),
  "created_at" timestamp NOT NULL DEFAULT now(),
  "is_active" boolean NOT NULL DEFAULT true
);
CREATE UNIQUE INDEX IF NOT EXISTS "newsletter_email_idx"
  ON "newsletter_subscriptions" ("email");
CREATE UNIQUE INDEX IF NOT EXISTS "newsletter_unsubscribe_token_idx"
  ON "newsletter_subscriptions" ("unsubscribe_token");

-- Événements citoyens validés (contenu éditorial approuvé par le bureau)
CREATE TABLE IF NOT EXISTS "civic_events" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "title" text NOT NULL,
  "description" text NOT NULL,
  "url" text,
  "event_date" timestamp,
  "location" text,
  "organizer" text NOT NULL,
  "category" text NOT NULL,
  "is_active" boolean NOT NULL DEFAULT true,
  "created_at" timestamp NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "civic_events_active_idx"
  ON "civic_events" ("is_active", "created_at");

-- Propositions d'événements (en attente de validation par le bureau)
CREATE TABLE IF NOT EXISTS "event_proposals" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "title" text NOT NULL,
  "description" text NOT NULL,
  "url" text,
  "event_date" timestamp,
  "location" text,
  "organizer" text NOT NULL,
  "category" text NOT NULL,
  "proposer_email" text,
  "non_partisan_acknowledged" boolean NOT NULL DEFAULT false,
  "status" text NOT NULL DEFAULT 'pending',
  "rejection_reason" text,
  "created_at" timestamp NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "event_proposals_status_idx"
  ON "event_proposals" ("status", "created_at");
