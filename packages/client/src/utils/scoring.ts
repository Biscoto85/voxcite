import type { CompassPosition, Quadrant, Party, AxisId } from '@voxcite/shared';
import { QUADRANT_LABELS, QUADRANT_POPULATION_ESTIMATE, AXES } from '@voxcite/shared';

const ALL_AXES: AxisId[] = ['societal', 'economic', 'authority', 'ecology', 'sovereignty'];

export function getQuadrant(position: CompassPosition): Quadrant {
  const soc = position.societal >= 0 ? 'progressiste' : 'conservateur';
  const eco = position.economic >= 0 ? 'liberal' : 'interventionniste';
  return `${soc}_${eco}` as Quadrant;
}

export function getQuadrantLabel(position: CompassPosition): string {
  return QUADRANT_LABELS[getQuadrant(position)];
}

/**
 * Generate a textual label from the 2-3 most pronounced axes.
 * E.g. "Interventionniste, progressiste, écologiste"
 */
export function getProfileLabel(position: CompassPosition): string {
  const ranked = ALL_AXES
    .map((axis) => ({
      axis,
      value: position[axis],
      absValue: Math.abs(position[axis]),
      label: position[axis] >= 0 ? AXES[axis].positive.toLowerCase() : AXES[axis].negative.toLowerCase(),
    }))
    .sort((a, b) => b.absValue - a.absValue);

  // Take top 2-3 (at least 2, add 3rd if still strong)
  const top = ranked.slice(0, ranked[2]?.absValue >= 0.3 ? 3 : 2);
  const labels = top.map((t) => t.label);
  // Capitalize first
  labels[0] = labels[0].charAt(0).toUpperCase() + labels[0].slice(1);
  return labels.join(', ');
}

export function getClosestParty(position: CompassPosition, parties: Party[]): Party | null {
  let closest: Party | null = null;
  let minDist = Infinity;

  for (const party of parties) {
    if (!party.visibleOnCompass) continue;
    const ds = party.position.societal - position.societal;
    const de = party.position.economic - position.economic;
    const da = party.position.authority - position.authority;
    const dc = party.position.ecology - position.ecology;
    const dv = party.position.sovereignty - position.sovereignty;
    const dist = Math.sqrt(ds*ds + de*de + da*da + dc*dc + dv*dv);
    if (dist < minDist) {
      minDist = dist;
      closest = party;
    }
  }

  return closest;
}

export function generateStatChoc(position: CompassPosition, closestParty: Party | null): string {
  const quadrant = getQuadrant(position);
  const percent = QUADRANT_POPULATION_ESTIMATE[quadrant];

  if (closestParty) {
    return `${percent}% des Français sont dans ton quadrant (${QUADRANT_LABELS[quadrant]}), mais tu es plus proche de ${closestParty.label} que tu ne le penses.`;
  }
  return `${percent}% des Français sont dans ton quadrant (${QUADRANT_LABELS[quadrant]}), mais aucun parti ne les représente pleinement.`;
}
