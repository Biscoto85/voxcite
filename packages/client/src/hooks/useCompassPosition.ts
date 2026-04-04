import { useMemo } from 'react';
import type { CompassPosition, Question, QuestionResponse } from '@voxcite/shared';

/**
 * Calcule la position sur les 3 axes du compas depuis les réponses.
 * Algorithme décrit dans docs/COMPASS_SPEC.md section 3.
 */
export function useCompassPosition(
  responses: QuestionResponse[],
  questions: Question[],
): CompassPosition {
  return useMemo(() => calculatePosition(responses, questions), [responses, questions]);
}

export function calculatePosition(
  responses: QuestionResponse[],
  questions: Question[],
): CompassPosition {
  let socTotal = 0, socWeight = 0;
  let ecoTotal = 0, ecoWeight = 0;
  let authTotal = 0, authWeight = 0;

  for (const resp of responses) {
    const q = questions.find((q) => q.id === resp.questionId);
    if (!q) continue;

    const contribution = resp.value * q.polarity * q.weight;
    const maxContrib = Math.abs(q.weight) * 2;

    if (q.axis === 'societal' || q.axis === 'both' || q.axis === 'all') {
      socTotal += contribution;
      socWeight += maxContrib;
    }
    if (q.axis === 'economic' || q.axis === 'both' || q.axis === 'all') {
      ecoTotal += contribution;
      ecoWeight += maxContrib;
    }
    if (q.axis === 'authority' || q.axis === 'all') {
      authTotal += contribution;
      authWeight += maxContrib;
    }
  }

  const clamp = (val: number) => Math.max(-1, Math.min(1, val));

  return {
    societal: socWeight > 0 ? clamp(socTotal / socWeight) : 0,
    economic: ecoWeight > 0 ? clamp(ecoTotal / ecoWeight) : 0,
    authority: authWeight > 0 ? clamp(authTotal / authWeight) : 0,
  };
}
