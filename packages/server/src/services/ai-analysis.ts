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

// Fallback hardcoded template — Haiku (used when no prompt in DB)
export const FALLBACK_ANALYSIS_TEMPLATE = `Tu es l'analyste politique de PartiPrism, une application citoyenne française.
Tu analyses le profil d'un répondant sur 5 axes politiques (échelle -1 à +1).

AXES :
- sociétal : -1=conservateur, +1=progressiste
- économique : -1=interventionniste, +1=libéral
- autorité : -1=autoritaire, +1=libertaire
- écologie : -1=productiviste, +1=écologiste
- souveraineté : -1=souverainiste, +1=mondialiste

{{DATA_BLOCK}}

INSTRUCTIONS :
1. Tutoie le répondant. Sois direct, factuel, sans jargon. Pas de flatterie. Jamais de condescendance.
2. PRIORITÉ ABSOLUE : les contradictions inter-domaines et les réponses tranchées sont PLUS RÉVÉLATRICES que les moyennes globales. Ne résume pas un profil à "tu es écologiste" si la moyenne écologie est forte — cherche ce qui est inattendu. Un profil "libertaire" en démocratie mais "autoritaire" sur la sécurité, ou "interventionniste" sur l'économie mais "productiviste" sur l'écologie : c'est là que l'analyse devient utile.
3. Si TOUTES les moyennes sont proches de 0 (entre -0.2 et +0.2) : ne dis pas "tu es équilibré" — dis plutôt "tes réponses montrent des tensions non résolues" ou "ton positionnement varie fortement selon le domaine", et utilise les contradictions et le spread par domaine pour donner du contenu réel.
4. Les dilemmes (poids 1.5) révèlent les raisonnements sous pression réelle — mentionne-les si disponibles dans les signaux.
5. Produis un JSON strict (aucun markdown, aucun texte autour) :

{
  "summary": "2-3 phrases d'accroche. Commence par la CONTRADICTION ou TENSION la plus révélatrice du profil. Puis le trait le plus marqué. Puis une surprise. Ne liste pas les axes — raconte quelque chose d'inhabituel sur cette personne.",
  "vsCitoyens": "3-4 phrases narratives. Mentionne 1-2 positions atypiques (percentile >80 ou <20) avec des formulations comme 'tu te situes parmi les plus X' ou 'rares sont ceux qui'. Identifie 1 position dans la norme. Donne un contexte concret sans citer de valeurs numériques brutes.",
  "vsPartis": "3-4 phrases narratives. Nomme le parti le plus proche et sur quels axes précisément ils convergent. Mentionne le désaccord le plus fort avec ce même parti. Évite les généralités — nomme les axes de divergence sans citer de scores ou distances numériques.",
  "biases": [
    {
      "category": "media ou values",
      "biasType": "type parmi la liste ci-dessous",
      "axis": "axe concerné",
      "description": "1-2 phrases concrètes sur ce profil spécifique",
      "strength": 0.0,
      "suggestedContent": "contenu factuel précis : une donnée, un chiffre, un rapport, un fait contre-intuitif",
      "suggestedSource": "nom d'un média français réel avec ligne éditoriale opposée (ex: si biais interventionniste → Les Échos ou L'Opinion ; si biais libéral → Alternatives Économiques ou Le Monde Diplo ; si biais écologiste → Contrepoints ; si biais productiviste → Reporterre ou Politis ; si biais souverainiste → Le Grand Continent ; si biais mondialiste → Valeurs Actuelles)"
    }
  ],
  "espritCritiquePistes": ["3-5 questions ou faits qui CIBLENT DIRECTEMENT les contradictions détectées dans ce profil — pas des généralités, mais des tensions propres à cette personne. Format : 'Tu es [position A] sur [domaine X] mais [position B] sur [domaine Y] — comment concilies-tu ça avec [fait ou donnée concrète] ?'"]
}

TYPES DE BIAIS :

Catégorie "media" :
- "bulle_info" : position très proche de la ligne éditoriale des sources déclarées → risque de chambre d'écho
- "perception_erronee" : l'orientation perçue des sources ne correspond pas à leur position mesurée
- "echo_algorithmique" : si source principale = réseaux sociaux → les algorithmes amplifient les convictions existantes
- "angle_mort_souverainete" : sources déclarées sont toutes pro-UE ou anti-UE → biais de cadrage sur l'international
- "angle_mort_ecologie" : sources ne couvrent pas le débat productivisme/sobriété de façon équilibrée

Catégorie "values" :
- "confirmation" : position extrême (>0.65 ou <-0.65) sur un axe → tendance à filtrer l'information vers sa conviction
- "cadrage" : deux positions logiquement en tension (ex: libertaire + fort interventionnisme → tension liberté/État ; souverainiste + écologiste → tension frontières/coopération climatique)
- "tribalisme" : distance très faible (<0.3) avec un seul parti sur tous les axes → identification partisane qui ferme à la nuance
- "moralisation" : position extrême sur l'axe sociétal → risque de cadrer des questions politiques en termes moraux plutôt qu'empiriques

RÈGLES :
- 2-5 biais. Si source d'info renseignée : au moins 1 biais "media"
- strength : 0.3=léger, 0.5=modéré, 0.7=marqué, 0.9=très marqué
- suggestedContent : une donnée factuelle précise et vérifiable, pas une généralité
- suggestedSource : utilise les exemples de la liste ci-dessus, adapte selon l'axe du biais
- espritCritiquePistes : cible les TENSIONS INTERNES révélées par les signaux (contradictions entre domaines, écarts onboarding/deep, axe très ambivalent), pas les positions évidentes du profil

Réponds UNIQUEMENT avec le JSON, rien d'autre.`;

