import type { CompassPosition, AxisId } from '@partiprism/shared';
import { AXES } from '@partiprism/shared';
import type { PopulationStats, UserPercentiles } from './population.js';
import type { ResponseSignals } from './response-signals.js';
import { trackedAiCall } from './tracked-ai.js';
import { loadPrompt, fillTemplate } from './prompt-loader.js';
import { ALL_AXES, extractClaudeText, extractJSON } from '../utils/helpers.js';

interface PartyInput {
  id: string;
  label: string;
  abbreviation: string;
  position: CompassPosition;
}

export interface AnalysisInput {
  position: CompassPosition;
  parties: PartyInput[];
  populationStats: PopulationStats;
  percentiles: UserPercentiles;
  infoSource?: string;            // legacy
  perceivedBias?: string;         // 'gauche' | 'droite' | 'varie' | 'difficile'
  infoFormats?: string[];         // formats multi-select (v2)
  mediaSources?: string[];        // labels des médias déclarés (v2, résolu depuis DB)
  infoDiversity?: string;         // 'regularly' | 'sometimes' | 'rarely' | 'never' (v2)
  mediaRelationship?: string;     // 'trust' | 'critical' | 'independent' | 'avoid' (v2)
  mediaPosition?: CompassPosition; // position éditoriale moyenne calculée
  responseSignals?: ResponseSignals;
}

export interface IdentifiedBias {
  category: 'media' | 'values';
  biasType: string;
  axis: AxisId;
  description: string;
  strength: number;
  suggestedContent: string;
  suggestedSource?: string;
}

export interface AiAnalysisResult {
  summary: string;
  vsCitoyens: string;
  vsPartis: string;
  biases: IdentifiedBias[];
  espritCritiquePistes: string[];
}

// ── Labels lisibles pour les champs du profil info ─────────────────

const FORMAT_LABELS: Record<string, string> = {
  tv: 'Télévision',
  radio: 'Radio',
  presse: 'Presse écrite/web',
  podcast: 'Podcasts & YouTube',
  reseaux: 'Réseaux sociaux',
  entourage: 'Entourage / bouche à oreille',
  autre: 'Autre',
  // legacy
  internet: 'Internet / Réseaux sociaux',
  journal: 'Presse écrite/web',
};

const BIAS_LABELS: Record<string, string> = {
  gauche: 'plutôt à gauche',
  droite: 'plutôt à droite',
  varie: 'variées (intentionnellement diversifiées)',
  difficile: 'difficile à situer',
  // legacy
  neutre: 'neutres (selon lui)',
  les_deux: 'variées (gauche et droite)',
};

const DIVERSITY_LABELS: Record<string, string> = {
  regularly: 'régulièrement (cherche activement des points de vue opposés)',
  sometimes: 'parfois (sans en faire un principe)',
  rarely: 'rarement (plutôt par hasard)',
  never: 'jamais (évite les sources en désaccord)',
};

const RELATIONSHIP_LABELS: Record<string, string> = {
  trust: 'fait confiance aux grands médias traditionnels',
  critical: 'les lit avec recul critique',
  independent: 'préfère les médias indépendants',
  avoid: 'les évite (trop proches du pouvoir)',
};

