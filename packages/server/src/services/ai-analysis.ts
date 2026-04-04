import Anthropic from '@anthropic-ai/sdk';
import type { CompassPosition, AxisId } from '@voxcite/shared';
import { AXES } from '@voxcite/shared';
import type { PopulationStats, UserPercentiles } from './population.js';
import type { ResponseSignals } from './response-signals.js';

const ALL_AXES: AxisId[] = ['societal', 'economic', 'authority', 'ecology', 'sovereignty'];

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
  infoSource?: string;       // 'tv' | 'internet' | 'radio' | 'journal' | 'autre'
  perceivedBias?: string;    // 'gauche' | 'droite' | 'neutre' | 'les_deux'
  mediaPosition?: CompassPosition; // position agrégée de la source d'info
  responseSignals?: ResponseSignals; // rich per-response data
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

// ── Media source labels ─────────────────────────────────────────────

const SOURCE_LABELS: Record<string, string> = {
  tv: 'la télévision',
  internet: 'internet et les réseaux sociaux',
  radio: 'la radio',
  journal: 'la presse écrite/web',
  autre: 'des sources variées',
};

const BIAS_LABELS: Record<string, string> = {
  gauche: 'de gauche',
  droite: 'de droite',
  neutre: 'neutres',
  les_deux: 'variées (gauche et droite)',
};

