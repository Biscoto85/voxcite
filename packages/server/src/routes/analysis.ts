import { Router } from 'express';
import type { CompassPosition, AxisId } from '@partiprism/shared';
import { AXES } from '@partiprism/shared';
import { runAiAnalysis } from '../services/ai-analysis.js';
import { getPopulationStats, getUserPercentiles } from '../services/population.js';
import { extractResponseSignals } from '../services/response-signals.js';
import { db } from '../db/index.js';
import { questions } from '../db/schema.js';
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
  const { position, parties, infoSource, perceivedBias, responses: clientResponses } = req.body as {
    position: CompassPosition;
    parties: PartyInput[];
    infoSource?: string;
    perceivedBias?: string;
    responses?: Array<{ questionId: string; value: number }>;
  };

  if (!position || !parties) {
    res.status(400).json({ error: 'position and parties required' });
    return;
  }

  // Resolve media aggregate position from infoSource
  let mediaPosition: CompassPosition | undefined;
  if (infoSource) {
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
        mediaPosition,
        responseSignals,
      });

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
