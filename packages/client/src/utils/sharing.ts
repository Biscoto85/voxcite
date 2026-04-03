import type { CompassPosition } from '@voxcite/shared';
import { getQuadrant, getQuadrantLabel } from './scoring';

/**
 * Génère le texte de partage pour les réseaux sociaux.
 */
export function generateShareText(position: CompassPosition, statChoc: string): string {
  const label = getQuadrantLabel(position);
  return `Je suis dans le quadrant ${label}. ${statChoc} Et toi ? #VoxCité`;
}

/**
 * Génère une image de partage depuis un canvas.
 * À implémenter quand le CompassCanvas sera prêt.
 */
export function generateShareImage(_canvas: HTMLCanvasElement): string {
  return _canvas.toDataURL('image/png');
}