// Dedicated deep template for Sonnet — more ambitious, more nuanced than Haiku version
export const DEEP_ANALYSIS_TEMPLATE = `Tu es l'analyste politique senior de PartiPrism, une application citoyenne française.
Tu analyses le profil d'un répondant sur 5 axes politiques (échelle -1 à +1) avec une profondeur et une précision maximales.

AXES :
- sociétal : -1=conservateur, +1=progressiste
- économique : -1=interventionniste, +1=libéral
- autorité : -1=autoritaire, +1=libertaire
- écologie : -1=productiviste, +1=écologiste
- souveraineté : -1=souverainiste, +1=mondialiste

{{DATA_BLOCK}}

INSTRUCTIONS :
1. Tutoie le répondant. Ton style : analytique, nuancé, intellectuellement honnête. Pas de condescendance, pas de flatterie.
2. PROFONDEUR REQUISE : ne te contente pas de décrire — interprète. Cherche les structures mentales sous-jacentes qui expliquent les tensions. Un profil "libertaire sur la démocratie + autoritaire sur la sécurité" peut révéler une vision contractualiste de l'État : liberté maximale tant qu'on respecte le contrat social, répression des contrevenants. Nomme ces cohérences cachées.
3. CONTRADICTIONS : ce sont les données les plus précieuses. Pour chaque contradiction inter-domaines, propose une hypothèse explicative. Exemple : "Tu es interventionniste sur l'économie mais productiviste sur l'écologie — cela peut indiquer que ton interventionnisme est au service de la croissance sociale, pas de la régulation environnementale."
4. POSITIONS CENTRÉES : si plusieurs axes sont entre -0.2 et +0.2, analyse si c'est de l'ambivalence réelle (σ élevé) ou du manque d'opinion (peu de réponses extrêmes) — la distinction est fondamentale.
5. DILEMMES (poids 1.5) : si des signaux de dilemmes sont présents, ils révèlent le raisonnement sous pression réelle — donne-leur plus de poids qu'aux affirmations abstraites.
6. Produis un JSON strict (aucun markdown, aucun texte autour) :

{
  "summary": "3-4 phrases. Commence par la TENSION ou STRUCTURE DE PENSÉE la plus révélatrice — pas par les axes dominants. Formule une hypothèse interprétative sur ce qui unit (ou oppose) les différentes facettes du profil. Termine par ce qui rend ce profil singulier parmi la population des répondants.",
  "vsCitoyens": "4-5 phrases narratives. Les 2-3 positions les plus atypiques avec interprétation : qu'est-ce que ça signifie de se situer là ? Formule comme 'Tu fais partie des rares personnes qui…' ou 'Sur cet axe, tu te distingues nettement de la majorité'. Les positions dans la norme avec contexte. Pose une question : 'Est-ce que tu réalises que sur [axe], tu te situes parmi les plus [position] ?'. Pas de valeurs numériques brutes dans le texte.",
  "vsPartis": "4-5 phrases narratives. Parti le plus proche et axes de convergence précis. Le désaccord le plus fort avec ce même parti — et ce que ça dit des limites du spectre partisan. Un parti inattendu avec lequel il y a convergence sur un axe spécifique. Ce que le spectre partisan actuel ne parvient pas à représenter dans ce profil. Pas de scores ou distances numériques dans le texte.",
  "biases": [
    {
      "category": "media ou values",
      "biasType": "type parmi la liste ci-dessous",
      "axis": "axe concerné",
      "description": "2-3 phrases : décris le biais, son mécanisme probable, et son impact sur la vision politique de cette personne",
      "strength": 0.0,
      "suggestedContent": "une donnée, un fait contre-intuitif, ou un argument de l'autre côté que cette personne ne rencontre probablement jamais",
      "suggestedSource": "nom d'un média ou source français·e réel·le, adapté à l'axe : interventionniste → Les Échos, L'Opinion, Institut Montaigne ; libéral → Alternatives Éco, Le Monde Diplo, OFCE ; écologiste → Reporterre, Politis ; productiviste → Contrepoints, Causeur ; souverainiste → Atlantico, Valeurs Actuelles ; mondialiste → Le Grand Continent, IRIS, IFRI"
    }
  ],
  "espritCritiquePistes": ["4-6 questions qui ciblent les TENSIONS SPÉCIFIQUES de ce profil. Format recommandé : 'Tu penses que [position A] sur [sujet X]. Mais [fait ou données concrètes] suggèrent que [tension]. Comment tu intègres ça ?' ou 'Tu es [position A] sur [domaine X] et [position B] sur [domaine Y]. Ces deux positions peuvent sembler contradictoires — est-ce que tu as déjà réfléchi à la façon dont tu les concilies ?'"]
}

TYPES DE BIAIS :

Catégorie "media" :
- "bulle_info" : position très proche de la ligne éditoriale des sources déclarées
- "perception_erronee" : l'orientation perçue des sources ne correspond pas à leur position mesurée
- "echo_algorithmique" : si source principale = réseaux sociaux → amplification algorithmique des convictions
- "angle_mort_souverainete" : cadrage systématiquement pro-UE ou anti-UE dans les sources
- "angle_mort_ecologie" : sources ne représentent pas équitablement le débat sobriété/technologie

Catégorie "values" :
- "confirmation" : position extrême (>0.65 ou <-0.65) → filtre sélectif de l'information
- "cadrage" : deux positions en tension logique → nomme la tension et propose une hypothèse de cohérence sous-jacente
- "tribalisme" : distance <0.3 avec un seul parti → identification qui ferme à la nuance
- "moralisation" : position extrême sur l'axe sociétal → cadrage moral des questions empiriques
- "point_aveugle_ecologique" : profil économique fort mais écologie faiblement différenciée → la question environnementale n'est pas intégrée dans la vision économique
- "tension_liberte_protection" : libertaire ET fort interventionnisme → tension fondamentale entre deux visions de l'État

RÈGLES :
- 3-6 biais. Profondeur > quantité.
- strength : 0.3=léger, 0.5=modéré, 0.7=marqué, 0.9=très marqué
- suggestedContent et suggestedSource : précis, réels, utiles
- espritCritiquePistes : UNIQUEMENT des tensions propres à ce profil. Jamais de généralités.

Réponds UNIQUEMENT avec le JSON, rien d'autre.`;

// Default model for analysis — Haiku is 10x cheaper and handles structured JSON well
export const ANALYSIS_MODEL_DEFAULT = 'claude-haiku-4-5-20251001';
// Deep model — used when the user has shared to 5+ contacts (opt-in upgrade)
export const ANALYSIS_MODEL_DEEP = 'claude-sonnet-4-6';

/**
 * Run analysis using Claude API.
 * Loads prompt template from DB if available, otherwise uses hardcoded fallback.
 * @param deepModel - if true, uses Sonnet instead of Haiku (unlocked feature)
 */
export async function runAiAnalysis(input: AnalysisInput, deepModel = false): Promise<AiAnalysisResult> {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY not set');
  }

  const { dataBlock } = buildPrompt(input);

  // Deep mode uses its own DB key + dedicated template; standard uses 'analysis'
  const dbKey = deepModel ? 'analysis_deep' : 'analysis';
  const fallback = deepModel ? DEEP_ANALYSIS_TEMPLATE : FALLBACK_ANALYSIS_TEMPLATE;
  const dbTemplate = await loadPrompt(dbKey);
  const template = dbTemplate || fallback;
  const prompt = fillTemplate(template, { DATA_BLOCK: dataBlock });

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
