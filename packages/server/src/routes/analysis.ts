import { Router } from 'express';
import type { CompassPosition, AxisId } from '@voxcite/shared';
import { AXES } from '@voxcite/shared';

export const analysisRouter = Router();

const ALL_AXES: AxisId[] = ['societal', 'economic', 'authority', 'ecology', 'sovereignty'];

interface PartyInput {
  id: string;
  label: string;
  abbreviation: string;
  position: CompassPosition;
}

/**
 * Generate analysis using Claude API.
 * Falls back to rule-based analysis if API not configured.
 */
function generateAnalysis(
  position: CompassPosition,
  parties: PartyInput[],
) {
  // Compute distances
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
  const second = ranked[1];

  // Find user's most extreme axis
  const extremeAxis = ALL_AXES.reduce((best, axis) =>
    Math.abs(position[axis]) > Math.abs(position[best]) ? axis : best,
  );
  const extremeInfo = AXES[extremeAxis];
  const extremeLabel = position[extremeAxis] > 0 ? extremeInfo.positive : extremeInfo.negative;

  // Build summary
  const parts: string[] = [];

  parts.push(
    `Tu es le plus proche de ${closest.party.label} (${closest.party.abbreviation}, distance ${closest.distance.toFixed(2)}) et le plus éloigné de ${furthest.party.label} (${furthest.party.abbreviation}).`,
  );

  parts.push(
    `Ton trait le plus marqué est "${extremeLabel}" sur l'axe ${extremeInfo.negative}↔${extremeInfo.positive} (${position[extremeAxis] > 0 ? '+' : ''}${position[extremeAxis].toFixed(2)}).`,
  );

  // Surprises
  const surprises: string[] = [];

  // Surprise 1: closest party disagrees on one axis
  if (closest.furthest.absDiff > 0.5) {
    const axisInfo = AXES[closest.furthest.axis];
    surprises.push(
      `Malgré ta proximité avec ${closest.party.abbreviation}, vous divergez fortement sur l'axe ${axisInfo.negative}↔${axisInfo.positive} (écart de ${closest.furthest.absDiff.toFixed(2)}).`,
    );
  }

  // Surprise 2: a distant party agrees on one axis
  if (furthest.closest.absDiff < 0.2) {
    const axisInfo = AXES[furthest.closest.axis];
    surprises.push(
      `Surprise : tu partages presque la même position que ${furthest.party.abbreviation} sur l'axe ${axisInfo.negative}↔${axisInfo.positive}, alors que c'est le parti le plus éloigné de toi globalement.`,
    );
  }

  // Surprise 3: between two close parties
  if (second && Math.abs(closest.distance - second.distance) < 0.15) {
    surprises.push(
      `Tu es presque à égale distance entre ${closest.party.abbreviation} et ${second.party.abbreviation}. Le choix entre les deux se joue sur des nuances.`,
    );
  }

  return { summary: parts.join(' '), surprises };
}

// POST / — analyse du positionnement
analysisRouter.post('/', async (req, res) => {
  const { position, parties } = req.body as {
    position: CompassPosition;
    parties: PartyInput[];
  };

  if (!position || !parties) {
    res.status(400).json({ error: 'position and parties required' });
    return;
  }

  // TODO: If ANTHROPIC_API_KEY is set, use Claude for richer analysis
  // For now, use rule-based analysis
  const analysis = generateAnalysis(position, parties);
  res.json(analysis);
});