function buildPrompt(input: AnalysisInput): { dataBlock: string } {
  const { position, parties, populationStats, percentiles, infoSource, perceivedBias, infoFormats, mediaSources, infoDiversity, mediaRelationship, mediaPosition, responseSignals } = input;

  const ranked = parties.map((p) => {
    const dist = Math.sqrt(ALL_AXES.reduce((s, ax) => s + (position[ax] - p.position[ax]) ** 2, 0));
    return { ...p, distance: dist };
  }).sort((a, b) => a.distance - b.distance);

  const partyBlock = ranked.map((p) =>
    `- ${p.abbreviation} (${p.label}) : soc=${p.position.societal.toFixed(2)} éco=${p.position.economic.toFixed(2)} aut=${p.position.authority.toFixed(2)} écol=${p.position.ecology.toFixed(2)} souv=${p.position.sovereignty.toFixed(2)} → distance=${p.distance.toFixed(3)}`,
  ).join('\n');

  const statsBlock = ALL_AXES.map((ax) => {
    const s = populationStats.axes[ax];
    const pct = percentiles.axes[ax];
    return `- ${ax} : répondant=${position[ax].toFixed(2)}, moy.pop=${s.mean.toFixed(2)}, σ=${s.stdDev.toFixed(2)}, percentile=${pct}%`;
  }).join('\n');

  // Bloc audit sources d'information
  let mediaBiasBlock = '';

  // Formats déclarés (v2) ou source legacy
  const formatsDesc = infoFormats && infoFormats.length > 0
    ? infoFormats.map((f) => FORMAT_LABELS[f] || f).join(', ')
    : (infoSource ? (FORMAT_LABELS[infoSource] || infoSource) : null);

  const mediaDesc = mediaSources && mediaSources.length > 0
    ? mediaSources.join(', ')
    : null;

  if (formatsDesc || mediaPosition) {
    const diversityDesc = infoDiversity ? DIVERSITY_LABELS[infoDiversity] : null;
    const relationshipDesc = mediaRelationship ? RELATIONSHIP_LABELS[mediaRelationship] : null;
    const biasDesc = perceivedBias ? BIAS_LABELS[perceivedBias] : null;

    let mediaGapLines = 'Non calculable (aucun média spécifique déclaré)';
    let anglesMorts: string[] = [];
    if (mediaPosition) {
      mediaGapLines = ALL_AXES.map((ax) => {
        const delta = position[ax] - mediaPosition[ax];
        const absDelta = Math.abs(delta);
        const warning = absDelta > 0.5 ? ' ⚠ ANGLE MORT POTENTIEL' : (absDelta > 0.3 ? ' △ écart notable' : '');
        return `  ${ax}: répondant=${position[ax].toFixed(2)} vs médias=${mediaPosition[ax].toFixed(2)} (${delta > 0 ? '+' : ''}${delta.toFixed(2)})${warning}`;
      }).join('\n');

      anglesMorts = ALL_AXES.filter((ax) => Math.abs(position[ax] - mediaPosition[ax]) > 0.5);
    }

    mediaBiasBlock = `

AUDIT SOURCES D'INFORMATION :
Formats consommés : ${formatsDesc || 'non renseigné'}
${mediaDesc ? `Médias déclarés spécifiques : ${mediaDesc}` : 'Médias spécifiques : non renseignés'}
Orientation perçue de ses sources : ${biasDesc || 'non renseigné'}
Diversification intentionnelle : ${diversityDesc || 'non renseigné'}
Rapport aux grands médias : ${relationshipDesc || 'non renseigné'}

POSITION ÉDITORIALE CALCULÉE DE SES SOURCES vs SA POSITION :
${mediaGapLines}
${anglesMorts.length > 0 ? `
AXES À FORT ÉCART (> 0.5) : ${anglesMorts.join(', ')}
${infoDiversity === 'never' || infoDiversity === 'rarely'
  ? '→ Le répondant diversifie peu ses sources. Ces axes sont des ANGLES MORTS INFORMATIONNELS probables.'
  : '→ Le répondant déclare diversifier parfois/régulièrement. Ces écarts peuvent être intentionnels.'}` : ''}

INSTRUCTIONS POUR L'ANALYSE DES BIAIS MÉDIAS :
- Si les positions sont proches ET diversification faible → bulle informationnelle confirmante
- Si fort écart + jamais de diversification → angle mort informationnel probable
- Si fort écart + diversification régulière → le répondant a des convictions qui résistent à ses sources
- Si perçoit ses sources comme "${biasDesc}" mais les écarts mesurent autre chose → biais de perception à signaler
- Les réseaux sociaux amplifient les convictions existantes via les algorithmes`;
  }

  // ── Response signals block ─────────────────────────────────────
  let signalsBlock = '';
  if (responseSignals) {
    const parts: string[] = [];

    // Extreme responses — the "spicy" answers
    if (responseSignals.extremeResponses.length > 0) {
      const extremeLines = responseSignals.extremeResponses
        .slice(0, 10) // top 10
        .map((e) => {
          const dir = e.contribution > 0 ? '+' : '-';
          const axLabels = e.axes.map((a) => `${AXES[a].negative}↔${AXES[a].positive}`).join(', ');
          return `  - "${e.questionText}" → réponse ${e.value > 0 ? 'fortement d\'accord' : 'fortement en désaccord'} (${dir} sur ${axLabels}) [domaine: ${e.domain}]`;
        }).join('\n');
      parts.push(`RÉPONSES LES PLUS TRANCHÉES (convictions fortes) :\n${extremeLines}`);
    }

    // Domain profiles — position varies by topic
    if (responseSignals.domainProfiles.length > 1) {
      const domainLines = responseSignals.domainProfiles
        .filter((d) => d.questionCount >= 2)
        .map((d) => {
          const axisValues = ALL_AXES
            .filter((a) => d.axes[a] !== undefined)
            .map((a) => `${a}=${d.axes[a]!.toFixed(2)}`)
            .join(', ');
          return `  - ${d.domain} (${d.questionCount} questions) : ${axisValues}`;
        }).join('\n');
      parts.push(`PROFIL PAR DOMAINE THÉMATIQUE (la position varie selon le sujet !) :\n${domainLines}`);
    }

    // Contradictions — the most revealing signals
    if (responseSignals.contradictions.length > 0) {
      const contraLines = responseSignals.contradictions
        .slice(0, 5)
        .map((c) => {
          const axInfo = AXES[c.axis];
          return `  - Axe ${axInfo.negative}↔${axInfo.positive} : ${c.domainA} (${c.valueA.toFixed(2)}) vs ${c.domainB} (${c.valueB.toFixed(2)}) — écart de ${c.gap.toFixed(2)}`;
        }).join('\n');
      parts.push(`CONTRADICTIONS ENTRE DOMAINES (positions opposées sur le même axe selon le sujet) :\n${contraLines}\nCes contradictions sont le CŒUR de l'analyse — elles révèlent des tensions internes.`);
    }

    // Phase shifts — what changed between onboarding and deep questions
    if (responseSignals.phaseShifts.length > 0) {
      const shiftLines = responseSignals.phaseShifts
        .map((s) => {
          const axInfo = AXES[s.axis];
          const dir = s.shift > 0 ? `→ plus ${axInfo.positive.toLowerCase()}` : `→ plus ${axInfo.negative.toLowerCase()}`;
          return `  - ${axInfo.negative}↔${axInfo.positive} : ${s.onboarding.toFixed(2)} → ${s.afterDeep.toFixed(2)} (${s.shift > 0 ? '+' : ''}${s.shift.toFixed(2)}) ${dir}`;
        }).join('\n');
      parts.push(`ÉVOLUTION ENTRE PREMIÈRES QUESTIONS ET APPROFONDISSEMENT :\n${shiftLines}`);
    }

    // Axis spread — consistency vs ambivalence
    const spreadLines = ALL_AXES.map((ax) => {
      const spread = responseSignals.axisSpread[ax];
      const label = spread > 1.2 ? 'TRÈS AMBIVALENT' : spread > 0.8 ? 'ambivalent' : 'cohérent';
      return `  - ${AXES[ax].negative}↔${AXES[ax].positive} : σ=${spread.toFixed(2)} (${label})`;
    }).join('\n');
    parts.push(`COHÉRENCE PAR AXE (σ élevé = réponses contradictoires sur cet axe) :\n${spreadLines}`);

    signalsBlock = '\n\n' + parts.join('\n\n');
  }

  // Build the data block (assembled from runtime data)
  const dataBlock = `PROFIL GLOBAL DU RÉPONDANT (MOYENNES — attention, ces moyennes masquent des nuances) :
sociétal=${position.societal.toFixed(2)}, économique=${position.economic.toFixed(2)}, autorité=${position.authority.toFixed(2)}, écologie=${position.ecology.toFixed(2)}, souveraineté=${position.sovereignty.toFixed(2)}

POSITION PAR RAPPORT À LA POPULATION (${populationStats.totalRespondents} répondants) :
${statsBlock}

PARTIS POLITIQUES (triés par proximité) :
${partyBlock}
${mediaBiasBlock}
${signalsBlock}`;

  return { dataBlock };
}

