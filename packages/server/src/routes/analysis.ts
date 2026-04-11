import { Router } from 'express';
import type { CompassPosition, AxisId } from '@partiprism/shared';
import { AXES } from '@partiprism/shared';
import { runAiAnalysis } from '../services/ai-analysis.js';
import { getPopulationStats, getUserPercentiles } from '../services/population.js';
import { extractResponseSignals } from '../services/response-signals.js';
import { db } from '../db/index.js';
import { questions, medias, analysisJobs } from '../db/schema.js';
import { eq, inArray } from 'drizzle-orm';
import { ALL_AXES } from '../utils/helpers.js';
import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';

export const analysisRouter = Router();

// Load media aggregate positions from YAML
const DATA_DIR = path.resolve(import.meta.dirname, '../../../../data');
let mediaAggregates: Record<string, CompassPosition> = {};
try {
  const raw = fs.readFileSync(path.join(DATA_DIR, 'medias/sources.yaml'), 'utf-8');
  const data = yaml.load(raw) as { aggregates: Array<{ id: string; position: Record<string, number> }> };
  for (const agg of data.aggregates) {
    const key = agg.id.replace('aggregate_', '');
    mediaAggregates[key] = agg.position as unknown as CompassPosition;
  }
} catch { /* will work without media data */ }

const SOURCE_TO_AGGREGATE: Record<string, string> = {
  tv: 'tv',
  internet: 'internet',
  radio: 'radio',
  journal: 'presse',
};

interface PartyInput {
  id: string;
  label: string;
  abbreviation: string;
  position: CompassPosition;
}

// ── Fallback rule-based analysis ────────────────────────────────────

function generateFallbackAnalysis(
  position: CompassPosition,
  parties: PartyInput[],
) {
  const ranked = parties.map((p) => {
    const diffs = ALL_AXES.map((axis) => ({
      axis,
      diff: position[axis] - p.position[axis],
      absDiff: Math.abs(position[axis] - p.position[axis]),
    }));
    const distance = Math.sqrt(diffs.reduce((s, d) => s + d.diff ** 2, 0));
    const sorted = [...diffs].sort((a, b) => a.absDiff - b.absDiff);
    return { party: p, distance, closest: sorted[0], furthest: sorted[sorted.length - 1] };
  }).sort((a, b) => a.distance - b.distance);

  const closest = ranked[0];
  const furthest = ranked[ranked.length - 1];

  const extremeAxis = ALL_AXES.reduce((best, axis) =>
    Math.abs(position[axis]) > Math.abs(position[best]) ? axis : best,
  );
  const extremeInfo = AXES[extremeAxis];
  const extremeLabel = position[extremeAxis] > 0 ? extremeInfo.positive : extremeInfo.negative;

  return {
    summary: `Tu es le plus proche de ${closest.party.label} (${closest.party.abbreviation}) et le plus éloigné de ${furthest.party.label}. Ton trait le plus marqué : "${extremeLabel}" sur l'axe ${extremeInfo.negative}↔${extremeInfo.positive}.`,
    vsCitoyens: 'Analyse comparative avec les autres citoyens disponible quand la clé API Claude est configurée.',
    vsPartis: closest.furthest.absDiff > 0.5
      ? `Malgré ta proximité avec ${closest.party.abbreviation}, vous divergez fortement sur l'axe ${AXES[closest.furthest.axis as AxisId].negative}↔${AXES[closest.furthest.axis as AxisId].positive}.`
      : `Tu es globalement aligné avec ${closest.party.abbreviation} sur tous les axes.`,
    biases: [],
    espritCritiquePistes: [
      `Explorer les arguments en faveur de "${position[extremeAxis] > 0 ? extremeInfo.negative : extremeInfo.positive}" sur l'axe ${extremeInfo.negative}↔${extremeInfo.positive}.`,
    ],
  };
}

// ── Route ───────────────────────────────────────────────────────────
// Analyse one-shot éphémère.
// Le client envoie position + réponses individuelles (pour les contradictions).
// Le serveur traite sans rien stocker. Résultat caché côté client.

