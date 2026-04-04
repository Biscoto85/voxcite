import type { AxisId, CompassPosition } from '@voxcite/shared';
import { AXES } from '@voxcite/shared';

const ALL_AXES: AxisId[] = ['societal', 'economic', 'authority', 'ecology', 'sovereignty'];

interface QuestionRow {
  id: string;
  text: string;
  axis: string;
  axes: string[] | null;
  polarity: number;
  domainId: string;
  phase: string;
  weight: number;
}

interface ResponseRow {
  questionId: string;
  value: number;
}

/** Résout les axes d'une question */
function resolveAxes(q: QuestionRow): AxisId[] {
  if (q.axes && q.axes.length > 0) return q.axes as AxisId[];
  switch (q.axis) {
    case 'both': return ['societal', 'economic'];
    case 'all': return ALL_AXES;
    default: return [q.axis as AxisId];
  }
}

// ── Types exportés ─────────────────────────────────────────────────

export interface ExtremeResponse {
  questionText: string;
  domain: string;
  value: number;        // raw response (-2 to +2)
  axes: AxisId[];
  contribution: number; // signed, after polarity
}

export interface DomainProfile {
  domain: string;
  axes: Partial<Record<AxisId, number>>;  // average per axis for this domain
  questionCount: number;
}

export interface AxisContradiction {
  axis: AxisId;
  domainA: string;
  domainB: string;
  valueA: number;
  valueB: number;
  gap: number;
}

export interface PhaseShift {
  axis: AxisId;
  onboarding: number;
  afterDeep: number;
  shift: number;
}

export interface ResponseSignals {
  extremeResponses: ExtremeResponse[];
  domainProfiles: DomainProfile[];
  contradictions: AxisContradiction[];
  phaseShifts: PhaseShift[];
  axisSpread: Record<AxisId, number>;   // standard deviation of contributions per axis
}

// ── Extraction ─────────────────────────────────────────────────────

