-- PartiPrism — Migration initiale
-- Crée toutes les tables du schéma (fresh install)

-- Domaines thématiques
CREATE TABLE IF NOT EXISTS domains (
  id TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  "order" INTEGER NOT NULL,
  description TEXT,
  dimension_societale JSONB,
  dimension_economique JSONB
);

-- Thèmes permanents
CREATE TABLE IF NOT EXISTS themes (
  id TEXT PRIMARY KEY,
  domain_id TEXT NOT NULL REFERENCES domains(id),
  label TEXT NOT NULL,
  description TEXT
);

-- Questions de positionnement
CREATE TABLE IF NOT EXISTS questions (
  id TEXT PRIMARY KEY,
  text TEXT NOT NULL,
  type TEXT NOT NULL,
  axis TEXT NOT NULL,
  axes JSONB,
  polarity REAL NOT NULL,
  domain_id TEXT NOT NULL REFERENCES domains(id),
  phase TEXT NOT NULL,
  weight REAL NOT NULL DEFAULT 1.0,
  options JSONB
);

-- Partis politiques
CREATE TABLE IF NOT EXISTS partis (
  id TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  abbreviation TEXT NOT NULL,
  position_1d REAL NOT NULL,
  position_societal REAL NOT NULL,
  position_economic REAL NOT NULL,
  position_authority REAL NOT NULL,
  position_ecology REAL NOT NULL,
  position_sovereignty REAL NOT NULL,
  color TEXT NOT NULL,
  leader TEXT,
  visible_on_compass BOOLEAN NOT NULL DEFAULT true
);

-- Médias
CREATE TABLE IF NOT EXISTS medias (
  id TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  type TEXT NOT NULL,
  url TEXT,
  position_1d REAL NOT NULL,
  position_societal REAL NOT NULL,
  position_economic REAL NOT NULL,
  position_authority REAL NOT NULL,
  position_ecology REAL NOT NULL,
  position_sovereignty REAL NOT NULL,
  owner TEXT,
  independent BOOLEAN NOT NULL DEFAULT false,
  editorial_label TEXT,
  visible_on_compass BOOLEAN NOT NULL DEFAULT true,
  citizen_societal REAL,
  citizen_economic REAL,
  citizen_rating_count INTEGER NOT NULL DEFAULT 0
);

-- Snapshots anonymes (nébuleuse collective)
CREATE TABLE IF NOT EXISTS snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  postal_code TEXT,
  position_societal REAL NOT NULL,
  position_economic REAL NOT NULL,
  position_authority REAL NOT NULL,
  position_ecology REAL NOT NULL,
  position_sovereignty REAL NOT NULL,
  info_source TEXT,
  perceived_bias TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Votes anonymes individuels
CREATE TABLE IF NOT EXISTS votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id TEXT NOT NULL REFERENCES questions(id),
  value REAL NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS votes_question_id_idx ON votes(question_id);

-- Sessions legacy (conservée pour rétrocompatibilité migration)
CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  position_1d REAL,
  position_societal REAL,
  position_economic REAL,
  position_authority REAL,
  position_ecology REAL,
  position_sovereignty REAL,
  onboarding_completed BOOLEAN NOT NULL DEFAULT false,
  postal_code TEXT,
  info_source TEXT,
  perceived_bias TEXT,
  ip_country TEXT,
  ip_region TEXT,
  device_fingerprint TEXT,
  share_count INTEGER NOT NULL DEFAULT 0
);

-- Réponses legacy
CREATE TABLE IF NOT EXISTS responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES sessions(id),
  question_id TEXT NOT NULL REFERENCES questions(id),
  value REAL NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS responses_session_id_idx ON responses(session_id);

-- Biais identifiés
CREATE TABLE IF NOT EXISTS biases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES sessions(id),
  category TEXT NOT NULL,
  bias_type TEXT NOT NULL,
  axis TEXT NOT NULL,
  description TEXT NOT NULL,
  strength REAL NOT NULL,
  detected_by TEXT NOT NULL,
  suggested_content TEXT,
  suggested_source TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Sujets d'actualité
