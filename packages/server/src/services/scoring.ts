import type { CompassPosition, Question } from '@voxcite/shared';

interface ResponseInput {
  questionId: string;
  value: number;
}

/**
 * Même algorithme que le client (packages/client/src/hooks/useCompassPosition.ts).
 * Dupliqué côté serveur pour la validation.
 */
export function calculatePosition(
  responses: ResponseInput[],
  questions: Question[],
): CompassPosition {
  let socTotal = 0;
  let socWeight = 0;
  let ecoTotal = 0;
  let ecoWeight = 0;

  for (const resp of responses) {
    const q = questions.find((q) => q.id === resp.questionId);
    if (!q) continue;

    const contribution = resp.value * q.polarity * q.weight;

    if (q.axis === 'societal' || q.axis === 'both') {
      socTotal += contribution;
      socWeight += Math.abs(q.weight) * 2;
    }
    if (q.axis === 'economic' || q.axis === 'both') {
      ecoTotal += contribution;
      ecoWeight += Math.abs(q.weight) * 2;
    }
  }

  return {
    societal: socWeight > 0 ? Math.max(-1, Math.min(1, socTotal / socWeight)) : 0,
    economic: ecoWeight > 0 ? Math.max(-1, Math.min(1, ecoTotal / ecoWeight)) : 0,
  };
}
