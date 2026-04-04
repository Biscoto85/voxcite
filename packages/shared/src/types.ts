// ── Les 5 axes du compas VoxCité ───────────────────────────────────
//
// Vue 1D : gauche ↔ droite (éditorial, défini manuellement)
// Vue 2D : sociétal × économique (les 2 axes fondateurs)
// Vue 3D : + autorité (pour l'analyse approfondie)
// Vue 5D : + écologie + souveraineté (profil complet)
//
// L'utilisateur choisit quels axes afficher.
// L'onboarding calcule les 5 axes dès les 10 premières questions.

// ── Positions sur le compas ────────────────────────────────────────

export interface CompassPosition {
  societal: number;     // -1 (conservateur) → +1 (progressiste)
  economic: number;     // -1 (interventionniste) → +1 (libéral)
  authority: number;    // -1 (autoritaire) → +1 (libertaire)
  ecology: number;      // -1 (productiviste) → +1 (écologiste)
  sovereignty: number;  // -1 (souverainiste) → +1 (mondialiste)
}

/** Les 5 axes possibles */
export type AxisId = keyof CompassPosition;

/** Vue 2D : n'importe quelle paire d'axes */
export interface CompassView2D {
  xAxis: AxisId;
  yAxis: AxisId;
}

/** Vue 2D classique (par défaut) */
export const DEFAULT_VIEW_2D: CompassView2D = {
  xAxis: 'societal',
  yAxis: 'economic',
};

// ── Domaines thématiques ───────────────────────────────────────────

export interface DomainDimension {
  tension: string;
  exemples_progressiste?: string;
  exemples_conservateur?: string;
  exemples_interventionniste?: string;
  exemples_liberal?: string;
  exemples_autoritaire?: string;
  exemples_libertaire?: string;
  exemples_productiviste?: string;
  exemples_ecologiste?: string;
  exemples_souverainiste?: string;
  exemples_mondialiste?: string;
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
  dimension_autorite?: DomainDimension;
  dimension_ecologie?: DomainDimension;
  dimension_souverainete?: DomainDimension;
  themes_permanents: ThemeRef[];
}

// ── Questions de positionnement ────────────────────────────────────

export type QuestionType = 'affirmation' | 'dilemme';

/**
 * Axes qu'une question mesure :
 * - Un axe unique : 'societal', 'economic', 'authority', 'ecology', 'sovereignty'
 * - 'both' : sociétal + économique (rétrocompat)
 * - 'all' : les 5 axes
 * - Tableau explicite : ['societal', 'authority'] etc.
 */
export type QuestionAxis =
  | AxisId
  | 'both'   // sociétal + économique (rétrocompat)
  | 'all';   // les 5 axes

export type QuestionPhase = 'onboarding' | 'deep';

export interface Question {
  id: string;
  text: string;
  type: QuestionType;
  axis: QuestionAxis;
  axes?: AxisId[];       // si la question mesure une combinaison spécifique (priorité sur axis)
  polarity: -1 | 1;
  domain: string;
  phase: QuestionPhase;
  weight: number;
  options?: string[];    // pour les dilemmes
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
  position1d: number;         // -1 (gauche) → +1 (droite) — éditorial
  position: CompassPosition;  // 5 axes complets
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
  position1d: number;
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

// ── Zones (quadrants en 2D, octants en 3D) ─────────────────────────

export type Quadrant =
  | 'progressiste_liberal'
  | 'progressiste_interventionniste'
  | 'conservateur_liberal'
  | 'conservateur_interventionniste';

export type Octant =
  | 'progressiste_liberal_libertaire'
  | 'progressiste_liberal_autoritaire'
  | 'progressiste_interventionniste_libertaire'
  | 'progressiste_interventionniste_autoritaire'
  | 'conservateur_liberal_libertaire'
  | 'conservateur_liberal_autoritaire'
  | 'conservateur_interventionniste_libertaire'
  | 'conservateur_interventionniste_autoritaire';

export interface ZoneDistribution {
  count: number;
  percent: number;
}

// ── Synthèse collective ────────────────────────────────────────────

export interface CollectiveSynthesis {
  subjectId: string;
  totalVotes: number;
  distribution: {
    mean: CompassPosition;
    median: CompassPosition;
    stdDev: CompassPosition;
  };
  quadrants: Record<Quadrant, ZoneDistribution>;
  octants?: Record<Octant, ZoneDistribution>;
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
  octant?: Octant;
  statChoc: string;
  imageUrl?: string;
}
