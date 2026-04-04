import { db } from '../db/index.js';
import { snapshots } from '../db/schema.js';
import type { AxisId } from '@partiprism/shared';
import { ALL_AXES } from '../utils/helpers.js';

export interface AxisStats {
  mean: number;
  stdDev: number;
  min: number;
  max: number;
  count: number;
}

export interface PopulationStats {
  totalRespondents: number;
  axes: Record<AxisId, AxisStats>;
}

export interface UserPercentiles {
  axes: Record<AxisId, number>;
}

/**
 * Compute population statistics from anonymous snapshots.
 */
export async function getPopulationStats(): Promise<PopulationStats> {
  const allSnapshots = await db
    .select({
      societal: snapshots.positionSocietal,
      economic: snapshots.positionEconomic,
      authority: snapshots.positionAuthority,
      ecology: snapshots.positionEcology,
      sovereignty: snapshots.positionSovereignty,
    })
    .from(snapshots);

  const count = allSnapshots.length;
  const axisStats = {} as Record<AxisId, AxisStats>;

  for (const axis of ALL_AXES) {
    const values = allSnapshots.map((s) => s[axis] as number).filter((v) => v != null);
    const n = values.length;

    if (n === 0) {
      axisStats[axis] = { mean: 0, stdDev: 0, min: 0, max: 0, count: 0 };
      continue;
    }

    const mean = values.reduce((s, v) => s + v, 0) / n;
    const variance = values.reduce((s, v) => s + (v - mean) ** 2, 0) / n;

    axisStats[axis] = {
      mean,
      stdDev: Math.sqrt(variance),
      min: Math.min(...values),
      max: Math.max(...values),
      count: n,
    };
  }

  return { totalRespondents: count, axes: axisStats };
}

/**
 * Compute where a user sits relative to the population (percentile per axis).
 */
export async function getUserPercentiles(
  userPosition: Record<AxisId, number>,
): Promise<UserPercentiles> {
  const allSnapshots = await db
    .select({
      societal: snapshots.positionSocietal,
      economic: snapshots.positionEconomic,
      authority: snapshots.positionAuthority,
      ecology: snapshots.positionEcology,
      sovereignty: snapshots.positionSovereignty,
    })
    .from(snapshots);

  const percentiles = {} as Record<AxisId, number>;

  for (const axis of ALL_AXES) {
    const values = allSnapshots.map((s) => s[axis] as number).filter((v) => v != null);
    if (values.length === 0) {
      percentiles[axis] = 50;
      continue;
    }
    const below = values.filter((v) => v < userPosition[axis]).length;
    percentiles[axis] = Math.round((below / values.length) * 100);
  }

  return { axes: percentiles };
}
