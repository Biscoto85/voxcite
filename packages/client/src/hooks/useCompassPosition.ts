import { useMemo } from 'react';
import type { CompassPosition, Question, QuestionResponse, AxisId } from '@voxcite/shared';

/**
 * Calcule la position sur les 5 axes du compas depuis les réponses.
 */
export function useCompassPosition(
  responses: QuestionResponse[],
  questions: Question[],
): CompassPosition {
  return useMemo(() => calculatePosition(responses, questions), [responses, questions]);
}

/** Résout les axes qu'une question mesure */
function resolveAxes(q: Question): AxisId[] {
  if (q.axes && q.axes.length > 0) return q.axes;
  switch (q.axis) {
    case 'both': return ['societal', 'economic'];
    case 'all': return ['societal', 'economic', 'authority', 'ecology', 'sovereignty'];
    default: return [q.axis as AxisId];
  }
}

export function calculatePosition(
  responses: QuestionResponse[],
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

  const clamp = (val: number) => Math.max(-1, Math.min(1, val));

  return {
    societal: weights.societal > 0 ? clamp(totals.societal / weights.societal) : 0,
    economic: weights.economic > 0 ? clamp(totals.economic / weights.economic) : 0,
    authority: weights.authority > 0 ? clamp(totals.authority / weights.authority) : 0,
    ecology: weights.ecology > 0 ? clamp(totals.ecology / weights.ecology) : 0,
    sovereignty: weights.sovereignty > 0 ? clamp(totals.sovereignty / weights.sovereignty) : 0,
  };
}