function buildPrompt(input: AnalysisInput): string {
  const { position, parties, populationStats, percentiles, infoSource, perceivedBias, mediaPosition, responseSignals } = input;

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

  // Media bias section
  let mediaBiasBlock = '';
  if (infoSource && mediaPosition) {
    const mediaDeltas = ALL_AXES.map((ax) => {
      const delta = position[ax] - mediaPosition[ax];
      return `${ax}: répondant=${position[ax].toFixed(2)} vs média=${mediaPosition[ax].toFixed(2)} (écart=${delta > 0 ? '+' : ''}${delta.toFixed(2)})`;
    }).join('\n  ');

    mediaBiasBlock = `

SOURCE D'INFORMATION PRINCIPALE : ${SOURCE_LABELS[infoSource] || infoSource}
Le répondant pense que ses sources sont : ${BIAS_LABELS[perceivedBias || ''] || perceivedBias || 'non renseigné'}

POSITION ÉDITORIALE MOYENNE DE SA SOURCE D'INFO (sur les 5 axes) :
  ${mediaBiasBlock ? mediaDeltas : 'Non disponible'}

ANALYSE DU BIAIS MÉDIATIQUE :
Compare la position du répondant à celle de sa source d'info.
- Si les positions sont proches → la source renforce ses convictions (bulle informationnelle)
- Si les positions divergent → le répondant a des convictions qui résistent à sa bulle info
- Si le répondant pense que ses sources sont "neutres" mais que la source a un biais mesurable → biais de perception

Note : les réseaux sociaux (internet) ont un effet miroir — ils renforcent les positions existantes via les algorithmes.`;
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

  return `Tu es l'analyste politique de VoxCité, une application citoyenne française.
Tu analyses le profil d'un répondant sur 5 axes politiques (échelle -1 à +1).

AXES :
- sociétal : -1=conservateur, +1=progressiste
- économique : -1=interventionniste, +1=libéral
- autorité : -1=autoritaire, +1=libertaire
- écologie : -1=productiviste, +1=écologiste
- souveraineté : -1=souverainiste, +1=mondialiste

PROFIL GLOBAL DU RÉPONDANT (MOYENNES — attention, ces moyennes masquent des nuances) :
sociétal=${position.societal.toFixed(2)}, économique=${position.economic.toFixed(2)}, autorité=${position.authority.toFixed(2)}, écologie=${position.ecology.toFixed(2)}, souveraineté=${position.sovereignty.toFixed(2)}

POSITION PAR RAPPORT À LA POPULATION (${populationStats.totalRespondents} répondants) :
${statsBlock}

PARTIS POLITIQUES (triés par proximité) :
${partyBlock}
${mediaBiasBlock}
${signalsBlock}

INSTRUCTIONS :
1. Tutoie le répondant. Sois direct, factuel, sans jargon. Pas de flatterie.
2. PRIORITÉ : les contradictions, réponses tranchées et variations par domaine sont PLUS INTÉRESSANTES que les moyennes globales. Ne te focalise PAS sur un seul axe (ex: l'écologie) juste parce que la moyenne y est forte. Cherche les TENSIONS, les SURPRISES, les INCOHÉRENCES entre domaines. Un profil qui dit "libertaire" sur la démocratie mais "autoritaire" sur la sécurité, c'est ça qui fait le sel de l'analyse.
3. Produis un JSON strict (pas de markdown, pas de texte autour) avec cette structure :

{
  "summary": "2-3 phrases d'accroche. Mentionne la CONTRADICTION la plus révélatrice, le trait le plus marqué, et une surprise. Ne résume PAS à un seul axe.",
  "vsCitoyens": "3-4 phrases avec les percentiles. Identifie où le répondant est dans la norme et où il est atypique. Utilise des formulations comme 'Tu es plus X que Y% des répondants.'",
  "vsPartis": "3-4 phrases. Parti le plus proche, parti le plus éloigné, au moins une surprise (accord inattendu ou désaccord avec le parti le plus proche). Mentionne les axes précis.",
  "biases": [
    {
      "category": "media ou values",
      "biasType": "type (voir liste ci-dessous)",
      "axis": "axe concerné",
      "description": "description concrète en 1-2 phrases",
      "strength": 0.7,
      "suggestedContent": "contenu factuel et vérifiable à proposer",
      "suggestedSource": "nom d'un média aux positions opposées à consulter (optionnel)"
    }
  ],
  "espritCritiquePistes": ["3-5 sujets concrets qui ciblent les CONTRADICTIONS INTERNES du répondant — pas ses positions les plus évidentes"]
}

TYPES DE BIAIS À IDENTIFIER :

Catégorie "media" (biais lié aux sources d'information) :
- "bulle_info" : la position du répondant est très proche de celle de sa source d'info → il baigne dans une bulle
- "perception_erronee" : le répondant pense que ses sources sont neutres/de gauche/de droite mais la réalité mesurée est différente
- "echo_algorithmique" : si source = internet/réseaux sociaux, les algorithmes renforcent ses positions existantes

Catégorie "values" (biais lié aux convictions profondes) :
- "confirmation" : position extrême (>0.6 ou <-0.6) sur un axe → tendance à ne retenir que les infos qui confirment
- "cadrage" : positions contradictoires entre 2 axes (ex: libertaire + interventionniste fort → comment concilier liberté individuelle et État fort ?)
- "tribalisme" : distance très faible avec un seul parti → risque d'identification partisane qui empêche la nuance
- "moralisation" : position extrême sur l'axe sociétal → tendance à moraliser le débat plutôt qu'à argumenter

RÈGLES :
- Identifie 2-5 biais (au moins 1 de chaque catégorie si source d'info renseignée)
- strength: 0.3=léger, 0.5=modéré, 0.7=marqué, 0.9=très marqué
- suggestedContent : TOUJOURS factuel et vérifiable
- suggestedSource : un média RÉEL dont la ligne éditoriale est OPPOSÉE à la position du répondant sur l'axe du biais
- Les pistes esprit critique doivent être CONCRÈTES (pas "renseigne-toi sur X" mais "les données de l'INSEE montrent que..." ou "le rapport du GIEC 2025 indique que...")

Réponds UNIQUEMENT avec le JSON, rien d'autre.`;
}

/**
 * Run analysis using Claude API.
 */
export async function runAiAnalysis(input: AnalysisInput): Promise<AiAnalysisResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY not set');
  }

  const client = new Anthropic({ apiKey });
  const prompt = buildPrompt(input);

  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 3500,
    messages: [{ role: 'user', content: prompt }],
  });

  const text = response.content[0].type === 'text' ? response.content[0].text : '';

  try {
    const cleaned = text.replace(/^```(?:json)?\s*\n?/i, '').replace(/\n?```\s*$/i, '').trim();
    return JSON.parse(cleaned) as AiAnalysisResult;
  } catch {
    return {
      summary: text.slice(0, 500),
      vsCitoyens: '',
      vsPartis: '',
      biases: [],
      espritCritiquePistes: [],
    };
  }
}
