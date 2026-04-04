import type { Quadrant, Octant } from './types.js';

// ── Axes du compas ─────────────────────────────────────────────────

export const AXIS_LABELS = {
  societal: {
    negative: 'Conservateur',
    positive: 'Progressiste',
  },
  economic: {
    negative: 'Interventionniste',
    positive: 'Libéral',
  },
  authority: {
    negative: 'Autoritaire',
    positive: 'Libertaire',
  },
} as const;

// ── Axes candidats pour évolutions futures ─────────────────────────
// Documentés ici pour référence, pas encore implémentés.

export const FUTURE_AXES = [
  {
    id: 'ecology',
    negative: 'Productiviste',
    positive: 'Écologiste',
    description: 'Rapport à la croissance, aux limites planétaires et à la sobriété',
  },
  {
    id: 'sovereignty',
    negative: 'Souverainiste',
    positive: 'Mondialiste',
    description: 'Rapport aux frontières, à la nation et aux institutions internationales',
  },
  {
    id: 'pragmatism',
    negative: 'Idéologique',
    positive: 'Pragmatique',
    description: 'Rapport au compromis, à la pureté doctrinale et au réalisme politique',
  },
] as const;

// ── Quadrants (vue 2D) ─────────────────────────────────────────────

export const QUADRANT_LABELS: Record<Quadrant, string> = {
  progressiste_liberal: 'Progressiste-Libéral',
  progressiste_interventionniste: 'Progressiste-Interventionniste',
  conservateur_liberal: 'Conservateur-Libéral',
  conservateur_interventionniste: 'Conservateur-Interventionniste',
};

// Estimations initiales (à remplacer par les vraies données)
export const QUADRANT_POPULATION_ESTIMATE: Record<Quadrant, number> = {
  progressiste_liberal: 18,
  conservateur_liberal: 15,
  progressiste_interventionniste: 35,
  conservateur_interventionniste: 32,
};

// ── Octants (vue 3D) ──────────────────────────────────────────────

export const OCTANT_LABELS: Record<Octant, string> = {
  progressiste_liberal_libertaire: 'Progressiste-Libéral-Libertaire',
  progressiste_liberal_autoritaire: 'Progressiste-Libéral-Autoritaire',
  progressiste_interventionniste_libertaire: 'Progressiste-Interventionniste-Libertaire',
  progressiste_interventionniste_autoritaire: 'Progressiste-Interventionniste-Autoritaire',
  conservateur_liberal_libertaire: 'Conservateur-Libéral-Libertaire',
  conservateur_liberal_autoritaire: 'Conservateur-Libéral-Autoritaire',
  conservateur_interventionniste_libertaire: 'Conservateur-Interventionniste-Libertaire',
  conservateur_interventionniste_autoritaire: 'Conservateur-Interventionniste-Autoritaire',
};

// ── Onboarding ─────────────────────────────────────────────────────

export const ONBOARDING_PHASE1_COUNT = 5; // questions sur axe 1D
export const ONBOARDING_PHASE3_COUNT = 5; // questions sur compas 2D
export const ONBOARDING_TOTAL = 10;

// ── Réponses ───────────────────────────────────────────────────────

export const RESPONSE_LABELS_AFFIRMATION = [
  { value: -2, label: 'Pas du tout d\'accord' },
  { value: -1, label: 'Pas d\'accord' },
  { value: 0, label: 'Neutre' },
  { value: 1, label: 'D\'accord' },
  { value: 2, label: 'Tout à fait d\'accord' },
] as const;

// ── Compas : rendu visuel ──────────────────────────────────────────

export const COMPASS_COLORS = {
  userDot: '#7F77DD',
  userDotBorder: '#FFFFFF',
  nebula: '#7F77DD',
} as const;

export const COMPASS_SIZES = {
  partyDotRadius: 6,
  userDotRadius: 9,
  userDotBorderWidth: 2.5,
  nebulaMinRadius: 2,
  nebulaMaxRadius: 4,
  nebulaOpacityMin: 0.08,
  nebulaOpacityMax: 0.12,
  partyLabelFontSize: 11,
  userLabelFontSize: 12,
} as const;

// ── Animation de fracture ──────────────────────────────────────────

export const FRACTURE_TIMING = {
  axisAppearStart: 1.0,
  nebulaStart: 1.5,
  partiesStart: 2.5,
  partiesInterval: 0.1,
  userRepositionStart: 3.5,
  userRepositionDuration: 0.5,
  totalDuration: 4.0,
} as const;

// ── API ────────────────────────────────────────────────────────────

export const API_PREFIX = '/api';
