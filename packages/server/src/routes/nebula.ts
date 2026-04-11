import { Router } from 'express';
import { db } from '../db/index.js';
import { snapshots, orphanReports } from '../db/schema.js';
import { buildNebulaData } from '../services/nebula.js';
import type { AxisId } from '@partiprism/shared';
import { ALL_AXES } from '../utils/helpers.js';
import { sql } from 'drizzle-orm';

export const nebulaRouter = Router();

// GET /?xAxis=societal&yAxis=economic — nebula data for 2D view
// Reads from anonymous snapshots (no session data).
nebulaRouter.get('/', async (req, res) => {
  const xAxis = (req.query.xAxis as string) || 'societal';
  const yAxis = (req.query.yAxis as string) || 'economic';

  if (!ALL_AXES.includes(xAxis as AxisId) || !ALL_AXES.includes(yAxis as AxisId)) {
    res.status(400).json({ error: 'Invalid axis. Valid: ' + ALL_AXES.join(', ') });
    return;
  }

  // Cap at 10 000 random rows — statistically representative for KDE,
  // prevents full-table load at scale (100k+ users).
  const allSnapshots = await db
    .select({
      societal: snapshots.positionSocietal,
      economic: snapshots.positionEconomic,
      authority: snapshots.positionAuthority,
      ecology: snapshots.positionEcology,
      sovereignty: snapshots.positionSovereignty,
      isOrphan: snapshots.isOrphan,
    })
    .from(snapshots)
    .orderBy(sql`RANDOM()`)
    .limit(10_000);

  const nebula = buildNebulaData(allSnapshots, xAxis as AxisId, yAxis as AxisId);
  res.json(nebula);
});

// GET /orphan-stats — statistiques depuis la table orphan_reports (déclarations tardives)
nebulaRouter.get('/orphan-stats', async (_req, res) => {
  const [stats] = await db.select({
    total: sql<number>`COUNT(*)::int`,
    orphanCount: sql<number>`SUM(CASE WHEN ${orphanReports.isOrphan} THEN 1 ELSE 0 END)::int`,
  }).from(orphanReports);

  const total = stats?.total ?? 0;
  const orphanCount = stats?.orphanCount ?? 0;

  res.json({
    total,
    orphanCount,
    orphanPct: total > 0 ? Math.round((orphanCount / total) * 100) : null,
  });
});