// Prompts are managed exclusively in the DB via the /qg admin panel.
// Keys: 'analysis' (Haiku) and 'analysis_deep' (Sonnet).
export const ANALYSIS_MODEL_DEFAULT = 'claude-haiku-4-5-20251001';
export const ANALYSIS_MODEL_DEEP = 'claude-sonnet-4-6';

/**
 * Run analysis using Claude API.
 * Prompt template loaded from DB — throws if no active version is configured.
 * @param deepModel - if true, uses Sonnet instead of Haiku (unlocked feature)
 */
export async function runAiAnalysis(input: AnalysisInput, deepModel = false): Promise<AiAnalysisResult> {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY not set');
  }

  const { dataBlock } = buildPrompt(input);

  const dbKey = deepModel ? 'analysis_deep' : 'analysis';
  const dbTemplate = await loadPrompt(dbKey);
  if (!dbTemplate) {
    throw new Error(`Prompt non configuré pour la clé "${dbKey}" — ajoutez-le dans le QG admin (/qg → Prompts).`);
  }
  const prompt = fillTemplate(dbTemplate, { DATA_BLOCK: dataBlock });

  const model = deepModel ? ANALYSIS_MODEL_DEEP : ANALYSIS_MODEL_DEFAULT;

  const response = await trackedAiCall({
    promptKey: dbKey,
    model,
    maxTokens: deepModel ? 4000 : 3000,
    messages: [{ role: 'user', content: prompt }],
  });

  const text = extractClaudeText(response);

  try {
    return JSON.parse(extractJSON(text)) as AiAnalysisResult;
  } catch (err) {
    const stopReason = response.stop_reason ?? 'unknown';
    console.error(`[ai-analysis] JSON.parse failed (model=${model}, stop_reason=${stopReason}, text_len=${text.length}):`, (err as Error).message);
    console.error('[ai-analysis] Raw text (first 300 chars):', text.slice(0, 300));
    return {
      summary: 'Analyse temporairement indisponible. Revenez dans quelques instants.',
      vsCitoyens: '',
      vsPartis: '',
      biases: [],
      espritCritiquePistes: [],
    };
  }
}
