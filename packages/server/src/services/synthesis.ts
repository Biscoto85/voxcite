import type { CompassPosition, Quadrant, CollectiveSynthesis } from '@partiprism/shared';

interface OpinionRow {
  positionSocietal: number;
  positionEconomic: number;
  positionAuthority: number;
  positionEcology: number;
  positionSovereignty: number;
}

function getQuadrant(p: CompassPosition): Quadrant {
  const soc = p.societal >= 0 ? 'progressiste' : 'conservateur';
  const eco = p.economic >= 0 ? 'liberal' : 'interventionniste';
  return `${soc}_${eco}` as Quadrant;
}

/**
 * Agrège les avis citoyens pour produire une synthèse collective.
 */
export function aggregateOpinions(
  subjectId: string,
  opinions: OpinionRow[],
): CollectiveSynthesis {
  const total = opinions.length;

  const sum = opinions.reduce(
    (acc, o) => ({
      societal: acc.societal + o.positionSocietal,
      economic: acc.economic + o.positionEconomic,
      authority: acc.authority + o.positionAuthority,
      ecology: acc.ecology + o.positionEcology,
      sovereignty: acc.sovereignty + o.positionSovereignty,
    }),
    { societal: 0, economic: 0, authority: 0, ecology: 0, sovereignty: 0 },
  );

  const mean: CompassPosition = {
    societal: total > 0 ? sum.societal / total : 0,
    economic: total > 0 ? sum.economic / total : 0,
    authority: total > 0 ? sum.authority / total : 0,
    ecology: total > 0 ? sum.ecology / total : 0,
    sovereignty: total > 0 ? sum.sovereignty / total : 0,
  };

  // Quadrant counts
  const quadrantCounts: Record<Quadrant, number> = {
    progressiste_liberal: 0,
    progressiste_interventionniste: 0,
    conservateur_liberal: 0,
    conservateur_interventionniste: 0,
  };

  for (const o of opinions) {
    const q = getQuadrant({ societal: o.positionSocietal, economic: o.positionEconomic, authority: o.positionAuthority, ecology: o.positionEcology, sovereignty: o.positionSovereignty });
    quadrantCounts[q]++;
  }

  const quadrants = Object.fromEntries(
    Object.entries(quadrantCounts).map(([k, count]) => [
      k,
      { count, percent: total > 0 ? Math.round((count / total) * 1000) / 10 : 0 },
    ]),
  ) as CollectiveSynthesis['quadrants'];

  return {
    subjectId,
    totalVotes: total,
    distribution: {
      mean,
      median: mean, // TODO: compute real median
      stdDev: { societal: 0, economic: 0, authority: 0, ecology: 0, sovereignty: 0 }, // TODO: compute real std dev
    },
    quadrants,
  };
}
