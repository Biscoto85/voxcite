import Anthropic from '@anthropic-ai/sdk';
import type { CompassPosition, AxisId } from '@voxcite/shared';
import type { AxisStats, PopulationStats, UserPercentiles } from './population.js';

const ALL_AXES: AxisId[] = ['societal', 'economic', 'authority', 'ecology', 'sovereignty'];

interface PartyInput {
  id: string;
  label: string;
  abbreviation: string;
  position: CompassPosition;
}

interface AnalysisInput {
  position: CompassPosition;
  parties: PartyInput[];
  populationStats: PopulationStats;
  percentiles: UserPercentiles;
}

export interface IdentifiedBias {
  biasType: string;
  axis: AxisId;
  description: string;
  strength: number;
  suggestedContent: string;
}

export interface AiAnalysisResult {
  summary: string;
  vsCitoyens: string;
  vsPartis: string;
  biases: IdentifiedBias[];
  espritCritiquePistes: string[];
}

function buildPrompt(input: AnalysisInput): string {
  const { position, parties, populationStats, percentiles } = input;

  // Sort parties by distance to user
  const ranked = parties.map((p) => {
    const dist = Math.sqrt(
      ALL_AXES.reduce((s, ax) => s + (position[ax] - p.position[ax]) ** 2, 0),
    );
    return { ...p, distance: dist };
  }).sort((a, b) => a.distance - b.distance);

  const partyBlock = ranked.map((p) =>
    `- ${p.abbreviation} (${p.label}) : sociétal=${p.position.societal.toFixed(2)}, économique=${p.position.economic.toFixed(2)}, autorité=${p.position.authority.toFixed(2)}, écologie=${p.position.ecology.toFixed(2)}, souveraineté=${p.position.sovereignty.toFixed(2)} → distance=${p.distance.toFixed(3)}`,
  ).join('\n');

  const statsBlock = ALL_AXES.map((ax) => {
    const s = populationStats.axes[ax];
    const pct = percentiles.axes[ax];
    return `- ${ax} : répondant=${position[ax].toFixed(2)}, moyenne population=${s.mean.toFixed(2)}, écart-type=${s.stdDev.toFixed(2)}, percentile=${pct}% (${pct > 50 ? 'au-dessus' : 'en-dessous'} de la médiane)`;
  }).join('\n');

  return `Tu es l'analyste politique de VoxCité, une application citoyenne française.
Tu analyses le profil d'un répondant sur 5 axes politiques (échelle -1 à +1).

AXES :
- sociétal : -1=conservateur, +1=progressiste
- économique : -1=interventionniste, +1=libéral
- autorité : -1=autoritaire, +1=libertaire
- écologie : -1=productiviste, +1=écologiste
- souveraineté : -1=souverainiste, +1=mondialiste

PROFIL DU RÉPONDANT :
sociétal=${position.societal.toFixed(2)}, économique=${position.economic.toFixed(2)}, autorité=${position.authority.toFixed(2)}, écologie=${position.ecology.toFixed(2)}, souveraineté=${position.sovereignty.toFixed(2)}

POSITION PAR RAPPORT À LA POPULATION (${populationStats.totalRespondents} répondants) :
${statsBlock}

PARTIS POLITIQUES (triés par proximité) :
${partyBlock}

INSTRUCTIONS :
1. Tutoie le répondant. Sois direct, factuel, sans jargon.
2. Produis un JSON strict (pas de markdown, pas de texte autour) avec cette structure :

{
  "summary": "2-3 phrases d'accroche percutantes sur le profil global du répondant. Mentionne le parti le plus proche et la principale surprise.",
  "vsCitoyens": "3-4 phrases comparant le répondant à la population. Utilise les percentiles. Ex: 'Tu es plus libéral que 78% des répondants.' Identifie où il est dans la norme et où il est atypique.",
  "vsPartis": "3-4 phrases sur la proximité avec les partis. Mentionne le plus proche, le plus éloigné, et au moins une surprise (un accord inattendu ou un désaccord avec le parti le plus proche).",
  "biases": [
    {
      "biasType": "type de biais cognitif/idéologique (ex: confirmation, ancrage, cadrage, tribalisme, moralisation)",
      "axis": "axe concerné (societal/economic/authority/ecology/sovereignty)",
      "description": "description concrète du biais potentiel, en lien avec les positions extrêmes ou incohérences du répondant",
      "strength": 0.7,
      "suggestedContent": "type de contenu factuel à proposer pour challenger ce biais (ex: 'Données sur l'efficacité économique des services publics privatisés en Europe')"
    }
  ],
  "espritCritiquePistes": ["3-5 pistes concrètes de sujets ou faits vérifiés qui challengeraient les convictions du répondant, basées sur ses positions les plus extrêmes"]
}

RÈGLES POUR LES BIAIS :
- Identifie 2-4 biais potentiels basés sur les positions extrêmes (>0.5 ou <-0.5)
- Un score extrême sur un axe suggère un biais de confirmation sur ce sujet
- Des positions contradictoires entre axes suggèrent un biais de cadrage
- La proximité forte avec un seul parti suggère un biais de tribalisme
- strength: 0.3=léger, 0.5=modéré, 0.7=marqué, 0.9=très marqué
- suggestedContent doit être FACTUEL et VÉRIFIABLE, jamais idéologique

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
    max_tokens: 2000,
    messages: [{ role: 'user', content: prompt }],
  });

  const text = response.content[0].type === 'text' ? response.content[0].text : '';

  try {
    const result = JSON.parse(text) as AiAnalysisResult;
    return result;
  } catch {
    // If JSON parsing fails, return the raw text as summary
    return {
      summary: text.slice(0, 500),
      vsCitoyens: '',
      vsPartis: '',
      biases: [],
      espritCritiquePistes: [],
    };
  }
}