CREATE TABLE IF NOT EXISTS subjects (
  id TEXT PRIMARY KEY,
  domain_id TEXT NOT NULL REFERENCES domains(id),
  label TEXT NOT NULL,
  summary TEXT,
  date_published TIMESTAMP NOT NULL DEFAULT NOW(),
  date_expires TIMESTAMP,
  is_active BOOLEAN NOT NULL DEFAULT true,
  decryptage JSONB
);

-- Avis citoyens (anonyme)
CREATE TABLE IF NOT EXISTS opinions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id TEXT NOT NULL REFERENCES subjects(id),
  position_societal REAL NOT NULL,
  position_economic REAL NOT NULL,
  position_authority REAL NOT NULL,
  position_ecology REAL NOT NULL,
  position_sovereignty REAL NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Propositions citoyennes (anonyme)
CREATE TABLE IF NOT EXISTS proposals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  domain_id TEXT NOT NULL REFERENCES domains(id),
  text TEXT NOT NULL,
  source TEXT NOT NULL,
  original_proposal_id UUID,
  position_societal REAL,
  position_economic REAL,
  position_authority REAL,
  position_ecology REAL,
  position_sovereignty REAL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS proposals_domain_id_idx ON proposals(domain_id);
CREATE INDEX IF NOT EXISTS proposals_source_idx ON proposals(source);

-- Versions du programme citoyen
CREATE TABLE IF NOT EXISTS program_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  generated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  content JSONB NOT NULL,
  evolution_summary TEXT,
  total_proposals INTEGER NOT NULL DEFAULT 0,
  total_contributors INTEGER NOT NULL DEFAULT 0,
  is_initial BOOLEAN NOT NULL DEFAULT false
);

-- Suggestions pré-générées
CREATE TABLE IF NOT EXISTS suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  domain_id TEXT NOT NULL REFERENCES domains(id),
  text TEXT NOT NULL,
  target_societal REAL,
  target_economic REAL,
  target_authority REAL,
  target_ecology REAL,
  target_sovereignty REAL,
  generated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  is_active BOOLEAN NOT NULL DEFAULT true
);

-- Liens partagés (anonyme)
CREATE TABLE IF NOT EXISTS shared_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  domain_id TEXT NOT NULL REFERENCES domains(id),
  url TEXT NOT NULL,
  description TEXT NOT NULL,
  validated_description TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Évaluations médias (anonyme)
CREATE TABLE IF NOT EXISTS media_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  media_id TEXT NOT NULL REFERENCES medias(id),
  rated_societal REAL NOT NULL,
  rated_economic REAL NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS media_ratings_media_id_idx ON media_ratings(media_id);

-- Feedback (anonyme)
CREATE TABLE IF NOT EXISTS feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  target_type TEXT NOT NULL,
  target_id TEXT,
  feedback_type TEXT NOT NULL,
  description TEXT NOT NULL,
  screen TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  processed BOOLEAN NOT NULL DEFAULT false,
  processed_at TIMESTAMP
);
CREATE INDEX IF NOT EXISTS feedback_processed_idx ON feedback(processed);

-- ══════════════════════════════════════════════════════════════════════
-- Admin (QG)
-- ══════════════════════════════════════════════════════════════════════

-- Administrateurs
CREATE TABLE IF NOT EXISTS admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Prompts IA (versionnés)
CREATE TABLE IF NOT EXISTS prompts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL,
  label TEXT NOT NULL,
  content TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  is_active BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  created_by TEXT
);
CREATE INDEX IF NOT EXISTS prompts_key_active_idx ON prompts(key, is_active);

-- Journal des appels API IA
CREATE TABLE IF NOT EXISTS api_calls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt_key TEXT NOT NULL,
  model TEXT NOT NULL,
  input_tokens INTEGER,
  output_tokens INTEGER,
  cost_estimate REAL,
  duration_ms INTEGER,
  success BOOLEAN NOT NULL DEFAULT true,
  error_message TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS api_calls_created_at_idx ON api_calls(created_at);
