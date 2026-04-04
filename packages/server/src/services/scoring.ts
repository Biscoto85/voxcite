import type { CompassPosition, Question } from '@voxcite/shared';

interface ResponseInput {
  questionId: string;
  value: number;
}

/**
 * Calcul de la position sur les 3 axes depuis les réponses.
 * Même algorithme que le client (packages/client/src/hooks/useCompassPosition.ts).
 */
export function calculatePosition(
  responses: ResponseInput[],
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
