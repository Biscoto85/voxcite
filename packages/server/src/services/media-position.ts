/**
 * Shared service for resolving the average political position of a set of media
 * sources from their IDs. Used by both the sync analysis route and the async worker.
 */
import type { CompassPosition } from '@partiprism/shared';
import { db } from '../db/index.js';
import { medias } from '../db/schema.js';
import { inArray } from 'drizzle-orm';

const avg = (vals: number[]) => vals.reduce((s, v) => s + v, 0) / vals.length;

export interface MediaPositionResult {
  position?: CompassPosition;
  labels: string[];
}

export async function resolveMediaPosition(sourceIds: string[]): Promise<MediaPositionResult> {
  if (sourceIds.length === 0) return { labels: [] };

  try {
    const rows = await db.select({
      label: medias.label,
      positionSocietal: medias.positionSocietal,
      positionEconomic: medias.positionEconomic,
      positionAuthority: medias.positionAuthority,
      positionEcology: medias.positionEcology,
      positionSovereignty: medias.positionSovereignty,
    }).from(medias).where(inArray(medias.id, sourceIds));

    if (rows.length === 0) return { labels: [] };

    return {
      labels: rows.map((r) => r.label),
      position: {
        societal: avg(rows.map((r) => r.positionSocietal)),
        economic: avg(rows.map((r) => r.positionEconomic)),
        authority: avg(rows.map((r) => r.positionAuthority)),
        ecology: avg(rows.map((r) => r.positionEcology)),
        sovereignty: avg(rows.map((r) => r.positionSovereignty)),
      },
    };
  } catch (err) {
    console.error('[media-position] Failed to resolve media positions:', err);
    return { labels: [] };
  }
}
