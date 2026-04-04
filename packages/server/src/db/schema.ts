import { pgTable, uuid, text, real, timestamp, integer, boolean, jsonb } from 'drizzle-orm/pg-core';

// ── Domaines thématiques (10 entrées, seed depuis data/domains.yaml) ──

export const domains = pgTable('domains', {
  id: text('id').primaryKey(),
  label: text('label').notNull(),
  order: integer('order').notNull(),
  description: text('description'),
  dimensionSocietale: jsonb('dimension_societale'),
  dimensionEconomique: jsonb('dimension_economique'),
});

// ── Thèmes permanents (~50 entrées, seed depuis data/domains.yaml) ──

export const themes = pgTable('themes', {
  id: text('id').primaryKey(),
  domainId: text('domain_id').references(() => domains.id).notNull(),
  label: text('label').notNull(),
  description: text('description'),
});

// ── Questions de positionnement (seed depuis data/questions/) ──

export const questions = pgTable('questions', {
  id: text('id').primaryKey(),
  text: text('text').notNull(),
  type: text('type').notNull(),           // 'affirmation' | 'dilemme'
  axis: text('axis').notNull(),           // axe principal (rétrocompat)
  axes: jsonb('axes'),                    // tableau d'axes spécifiques si multi-axes
  polarity: real('polarity').notNull(),
  domainId: text('domain_id').references(() => domains.id).notNull(),
  phase: text('phase').notNull(),
  weight: real('weight').notNull().default(1.0),
  options: jsonb('options'),
});

// ── Partis politiques (seed depuis data/parties/parties.yaml) ──
// Les 5 positions sont issues du fichier YAML (estimations éditoriales)

export const partis = pgTable('partis', {
  id: text('id').primaryKey(),
  label: text('label').notNull(),
  abbreviation: text('abbreviation').notNull(),
  position1d: real('position_1d').notNull(),
  positionSocietal: real('position_societal').notNull(),
  positionEconomic: real('position_economic').notNull(),
  positionAuthority: real('position_authority').notNull(),
  positionEcology: real('position_ecology').notNull(),
  positionSovereignty: real('position_sovereignty').notNull(),
  color: text('color').notNull(),
  leader: text('leader'),
  visibleOnCompass: boolean('visible_on_compass').notNull().default(true),
});

// ── Médias (seed depuis data/medias/) ──

export const medias = pgTable('medias', {
  id: text('id').primaryKey(),
  label: text('label').notNull(),
  type: text('type').notNull(),
  position1d: real('position_1d').notNull(),
  positionSocietal: real('position_societal').notNull(),
  positionEconomic: real('position_economic').notNull(),
  positionAuthority: real('position_authority').notNull(),
  positionEcology: real('position_ecology').notNull(),
  positionSovereignty: real('position_sovereignty').notNull(),
  owner: text('owner'),
  visibleOnCompass: boolean('visible_on_compass').notNull().default(true),
});

// ── Sessions anonymes ──

export const sessions = pgTable('sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  position1d: real('position_1d'),
  positionSocietal: real('position_societal'),
  positionEconomic: real('position_economic'),
  positionAuthority: real('position_authority'),
  positionEcology: real('position_ecology'),
  positionSovereignty: real('position_sovereignty'),
  onboardingCompleted: boolean('onboarding_completed').notNull().default(false),
  postalCode: text('postal_code'),                         // code postal du répondant
  ipCountry: text('ip_country'),                           // pays déduit de l'IP
  ipRegion: text('ip_region'),                             // région déduite de l'IP
  deviceFingerprint: text('device_fingerprint'),
  shareCount: integer('share_count').notNull().default(0),
});

// ── Réponses aux questions ──

export const responses = pgTable('responses', {
  id: uuid('id').primaryKey().defaultRandom(),
  sessionId: uuid('session_id').references(() => sessions.id).notNull(),
  questionId: text('question_id').references(() => questions.id).notNull(),
  value: real('value').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// ── Sujets d'actualité ──

export const subjects = pgTable('subjects', {
  id: text('id').primaryKey(),
  domainId: text('domain_id').references(() => domains.id).notNull(),
  label: text('label').notNull(),
  summary: text('summary'),
  datePublished: timestamp('date_published').notNull().defaultNow(),
  dateExpires: timestamp('date_expires'),
  isActive: boolean('is_active').notNull().default(true),
  decryptage: jsonb('decryptage'),
});

// ── Avis citoyens ──

export const opinions = pgTable('opinions', {
  id: uuid('id').primaryKey().defaultRandom(),
  sessionId: uuid('session_id').references(() => sessions.id).notNull(),
  subjectId: text('subject_id').references(() => subjects.id).notNull(),
  positionSocietal: real('position_societal').notNull(),
  positionEconomic: real('position_economic').notNull(),
  positionAuthority: real('position_authority').notNull(),
  positionEcology: real('position_ecology').notNull(),
  positionSovereignty: real('position_sovereignty').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});
