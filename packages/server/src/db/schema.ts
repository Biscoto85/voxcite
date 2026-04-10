import { pgTable, uuid, text, real, timestamp, integer, boolean, jsonb, index } from 'drizzle-orm/pg-core';

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
  url: text('url'),
  position1d: real('position_1d').notNull(),
  positionSocietal: real('position_societal').notNull(),
  positionEconomic: real('position_economic').notNull(),
  positionAuthority: real('position_authority').notNull(),
  positionEcology: real('position_ecology').notNull(),
  positionSovereignty: real('position_sovereignty').notNull(),
  owner: text('owner'),
  independent: boolean('independent').notNull().default(false),
  editorialLabel: text('editorial_label'),
  visibleOnCompass: boolean('visible_on_compass').notNull().default(true),
  citizenSocietal: real('citizen_societal'),
  citizenEconomic: real('citizen_economic'),
  citizenRatingCount: integer('citizen_rating_count').notNull().default(0),
});

// ══════════════════════════════════════════════════════════════════════
// Architecture "Privacy by Design" — données 100% anonymes
//
// Aucune donnée n'est liée à un utilisateur identifiable.
// Pas de session serveur, pas d'IP stockée, pas de fingerprint.
// Le calcul de position se fait entièrement côté client (navigateur).
// Le serveur ne reçoit que des points anonymes sur la carte.
// ══════════════════════════════════════════════════════════════════════

// ── Snapshots anonymes (1 par onboarding terminé, pour la nébuleuse) ──
// Aucun identifiant de session, aucun lien possible entre snapshots.

