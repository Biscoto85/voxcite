import type { Quadrant, Octant, AxisId } from './types.js';

// ── Les 5 axes ─────────────────────────────────────────────────────

export const AXES: Record<AxisId, { negative: string; positive: string; description: string }> = {
  societal: {
    negative: 'Conservateur',
    positive: 'Progressiste',
    description: 'Rapport aux valeurs, aux moeurs et aux évolutions de société',
  },
  economic: {
    negative: 'Interventionniste',
    positive: 'Libéral',
    description: 'Rapport à l\'État dans l\'économie, au marché et à la redistribution',
  },
  authority: {
    negative: 'Autoritaire',
    positive: 'Libertaire',
    description: 'Rapport au pouvoir, au contrôle, à la hiérarchie et aux libertés individuelles',
  },
  ecology: {
    negative: 'Productiviste',
    positive: 'Écologiste',
    description: 'Rapport à la croissance, aux limites planétaires et à la sobriété',
  },
  sovereignty: {
    negative: 'Souverainiste',
    positive: 'Mondialiste',
    description: 'Rapport aux frontières, à la nation et aux institutions internationales',
  },
};

/** Rétrocompatibilité */
export const AXIS_LABELS = {
  societal: { negative: AXES.societal.negative, positive: AXES.societal.positive },
  economic: { negative: AXES.economic.negative, positive: AXES.economic.positive },
  authority: { negative: AXES.authority.negative, positive: AXES.authority.positive },
  ecology: { negative: AXES.ecology.negative, positive: AXES.ecology.positive },
  sovereignty: { negative: AXES.sovereignty.negative, positive: AXES.sovereignty.positive },
} as const;

// ── Paires d'axes suggérées (pour le sélecteur de vue) ─────────────

export const SUGGESTED_VIEWS = [
  { x: 'societal' as AxisId, y: 'economic' as AxisId, label: 'Compas classique' },
  { x: 'societal' as AxisId, y: 'authority' as AxisId, label: 'Société × Autorité' },
  { x: 'economic' as AxisId, y: 'ecology' as AxisId, label: 'Économie × Écologie' },
  { x: 'sovereignty' as AxisId, y: 'economic' as AxisId, label: 'Souveraineté × Économie' },
  { x: 'authority' as AxisId, y: 'ecology' as AxisId, label: 'Autorité × Écologie' },
] as const;

// ── Quadrants (vue 2D sociétal × économique) ───────────────────────

export const QUADRANT_LABELS: Record<Quadrant, string> = {
  progressiste_liberal: 'Progressiste-Libéral',
  progressiste_interventionniste: 'Progressiste-Interventionniste',
  conservateur_liberal: 'Conservateur-Libéral',
  conservateur_interventionniste: 'Conservateur-Interventionniste',
};

export const QUADRANT_POPULATION_ESTIMATE: Record<Quadrant, number> = {
  progressiste_liberal: 18,
  conservateur_liberal: 15,
  progressiste_interventionniste: 35,
  conservateur_interventionniste: 32,
};

// ── Octants (vue 3D sociétal × économique × autorité) ──────────────

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

export const ONBOARDING_PHASE1_COUNT = 5;
export const ONBOARDING_PHASE3_COUNT = 5;
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
