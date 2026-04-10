import type { AxisId } from '@partiprism/shared';

interface Point2D {
  x: number;
  y: number;
  isOrphan?: boolean | null;
}

const KDE_THRESHOLD = 100;
const GRID_SIZE = 30;

/**
 * Gaussian kernel function.
 */
function gaussian(d: number, bandwidth: number): number {
  return Math.exp(-0.5 * (d / bandwidth) ** 2) / (bandwidth * Math.sqrt(2 * Math.PI));
}

/**
 * Compute 2D Kernel Density Estimation on a grid.
 * Returns a GRID_SIZE x GRID_SIZE array of density values (0-1 normalized).
 */
export function computeKDE(
  points: Point2D[],
  gridSize: number = GRID_SIZE,
  bandwidth: number = 0.15,
): number[][] {
  const grid: number[][] = Array.from({ length: gridSize }, () =>
    Array(gridSize).fill(0),
  );

  if (points.length === 0) return grid;

  // Grid goes from -1 to +1 on both axes
  const step = 2 / gridSize;

  for (let i = 0; i < gridSize; i++) {
    for (let j = 0; j < gridSize; j++) {
      const gx = -1 + (j + 0.5) * step;
      const gy = -1 + (i + 0.5) * step;

      let density = 0;
      for (const p of points) {
        const dx = gx - p.x;
        const dy = gy - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        density += gaussian(dist, bandwidth);
      }
      grid[i][j] = density;
    }
  }

  // Normalize to 0-1
  let max = 0;
  for (const row of grid) {
    for (const val of row) {
      if (val > max) max = val;
    }
  }

  if (max > 0) {
    for (let i = 0; i < gridSize; i++) {
      for (let j = 0; j < gridSize; j++) {
        grid[i][j] /= max;
      }
    }
  }

  return grid;
}

export interface NebulaData {
  mode: 'points' | 'kde';
  totalResponses: number;
  orphanStats?: { total: number; orphanCount: number; orphanPct: number };
  /** Raw points (mode=points, <100 responses) — includes isOrphan flag */
  points?: Array<{ x: number; y: number; isOrphan?: boolean | null }>;
  /** KDE density grid for all users (mode=kde) */
  grid?: number[][];
  /** KDE density grid for orphelins only (mode=kde) */
  gridOrphan?: number[][];
  gridSize?: number;
}

interface SnapshotPosition {
  societal: number | null;
  economic: number | null;
  authority: number | null;
  ecology: number | null;
  sovereignty: number | null;
  isOrphan?: boolean | null;
}

/**
 * Build nebula data from session positions.
 */
export function buildNebulaData(
  positions: SnapshotPosition[],
  xAxis: AxisId,
  yAxis: AxisId,
): NebulaData {
  const points: Point2D[] = [];

  for (const pos of positions) {
    const x = pos[xAxis] as number | null;
    const y = pos[yAxis] as number | null;
    if (x != null && y != null) {
      points.push({ x, y, isOrphan: pos.isOrphan });
    }
  }

  // Compute orphan stats (only for those who answered the question)
  const withAnswer = points.filter((p) => p.isOrphan !== null && p.isOrphan !== undefined);
  const orphanCount = withAnswer.filter((p) => p.isOrphan === true).length;
  const orphanStats =
    withAnswer.length > 0
      ? {
          total: withAnswer.length,
          orphanCount,
          orphanPct: Math.round((orphanCount / withAnswer.length) * 100),
        }
      : undefined;

  if (points.length < KDE_THRESHOLD) {
    return {
      mode: 'points',
      totalResponses: points.length,
      orphanStats,
      points: points.map((p) => ({ x: p.x, y: p.y, isOrphan: p.isOrphan })),
    };
  }

  const grid = computeKDE(points);

  // Separate KDE grid for orphelins
  const orphanPoints = points.filter((p) => p.isOrphan === true);
  const gridOrphan = orphanPoints.length >= 5 ? computeKDE(orphanPoints) : undefined;

  return {
    mode: 'kde',
    totalResponses: points.length,
    orphanStats,
    grid,
    gridOrphan,
    gridSize: GRID_SIZE,
  };
}