export const snapshots = pgTable('snapshots', {
  id: uuid('id').primaryKey().defaultRandom(),
  postalCode: text('postal_code'),
  positionSocietal: real('position_societal').notNull(),
  positionEconomic: real('position_economic').notNull(),
  positionAuthority: real('position_authority').notNull(),
  positionEcology: real('position_ecology').notNull(),
  positionSovereignty: real('position_sovereignty').notNull(),
  infoSource: text('info_source'),         // legacy — conservé pour les anciens snapshots
  perceivedBias: text('perceived_bias'),   // 'gauche' | 'droite' | 'varie' | 'difficile'
  // Audit sources enrichi (v2)
  infoFormats: jsonb('info_formats'),      // string[] — formats multi-select
  mediaSources: jsonb('media_sources'),    // string[] — IDs de médias spécifiques (optionnel)
  infoDiversity: text('info_diversity'),   // 'regularly' | 'sometimes' | 'rarely' | 'never'
  mediaRelationship: text('media_relationship'), // 'trust' | 'critical' | 'independent' | 'avoid'
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// ── Votes anonymes individuels (pour les stats par question) ──
// Envoyés un par un, sans session, non liables entre eux.

export const votes = pgTable('votes', {
  id: uuid('id').primaryKey().defaultRandom(),
  questionId: text('question_id').references(() => questions.id).notNull(),
  value: real('value').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => [
  index('votes_question_id_idx').on(table.questionId),
]);

// ── Tables legacy (conservées pour migration, plus utilisées activement) ──

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
  postalCode: text('postal_code'),
  infoSource: text('info_source'),
  perceivedBias: text('perceived_bias'),
  ipCountry: text('ip_country'),
  ipRegion: text('ip_region'),
  deviceFingerprint: text('device_fingerprint'),
  shareCount: integer('share_count').notNull().default(0),
});

export const responses = pgTable('responses', {
  id: uuid('id').primaryKey().defaultRandom(),
  sessionId: uuid('session_id').references(() => sessions.id).notNull(),
  questionId: text('question_id').references(() => questions.id).notNull(),
  value: real('value').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => [
  index('responses_session_id_idx').on(table.sessionId),
]);

export const biases = pgTable('biases', {
  id: uuid('id').primaryKey().defaultRandom(),
  sessionId: uuid('session_id').references(() => sessions.id),
  category: text('category').notNull(),
  biasType: text('bias_type').notNull(),
  axis: text('axis').notNull(),
  description: text('description').notNull(),
  strength: real('strength').notNull(),
  detectedBy: text('detected_by').notNull(),
  suggestedContent: text('suggested_content'),
  suggestedSource: text('suggested_source'),
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

// ── Avis citoyens (anonyme — plus de lien session) ──

export const opinions = pgTable('opinions', {
  id: uuid('id').primaryKey().defaultRandom(),
  subjectId: text('subject_id').references(() => subjects.id).notNull(),
  positionSocietal: real('position_societal').notNull(),
  positionEconomic: real('position_economic').notNull(),
  positionAuthority: real('position_authority').notNull(),
  positionEcology: real('position_ecology').notNull(),
  positionSovereignty: real('position_sovereignty').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// ── Propositions citoyennes (anonyme) ──

export const proposals = pgTable('proposals', {
  id: uuid('id').primaryKey().defaultRandom(),
  domainId: text('domain_id').references(() => domains.id).notNull(),
  text: text('text').notNull(),
  source: text('source').notNull(),
  originalProposalId: uuid('original_proposal_id'),
  positionSocietal: real('position_societal'),
  positionEconomic: real('position_economic'),
  positionAuthority: real('position_authority'),
  positionEcology: real('position_ecology'),
  positionSovereignty: real('position_sovereignty'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => [
  index('proposals_domain_id_idx').on(table.domainId),
  index('proposals_source_idx').on(table.source),
]);

// ── Versions du programme citoyen ──

export const programVersions = pgTable('program_versions', {
  id: uuid('id').primaryKey().defaultRandom(),
  generatedAt: timestamp('generated_at').notNull().defaultNow(),
  content: jsonb('content').notNull(),
  evolutionSummary: text('evolution_summary'),
  totalProposals: integer('total_proposals').notNull().default(0),
  totalContributors: integer('total_contributors').notNull().default(0),
  isInitial: boolean('is_initial').notNull().default(false),
});

// ── Suggestions pré-générées ──

export const suggestions = pgTable('suggestions', {
  id: uuid('id').primaryKey().defaultRandom(),
  domainId: text('domain_id').references(() => domains.id).notNull(),
  text: text('text').notNull(),
  targetSocietal: real('target_societal'),
  targetEconomic: real('target_economic'),
  targetAuthority: real('target_authority'),
  targetEcology: real('target_ecology'),
  targetSovereignty: real('target_sovereignty'),
  generatedAt: timestamp('generated_at').notNull().defaultNow(),
  isActive: boolean('is_active').notNull().default(true),
});

// ── Liens partagés (Esprit critique — anonyme) ──

export const sharedLinks = pgTable('shared_links', {
  id: uuid('id').primaryKey().defaultRandom(),
  domainId: text('domain_id').references(() => domains.id).notNull(),
  url: text('url').notNull(),
  description: text('description').notNull(),
  validatedDescription: text('validated_description'),
  status: text('status').notNull().default('pending'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// ── Évaluations médias (anonyme) ──

export const mediaRatings = pgTable('media_ratings', {
  id: uuid('id').primaryKey().defaultRandom(),
  mediaId: text('media_id').references(() => medias.id).notNull(),
  ratedSocietal: real('rated_societal').notNull(),
  ratedEconomic: real('rated_economic').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => [
  index('media_ratings_media_id_idx').on(table.mediaId),
]);

// ── Feedback (anonyme) ──

export const feedback = pgTable('feedback', {
  id: uuid('id').primaryKey().defaultRandom(),
  targetType: text('target_type').notNull(),
  targetId: text('target_id'),
  feedbackType: text('feedback_type').notNull(),
  description: text('description').notNull(),
  screen: text('screen'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  processed: boolean('processed').notNull().default(false),
  processedAt: timestamp('processed_at'),
}, (table) => [
  index('feedback_processed_idx').on(table.processed),
]);

// ══════════════════════════════════════════════════════════════════════
// Admin (QG) — gestion interne
// ══════════════════════════════════════════════════════════════════════

// ── Administrateurs ──

export const adminUsers = pgTable('admin_users', {
  id: uuid('id').primaryKey().defaultRandom(),
  username: text('username').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// ── Prompts IA (versionnés) ──
// Chaque prompt a un key unique (ex: 'analysis', 'program', 'link_validation')
// Seul le prompt avec is_active=true est utilisé par le système.

export const prompts = pgTable('prompts', {
  id: uuid('id').primaryKey().defaultRandom(),
  key: text('key').notNull(),               // 'analysis' | 'program' | 'link_validation'
  label: text('label').notNull(),            // nom lisible
  content: text('content').notNull(),        // le prompt complet
  version: integer('version').notNull().default(1),
  isActive: boolean('is_active').notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  createdBy: text('created_by'),            // username de l'admin
}, (table) => [
  index('prompts_key_active_idx').on(table.key, table.isActive),
]);

// ── Journal des appels API IA ──

export const apiCalls = pgTable('api_calls', {
  id: uuid('id').primaryKey().defaultRandom(),
  promptKey: text('prompt_key').notNull(),   // 'analysis' | 'program' | 'link_validation' | 'test'
  model: text('model').notNull(),
  inputTokens: integer('input_tokens'),
  outputTokens: integer('output_tokens'),
  costEstimate: real('cost_estimate'),       // en USD
  durationMs: integer('duration_ms'),
  success: boolean('success').notNull().default(true),
  errorMessage: text('error_message'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => [
  index('api_calls_created_at_idx').on(table.createdAt),
]);
