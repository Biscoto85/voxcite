import { Router } from 'express';
import type { CompassPosition, AxisId } from '@voxcite/shared';
import { AXES } from '@voxcite/shared';
import { runAiAnalysis } from '../services/ai-analysis.js';
import { getPopulationStats, getUserPercentiles } from '../services/population.js';
import { db } from '../db/index.js';
import { biases } from '../db/schema.js';

export const analysisRouter = Router();

const ALL_AXES: AxisId[] = ['societal', 'economic', 'authority', 'ecology', 'sovereignty'];

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

analysisRouter.post('/', async (req, res) => {
  const { position, parties, sessionId } = req.body as {
    position: CompassPosition;
    parties: PartyInput[];
    sessionId?: string;
  };

  if (!position || !parties) {
    res.status(400).json({ error: 'position and parties required' });
    return;
  }

  // Try AI analysis first
  if (process.env.ANTHROPIC_API_KEY) {
    try {
      const [populationStats, percentiles] = await Promise.all([
        getPopulationStats(),
        getUserPercentiles(position),
      ]);

      const result = await runAiAnalysis({
        position,
        parties,
        populationStats,
        percentiles,
      });

      // Store biases in DB if sessionId provided
      if (sessionId && result.biases.length > 0) {
        for (const bias of result.biases) {
          await db.insert(biases).values({
            sessionId,
            biasType: bias.biasType,
            axis: bias.axis,
            description: bias.description,
            strength: bias.strength,
            suggestedContent: bias.suggestedContent,
          });
        }
      }

      res.json(result);
      return;
    } catch (err) {
      console.error('[analysis] AI analysis failed, using fallback:', err);
    }
  }

  // Fallback
  res.json(generateFallbackAnalysis(position, parties));
});
