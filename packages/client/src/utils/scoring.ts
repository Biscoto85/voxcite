import type { CompassPosition, Quadrant, Party } from '@voxcite/shared';
import { QUADRANT_LABELS, QUADRANT_POPULATION_ESTIMATE } from '@voxcite/shared';

export function getQuadrant(position: CompassPosition): Quadrant {
  const soc = position.societal >= 0 ? 'progressiste' : 'conservateur';
  const eco = position.economic >= 0 ? 'liberal' : 'interventionniste';
  return `${soc}_${eco}` as Quadrant;
}

export function getQuadrantLabel(position: CompassPosition): string {
  return QUADRANT_LABELS[getQuadrant(position)];
}

export function getClosestParty(position: CompassPosition, parties: Party[]): Party | null {
  let closest: Party | null = null;
  let minDist = Infinity;

  for (const party of parties) {
    if (!party.visibleOnCompass) continue;
    const dx = party.position.societal - position.societal;
    const dy = party.position.economic - position.economic;
    const dist = Math.sqrt(dx * dx + dy * dy);
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
