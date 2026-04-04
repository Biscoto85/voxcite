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
  type: text('type').notNull(),            // 'tv' | 'radio' | 'presse' | 'web' | 'podcast'
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
  // Perception citoyenne (ajustée par les évaluations des visiteurs)
  citizenSocietal: real('citizen_societal'),
  citizenEconomic: real('citizen_economic'),
  citizenRatingCount: integer('citizen_rating_count').notNull().default(0),
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
  postalCode: text('postal_code'),
  infoSource: text('info_source'),                         // 'internet' | 'tv' | 'radio' | 'journal' | 'autre'
  perceivedBias: text('perceived_bias'),                   // 'gauche' | 'droite' | 'neutre' | 'les_deux'
  ipCountry: text('ip_country'),
  ipRegion: text('ip_region'),
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
}, (table) => [
  index('responses_session_id_idx').on(table.sessionId),
]);

// ── Biais identifiés ──
// 2 catégories :
//   'media' = biais résultant des sources d'information (bulle informationnelle)
//   'values' = biais résultant des valeurs/histoire personnelle (cohérence interne)

export const biases = pgTable('biases', {
  id: uuid('id').primaryKey().defaultRandom(),
  sessionId: uuid('session_id').references(() => sessions.id).notNull(),
  category: text('category').notNull(),            // 'media' | 'values'
  biasType: text('bias_type').notNull(),           // ex: "bulle_info", "confirmation", "cadrage", "tribalisme"
  axis: text('axis').notNull(),                    // axe concerné
  description: text('description').notNull(),
  strength: real('strength').notNull(),            // 0-1
  detectedBy: text('detected_by').notNull(),       // 'rules' | 'ai' — traçabilité
  suggestedContent: text('suggested_content'),     // contenu pour l'esprit critique
  suggestedSource: text('suggested_source'),       // source d'info opposée à proposer
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

// ── Propositions citoyennes ──
// Source :
//   'user' = rédigée par un citoyen
//   'ai_suggested' = générée par IA, en attente de réaction
//   'ai_accepted' = proposition IA acceptée par un citoyen
//   'ai_rejected' = proposition IA refusée par un citoyen
//   'ai_amended'  = proposition IA amendée par un citoyen

export const proposals = pgTable('proposals', {
  id: uuid('id').primaryKey().defaultRandom(),
  sessionId: uuid('session_id').references(() => sessions.id).notNull(),
  domainId: text('domain_id').references(() => domains.id).notNull(),
  text: text('text').notNull(),
  source: text('source').notNull(),             // 'user' | 'ai_suggested' | 'ai_accepted' | 'ai_rejected' | 'ai_amended'
  originalProposalId: uuid('original_proposal_id'),
  positionSocietal: real('position_societal'),
  positionEconomic: real('position_economic'),
  positionAuthority: real('position_authority'),
  positionEcology: real('position_ecology'),
  positionSovereignty: real('position_sovereignty'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => [
  index('proposals_session_id_idx').on(table.sessionId),
  index('proposals_domain_id_idx').on(table.domainId),
  index('proposals_source_idx').on(table.source),
]);

// ── Versions du programme citoyen (générées par batch quotidien) ──

export const programVersions = pgTable('program_versions', {
  id: uuid('id').primaryKey().defaultRandom(),
  generatedAt: timestamp('generated_at').notNull().defaultNow(),
  // Programme complet par domaine : { domainId: { title, proposals: string[], summary } }
  content: jsonb('content').notNull(),
  // Court paragraphe décrivant l'évolution depuis la version précédente
  evolutionSummary: text('evolution_summary'),
  // Statistiques
  totalProposals: integer('total_proposals').notNull().default(0),
  totalContributors: integer('total_contributors').notNull().default(0),
  // Version neutre initiale ou version citoyenne
  isInitial: boolean('is_initial').notNull().default(false),
});

// ── Suggestions pré-générées (batch quotidien, par domaine × profil type) ──

export const suggestions = pgTable('suggestions', {
  id: uuid('id').primaryKey().defaultRandom(),
  domainId: text('domain_id').references(() => domains.id).notNull(),
  text: text('text').notNull(),
  // Profil cible approximatif (pour matcher avec l'utilisateur)
  targetSocietal: real('target_societal'),
  targetEconomic: real('target_economic'),
  targetAuthority: real('target_authority'),
  targetEcology: real('target_ecology'),
  targetSovereignty: real('target_sovereignty'),
  generatedAt: timestamp('generated_at').notNull().defaultNow(),
  isActive: boolean('is_active').notNull().default(true),
});

// ── Liens partagés (Esprit critique) ──

export const sharedLinks = pgTable('shared_links', {
  id: uuid('id').primaryKey().defaultRandom(),
  sessionId: uuid('session_id').references(() => sessions.id),
  domainId: text('domain_id').references(() => domains.id).notNull(),
  url: text('url').notNull(),
  description: text('description').notNull(),           // description originale de l'utilisateur
  validatedDescription: text('validated_description'),   // description corrigée par Haiku
  status: text('status').notNull().default('pending'),   // 'pending' | 'approved' | 'rejected'
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// ── Évaluations médias par les visiteurs (2 axes) ──

export const mediaRatings = pgTable('media_ratings', {
  id: uuid('id').primaryKey().defaultRandom(),
  sessionId: uuid('session_id').references(() => sessions.id).notNull(),
  mediaId: text('media_id').references(() => medias.id).notNull(),
  ratedSocietal: real('rated_societal').notNull(),
  ratedEconomic: real('rated_economic').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => [
  index('media_ratings_media_id_idx').on(table.mediaId),
]);

// ── Feedback utilisateur (biais, formulation, thématiques manquantes) ──

export const feedback = pgTable('feedback', {
  id: uuid('id').primaryKey().defaultRandom(),
  sessionId: uuid('session_id').references(() => sessions.id),
  targetType: text('target_type').notNull(),     // 'question' | 'proposal' | 'analysis' | 'suggestion' | 'general'
  targetId: text('target_id'),
  feedbackType: text('feedback_type').notNull(),  // 'bias' | 'formulation' | 'missing_topic' | 'other'
  description: text('description').notNull(),
  screen: text('screen'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  processed: boolean('processed').notNull().default(false),
  processedAt: timestamp('processed_at'),
}, (table) => [
  index('feedback_processed_idx').on(table.processed),
]);
