import { db } from '../db/index.js';
import { sessions } from '../db/schema.js';
import { isNotNull } from 'drizzle-orm';
import type { AxisId } from '@voxcite/shared';

const ALL_AXES: AxisId[] = ['societal', 'economic', 'authority', 'ecology', 'sovereignty'];

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
  axes: Record<AxisId, number>; // 0-100 percentile
}

/**
 * Compute population statistics from all completed sessions.
 */
export async function getPopulationStats(): Promise<PopulationStats> {
  const allSessions = await db
    .select({
      societal: sessions.positionSocietal,
      economic: sessions.positionEconomic,
      authority: sessions.positionAuthority,
      ecology: sessions.positionEcology,
      sovereignty: sessions.positionSovereignty,
    })
    .from(sessions)
    .where(isNotNull(sessions.positionSocietal));

  const count = allSessions.length;

  const axisStats = {} as Record<AxisId, AxisStats>;

  for (const axis of ALL_AXES) {
    const values = allSessions.map((s) => s[axis] as number).filter((v) => v != null);
    const n = values.length;

    if (n === 0) {
      axisStats[axis] = { mean: 0, stdDev: 0, min: 0, max: 0, count: 0 };
      continue;
    }

    const mean = values.reduce((s, v) => s + v, 0) / n;
    const variance = values.reduce((s, v) => s + (v - mean) ** 2, 0) / n;
    const stdDev = Math.sqrt(variance);

    axisStats[axis] = {
      mean,
      stdDev,
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
  const allSessions = await db
    .select({
      societal: sessions.positionSocietal,
      economic: sessions.positionEconomic,
      authority: sessions.positionAuthority,
      ecology: sessions.positionEcology,
      sovereignty: sessions.positionSovereignty,
    })
    .from(sessions)
    .where(isNotNull(sessions.positionSocietal));

  const percentiles = {} as Record<AxisId, number>;

  for (const axis of ALL_AXES) {
    const values = allSessions.map((s) => s[axis] as number).filter((v) => v != null);
    if (values.length === 0) {
      percentiles[axis] = 50;
      continue;
    }
    const below = values.filter((v) => v < userPosition[axis]).length;
    percentiles[axis] = Math.round((below / values.length) * 100);
  }

  return { axes: percentiles };
}