export function extractResponseSignals(
  responses: ResponseRow[],
  questions: QuestionRow[],
): ResponseSignals {
  const qMap = new Map(questions.map((q) => [q.id, q]));

  // ── 1. Extreme responses (|value| >= 2, i.e. strongly agree/disagree)
  const extremeResponses: ExtremeResponse[] = [];
  for (const r of responses) {
    const q = qMap.get(r.questionId);
    if (!q) continue;
    if (Math.abs(r.value) >= 2) {
      const axes = resolveAxes(q);
      extremeResponses.push({
        questionText: q.text,
        domain: q.domainId,
        value: r.value,
        axes,
        contribution: r.value * q.polarity,
      });
    }
  }

  // ── 2. Domain-level profiles (axis position per domain)
  const domainTotals: Record<string, Record<AxisId, number>> = {};
  const domainWeights: Record<string, Record<AxisId, number>> = {};
  const domainCounts: Record<string, number> = {};

  for (const r of responses) {
    const q = qMap.get(r.questionId);
    if (!q) continue;

    if (!domainTotals[q.domainId]) {
      domainTotals[q.domainId] = { societal: 0, economic: 0, authority: 0, ecology: 0, sovereignty: 0 };
      domainWeights[q.domainId] = { societal: 0, economic: 0, authority: 0, ecology: 0, sovereignty: 0 };
      domainCounts[q.domainId] = 0;
    }

    const contribution = r.value * q.polarity * q.weight;
    const maxContrib = Math.abs(q.weight) * 2;
    const axes = resolveAxes(q);

    for (const axis of axes) {
      domainTotals[q.domainId][axis] += contribution;
      domainWeights[q.domainId][axis] += maxContrib;
    }
    domainCounts[q.domainId]++;
  }

  const domainProfiles: DomainProfile[] = Object.keys(domainTotals).map((domain) => {
    const axes: Partial<Record<AxisId, number>> = {};
    for (const ax of ALL_AXES) {
      if (domainWeights[domain][ax] > 0) {
        axes[ax] = Math.max(-1, Math.min(1, domainTotals[domain][ax] / domainWeights[domain][ax]));
      }
    }
    return { domain, axes, questionCount: domainCounts[domain] };
  });

  // ── 3. Cross-domain contradictions (same axis, opposite directions)
  const contradictions: AxisContradiction[] = [];
  for (const axis of ALL_AXES) {
    const domainValues: Array<{ domain: string; value: number }> = [];
    for (const dp of domainProfiles) {
      if (dp.axes[axis] !== undefined && dp.questionCount >= 2) {
        domainValues.push({ domain: dp.domain, value: dp.axes[axis]! });
      }
    }
    // Find pairs with biggest gap
    for (let i = 0; i < domainValues.length; i++) {
      for (let j = i + 1; j < domainValues.length; j++) {
        const gap = Math.abs(domainValues[i].value - domainValues[j].value);
        if (gap >= 0.4) {
          contradictions.push({
            axis,
            domainA: domainValues[i].domain,
            domainB: domainValues[j].domain,
            valueA: domainValues[i].value,
            valueB: domainValues[j].value,
            gap,
          });
        }
      }
    }
  }
  contradictions.sort((a, b) => b.gap - a.gap);

  // ── 4. Onboarding vs deep position shift
  const onbResponses = responses.filter((r) => qMap.get(r.questionId)?.phase === 'onboarding');
  const phaseShifts: PhaseShift[] = [];

  if (onbResponses.length > 0 && responses.length > onbResponses.length) {
    const calcPos = (resps: ResponseRow[]): CompassPosition => {
      const totals: Record<AxisId, number> = { societal: 0, economic: 0, authority: 0, ecology: 0, sovereignty: 0 };
      const wts: Record<AxisId, number> = { societal: 0, economic: 0, authority: 0, ecology: 0, sovereignty: 0 };
      for (const r of resps) {
        const q = qMap.get(r.questionId);
        if (!q) continue;
        const c = r.value * q.polarity * q.weight;
        const m = Math.abs(q.weight) * 2;
        for (const ax of resolveAxes(q)) {
          totals[ax] += c;
          wts[ax] += m;
        }
      }
      const clamp = (v: number) => Math.max(-1, Math.min(1, v));
      return {
        societal: wts.societal > 0 ? clamp(totals.societal / wts.societal) : 0,
        economic: wts.economic > 0 ? clamp(totals.economic / wts.economic) : 0,
        authority: wts.authority > 0 ? clamp(totals.authority / wts.authority) : 0,
        ecology: wts.ecology > 0 ? clamp(totals.ecology / wts.ecology) : 0,
        sovereignty: wts.sovereignty > 0 ? clamp(totals.sovereignty / wts.sovereignty) : 0,
      };
    };

    const onbPos = calcPos(onbResponses);
    const fullPos = calcPos(responses);

    for (const axis of ALL_AXES) {
      const shift = fullPos[axis] - onbPos[axis];
      if (Math.abs(shift) >= 0.05) {
        phaseShifts.push({ axis, onboarding: onbPos[axis], afterDeep: fullPos[axis], shift });
      }
    }
    phaseShifts.sort((a, b) => Math.abs(b.shift) - Math.abs(a.shift));
  }

  // ── 5. Axis spread (std dev of per-question contributions)
  const axisContributions: Record<AxisId, number[]> = {
    societal: [], economic: [], authority: [], ecology: [], sovereignty: [],
  };

  for (const r of responses) {
    const q = qMap.get(r.questionId);
    if (!q) continue;
    const normalized = r.value * q.polarity; // -2 to +2 direction-corrected
    for (const axis of resolveAxes(q)) {
      axisContributions[axis].push(normalized);
    }
  }

  const axisSpread = {} as Record<AxisId, number>;
  for (const axis of ALL_AXES) {
    const vals = axisContributions[axis];
    if (vals.length < 2) { axisSpread[axis] = 0; continue; }
    const mean = vals.reduce((s, v) => s + v, 0) / vals.length;
    const variance = vals.reduce((s, v) => s + (v - mean) ** 2, 0) / vals.length;
    axisSpread[axis] = Math.sqrt(variance);
  }

  return { extremeResponses, domainProfiles, contradictions, phaseShifts, axisSpread };
}
