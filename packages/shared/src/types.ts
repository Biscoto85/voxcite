// ── Les 3 axes du compas VoxCité ───────────────────────────────────
//
// Vue 1D : gauche ↔ droite (éditorial, défini manuellement)
// Vue 2D : sociétal × économique (calculé depuis les réponses/programmes)
// Vue 3D : sociétal × économique × autorité (idem, plus fin)
//
// Axes possibles pour évolutions futures :
//   - Écologiste ↔ Productiviste (rapport à la croissance et aux limites)
//   - Souverainiste ↔ Mondialiste (rapport aux frontières et institutions internationales)
//   - Pragmatique ↔ Idéologique (rapport au compromis et à la pureté doctrinale)

// ── Positions sur le compas ────────────────────────────────────────

export interface CompassPosition {
  societal: number;  // -1 (conservateur) → +1 (progressiste)
  economic: number;  // -1 (interventionniste) → +1 (libéral)
  authority: number; // -1 (autoritaire) → +1 (libertaire)
}

/** Vue 2D (sans l'axe autorité) — pour l'affichage compas classique */
export type CompassPosition2D = Pick<CompassPosition, 'societal' | 'economic'>;

// ── Domaines thématiques ───────────────────────────────────────────

export interface DomainDimension {
  tension: string;
  exemples_progressiste?: string;
  exemples_conservateur?: string;
  exemples_interventionniste?: string;
  exemples_liberal?: string;
  exemples_autoritaire?: string;
  exemples_libertaire?: string;
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
  themes_permanents: ThemeRef[];
}

// ── Questions de positionnement ────────────────────────────────────

export type QuestionType = 'affirmation' | 'dilemme';
export type QuestionAxis = 'societal' | 'economic' | 'authority' | 'both' | 'all';
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
  position1d: number;         // -1 (gauche) → +1 (droite) — éditorial
  position: CompassPosition;  // compas 3D complet
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

// ── Octants (8 zones en 3D) ────────────────────────────────────────
//
// En 2D on avait 4 quadrants. En 3D on a 8 octants.

export type Octant =
  | 'progressiste_liberal_libertaire'
  | 'progressiste_liberal_autoritaire'
  | 'progressiste_interventionniste_libertaire'
  | 'progressiste_interventionniste_autoritaire'
  | 'conservateur_liberal_libertaire'
  | 'conservateur_liberal_autoritaire'
  | 'conservateur_interventionniste_libertaire'
  | 'conservateur_interventionniste_autoritaire';

/** Rétrocompatibilité : quadrant = projection 2D d'un octant */
export type Quadrant =
  | 'progressiste_liberal'
  | 'progressiste_interventionniste'
  | 'conservateur_liberal'
  | 'conservateur_interventionniste';

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