analysisRouter.post('/', async (req, res) => {
  const {
    position, parties, infoSource, perceivedBias, responses: clientResponses,
    infoFormats, mediaSources, infoDiversity, mediaRelationship, deepAnalysis,
  } = req.body as {
    position: CompassPosition;
    parties: PartyInput[];
    infoSource?: string;
    perceivedBias?: string;
    infoFormats?: string[];
    mediaSources?: string[];
    infoDiversity?: string;
    mediaRelationship?: string;
    responses?: Array<{ questionId: string; value: number }>;
    deepAnalysis?: boolean;
  };

  if (!position || !parties) {
    res.status(400).json({ error: 'position and parties required' });
    return;
  }

  // Validate position axes are in [-1, 1]
  const axes = ['societal', 'economic', 'authority', 'ecology', 'sovereignty'] as const;
  const pos = position as Record<string, unknown>;
  if (!axes.every((a) => typeof pos[a] === 'number' && (pos[a] as number) >= -1.001 && (pos[a] as number) <= 1.001)) {
    res.status(400).json({ error: 'Position axis values must be in [-1, 1]' });
    return;
  }

  // Clamp mediaSources size to prevent inArray explosion
  if (mediaSources && mediaSources.length > 20) {
    mediaSources = mediaSources.slice(0, 20);
  }

  // Résolution de la position médias :
  // 1. Si des IDs de médias spécifiques sont déclarés → calcul précis depuis la DB
  // 2. Sinon, si le format est connu → position agrégée par type (YAML)
  let mediaPosition: CompassPosition | undefined;
  let declaredMediaLabels: string[] = [];

  if (mediaSources && mediaSources.length > 0) {
    try {
      const avg = (vals: number[]) => vals.reduce((s, v) => s + v, 0) / vals.length;
      const rows = await db.select({
        label: medias.label,
        positionSocietal: medias.positionSocietal,
        positionEconomic: medias.positionEconomic,
        positionAuthority: medias.positionAuthority,
        positionEcology: medias.positionEcology,
        positionSovereignty: medias.positionSovereignty,
      }).from(medias).where(inArray(medias.id, mediaSources));

      if (rows.length > 0) {
        declaredMediaLabels = rows.map((r) => r.label);
        mediaPosition = {
          societal: avg(rows.map((r) => r.positionSocietal)),
          economic: avg(rows.map((r) => r.positionEconomic)),
          authority: avg(rows.map((r) => r.positionAuthority)),
          ecology: avg(rows.map((r) => r.positionEcology)),
          sovereignty: avg(rows.map((r) => r.positionSovereignty)),
        };
      }
    } catch (err) {
      console.error('[analysis] Failed to compute media average from DB:', err);
    }
  } else if (infoFormats && infoFormats.length > 0) {
    // Fallback: agréger les positions moyennes par format déclaré
    const aggPositions = infoFormats
      .map((f) => {
        const key = SOURCE_TO_AGGREGATE[f] || f;
        return mediaAggregates[key];
      })
      .filter(Boolean);
    if (aggPositions.length > 0) {
      const avg = (vals: number[]) => vals.reduce((s, v) => s + v, 0) / vals.length;
      mediaPosition = {
        societal: avg(aggPositions.map((p) => p.societal)),
        economic: avg(aggPositions.map((p) => p.economic)),
        authority: avg(aggPositions.map((p) => p.authority)),
        ecology: avg(aggPositions.map((p) => p.ecology)),
        sovereignty: avg(aggPositions.map((p) => p.sovereignty)),
      };
    }
  } else if (infoSource) {
    // Legacy: ancienne source unique
    const aggKey = SOURCE_TO_AGGREGATE[infoSource] || infoSource;
    mediaPosition = mediaAggregates[aggKey];
  }

  // Extract response-level signals for contradiction detection (ephemeral)
  let responseSignals = undefined;
  if (clientResponses && clientResponses.length > 0) {
    try {
      const allQuestions = await db.select().from(questions);
      const mappedQuestions = allQuestions.map((q) => ({
        id: q.id,
        text: q.text,
        axis: q.axis,
        axes: (q.axes as string[] | null),
        polarity: q.polarity,
        domainId: q.domainId,
        phase: q.phase,
        weight: q.weight,
      }));
      responseSignals = extractResponseSignals(clientResponses, mappedQuestions);
    } catch (err) {
      console.error('[analysis] Failed to extract response signals:', err);
    }
  }

  // Try AI analysis (ephemeral — nothing stored server-side)
  if (process.env.ANTHROPIC_API_KEY) {
    try {
      const [populationStats, percentiles] = await Promise.all([
        getPopulationStats().catch(() => ({ totalRespondents: 0, axes: {} as any })),
        getUserPercentiles(position).catch(() => ({ axes: {} as any })),
      ]);

      const result = await runAiAnalysis({
        position,
        parties,
        populationStats,
        percentiles,
        infoSource,
        perceivedBias,
        infoFormats,
        mediaSources: declaredMediaLabels,
        infoDiversity,
        mediaRelationship,
        mediaPosition,
        responseSignals,
      }, deepAnalysis === true);

      res.json(result);
      return;
    } catch (err) {
      console.error('[analysis] AI analysis failed, using fallback:', err);
    }
  }

  try {
    res.json(generateFallbackAnalysis(position, parties));
  } catch (err) {
    console.error('[analysis] Fallback analysis failed:', err);
    res.status(500).json({ error: 'Analysis unavailable' });
  }
});

// ── Async queue endpoints ────────────────────────────────────────────
// POST /api/analysis/queue — enqueue a job, return {jobId} immediately
// GET  /api/analysis/queue/:jobId — poll for status + result

analysisRouter.post('/queue', async (req, res) => {
  const body = req.body as Record<string, unknown>;
  if (!body.position || !body.parties) {
    res.status(400).json({ error: 'position and parties required' });
    return;
  }

  try {
    const [job] = await db.insert(analysisJobs).values({
      status: 'pending',
      requestData: body,
    }).returning({ id: analysisJobs.id });

    res.status(202).json({ jobId: job.id });
  } catch (err) {
    console.error('[analysis/queue] Failed to enqueue job:', err);
    res.status(500).json({ error: 'Failed to enqueue analysis' });
  }
});

analysisRouter.get('/queue/:jobId', async (req, res) => {
  const { jobId } = req.params;
  try {
    const [job] = await db.select().from(analysisJobs).where(eq(analysisJobs.id, jobId));
    if (!job) { res.status(404).json({ error: 'Job not found' }); return; }

    if (job.status === 'done') {
      res.json({ status: 'done', result: job.resultData });
    } else if (job.status === 'failed') {
      res.json({ status: 'failed', error: job.errorMessage });
    } else {
      res.json({ status: job.status });
    }
  } catch (err) {
    console.error('[analysis/queue] Failed to fetch job:', err);
    res.status(500).json({ error: 'Failed to fetch job status' });
  }
});
