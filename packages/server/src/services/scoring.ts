import type { CompassPosition, Question, AxisId } from '@partiprism/shared';
import { ALL_AXES, clamp } from '../utils/helpers.js';

interface ResponseInput {
  questionId: string;
  value: number;
}

/** Résout les axes qu'une question mesure */
export function resolveAxes(q: Pick<Question, 'axis' | 'axes'>): AxisId[] {
  if (q.axes && q.axes.length > 0) return q.axes;
  switch (q.axis) {
    case 'both': return ['societal', 'economic'];
    case 'all': return [...ALL_AXES];
    default: return [q.axis as AxisId];
  }
}

/**
 * Calcul de la position sur les 5 axes depuis les réponses.
 */
export function calculatePosition(
  responses: ResponseInput[],
  questions: Question[],
): CompassPosition {
  const totals: Record<AxisId, number> = { societal: 0, economic: 0, authority: 0, ecology: 0, sovereignty: 0 };
  const weights: Record<AxisId, number> = { societal: 0, economic: 0, authority: 0, ecology: 0, sovereignty: 0 };

  for (const resp of responses) {
    const q = questions.find((q) => q.id === resp.questionId);
    if (!q) continue;

    const contribution = resp.value * q.polarity * q.weight;
    const maxContrib = Math.abs(q.weight) * 2;
    const axes = resolveAxes(q);

    for (const axis of axes) {
      totals[axis] += contribution;
      weights[axis] += maxContrib;
    }
  }

  return {
    societal: weights.societal > 0 ? clamp(totals.societal / weights.societal) : 0,
    economic: weights.economic > 0 ? clamp(totals.economic / weights.economic) : 0,
    authority: weights.authority > 0 ? clamp(totals.authority / weights.authority) : 0,
    ecology: weights.ecology > 0 ? clamp(totals.ecology / weights.ecology) : 0,
    sovereignty: weights.sovereignty > 0 ? clamp(totals.sovereignty / weights.sovereignty) : 0,
  };
}
