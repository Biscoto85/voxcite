import type { Quadrant, Octant, AxisId } from './types.js';

// ── Les 5 axes ─────────────────────────────────────────────────────

interface AxisPole {
  label: string;
  definition: string;
  source: string;
}

interface AxisInfo {
  negative: string;
  positive: string;
  description: string;
  poles: {
    negative: AxisPole;
    positive: AxisPole;
  };
}

export const AXES: Record<AxisId, AxisInfo> = {
  societal: {
    negative: 'Conservateur',
    positive: 'Progressiste',
    description: 'Rapport aux valeurs, aux mœurs et aux évolutions de société',
    poles: {
      negative: {
        label: 'Conservateur',
        definition: 'Tendance à préserver les structures sociales, les traditions et les valeurs établies. Privilégie la continuité, la prudence face au changement et le respect des institutions héritées.',
        source: 'Norberto Bobbio, Droite et Gauche (1994) ; Edmund Burke, Réflexions sur la Révolution de France (1790)',
      },
      positive: {
        label: 'Progressiste',
        definition: 'Tendance à promouvoir les réformes sociales, l\'extension des droits individuels et l\'évolution des normes. Privilégie l\'émancipation, l\'égalité et l\'adaptation aux transformations de la société.',
        source: 'Norberto Bobbio, Droite et Gauche (1994) ; John Stuart Mill, De la liberté (1859)',
      },
    },
  },
  economic: {
    negative: 'Interventionniste',
    positive: 'Libéral',
    description: 'Rapport à l\'État dans l\'économie, au marché et à la redistribution',
    poles: {
      negative: {
        label: 'Interventionniste',
        definition: 'Tendance à confier à l\'État un rôle actif dans l\'économie : régulation des marchés, services publics, redistribution des richesses. Considère que le marché seul ne peut garantir la justice sociale.',
        source: 'John Maynard Keynes, Théorie générale (1936) ; Karl Polanyi, La Grande Transformation (1944)',
      },
      positive: {
        label: 'Libéral',
        definition: 'Tendance à limiter l\'intervention de l\'État dans l\'économie : libre marché, concurrence, propriété privée, initiative individuelle. Considère que la liberté économique est le meilleur moteur de prospérité.',
        source: 'Adam Smith, La Richesse des nations (1776) ; Friedrich Hayek, La Route de la servitude (1944)',
      },
    },
  },
  authority: {
    negative: 'Autoritaire',
    positive: 'Libertaire',
    description: 'Rapport au pouvoir, au contrôle, à la hiérarchie et aux libertés individuelles',
    poles: {
      negative: {
        label: 'Autoritaire',
        definition: 'Tendance à privilégier l\'ordre, la discipline, la sécurité collective et la centralisation du pouvoir. Accepte des restrictions des libertés individuelles au nom de la stabilité ou de l\'intérêt général.',
        source: 'Thomas Hobbes, Le Léviathan (1651) ; Hannah Arendt, Les Origines du totalitarisme (1951)',
      },
      positive: {
        label: 'Libertaire',
        definition: 'Tendance à privilégier l\'autonomie individuelle, la décentralisation du pouvoir et la méfiance envers l\'autorité. Refuse la coercition et défend les libertés civiles comme valeur première.',
        source: 'Pierre-Joseph Proudhon, Qu\'est-ce que la propriété ? (1840) ; Murray Rothbard, L\'Éthique de la liberté (1982)',
      },
    },
  },
  ecology: {
    negative: 'Productiviste',
    positive: 'Écologiste',
    description: 'Rapport à la croissance, aux limites planétaires et à la sobriété',
    poles: {
      negative: {
        label: 'Productiviste',
        definition: 'Tendance à considérer la croissance économique et le progrès technique comme prioritaires. La préservation de l\'environnement ne doit pas entraver le développement.',
        source: 'Simon Kuznets, courbe environnementale (1955) ; Leigh Phillips, Austerity Ecology (2015)',
      },
      positive: {
        label: 'Écologiste',
        definition: 'Tendance à considérer les limites planétaires comme contrainte première. Prône la sobriété, la transformation des modes de production et la protection des écosystèmes.',
        source: 'Club de Rome, Les Limites à la croissance (1972) ; GIEC, rapports d\'évaluation (1990-2023)',
      },
    },
  },
  sovereignty: {
    negative: 'Souverainiste',
    positive: 'Mondialiste',
    description: 'Rapport aux frontières, à la nation et aux institutions internationales',
    poles: {
      negative: {
        label: 'Souverainiste',
        definition: 'Tendance à défendre la souveraineté nationale, le contrôle des frontières et la primauté des décisions nationales sur les organisations internationales.',
        source: 'Jean Bodin, Les Six Livres de la République (1576) ; Charles de Gaulle, Mémoires de guerre (1954)',
      },
      positive: {
        label: 'Mondialiste',
        definition: 'Tendance à favoriser la coopération internationale, l\'intégration supranationale et la libre circulation. Considère que les défis contemporains nécessitent des réponses au-delà des frontières.',
        source: 'Immanuel Kant, Projet de paix perpétuelle (1795) ; Déclaration de Schuman (1950)',
      },
    },
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
export const ONBOARDING_TOTAL = 12;

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
  userDot: '#F5B731',
  userDotBorder: '#FFFFFF',
  nebula: '#F5B731',
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
