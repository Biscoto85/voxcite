// ── Position sur le compas 2D ──────────────────────────────────────

export interface CompassPosition {
  societal: number; // -1 (conservateur) → +1 (progressiste)
  economic: number; // -1 (interventionniste) → +1 (libéral)
}

// ── Domaines thématiques ───────────────────────────────────────────

export interface DomainDimension {
  tension: string;
  exemples_progressiste?: string;
  exemples_conservateur?: string;
  exemples_interventionniste?: string;
  exemples_liberal?: string;
}

export interface ThemeRef {
  id: string;
  label: string;
}

export interface Domain {
  id: string;
  label: string;
  order: number;
  description: string;
  dimension_societale: DomainDimension;
  dimension_economique: DomainDimension;
  themes_permanents: ThemeRef[];
}

// ── Questions de positionnement ────────────────────────────────────

export type QuestionType = 'affirmation' | 'dilemme';
export type QuestionAxis = 'societal' | 'economic' | 'both';
export type QuestionPhase = 'onboarding' | 'deep';

export interface Question {
  id: string;
  text: string;
  type: QuestionType;
  axis: QuestionAxis;
  polarity: -1 | 1;
  domain: string;
  phase: QuestionPhase;
  weight: number;
  options?: string[]; // pour les dilemmes
}

// ── Réponses ───────────────────────────────────────────────────────

export interface QuestionResponse {
  questionId: string;
  value: -2 | -1 | 0 | 1 | 2;
}

// ── Partis politiques ──────────────────────────────────────────────

export interface Party {
  id: string;
  label: string;
  abbreviation: string;
  position: CompassPosition;
  color: string;
  leader?: string;
  visibleOnCompass: boolean;
}

// ── Médias ─────────────────────────────────────────────────────────

export type MediaType = 'tv' | 'radio' | 'presse' | 'web';

export interface Media {
  id: string;
  label: string;
  type: MediaType;
  position: CompassPosition;
  owner?: string;
  visibleOnCompass: boolean;
}

// ── Sessions anonymes ──────────────────────────────────────────────

export interface Session {
  id: string;
  createdAt: string;
  position?: CompassPosition;
  onboardingCompleted: boolean;
  shareCount: number;
}

// ── Sujets d'actualité ────────────────────────────────────────────

export interface DecryptageActor {
  actor: string;
  position: string;
  axis: QuestionAxis;
}

export interface DecryptageBiais {
  source: string;
  biais: string;
}

export interface Decryptage {
  qui_dit_quoi: DecryptageActor[];
  biais_mediatiques: DecryptageBiais[];
  enjeux_caches: string;
}

export interface Subject {
  id: string;
  domainId: string;
  label: string;
  summary?: string;
  datePublished: string;
  dateExpires?: string;
  isActive: boolean;
  decryptage?: Decryptage;
}

// ── Avis citoyens ──────────────────────────────────────────────────

export interface Opinion {
  id: string;
  sessionId: string;
  subjectId: string;
  position: CompassPosition;
  createdAt: string;
}

// ── Synthèse collective ────────────────────────────────────────────

export type Quadrant =
  | 'progressiste_liberal'
  | 'progressiste_interventionniste'
  | 'conservateur_liberal'
  | 'conservateur_interventionniste';

export interface QuadrantDistribution {
  count: number;
  percent: number;
}

export interface CollectiveSynthesis {
  subjectId: string;
  totalVotes: number;
  distribution: {
    mean: CompassPosition;
    median: CompassPosition;
    stdDev: CompassPosition;
  };
  quadrants: Record<Quadrant, QuadrantDistribution>;
  aiSynthesis?: {
    consensus: string;
    clivagePrincipal: string;
    surprise: string;
  };
}

// ── Contenu partageable ────────────────────────────────────────────

export interface ShareContent {
  sessionId: string;
  position: CompassPosition;
  quadrant: Quadrant;
  statChoc: string;
  imageUrl?: string;
}
