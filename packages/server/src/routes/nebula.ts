import { Router } from 'express';
import { db } from '../db/index.js';
import { snapshots } from '../db/schema.js';
import { buildNebulaData } from '../services/nebula.js';
import type { AxisId } from '@partiprism/shared';
import { ALL_AXES } from '../utils/helpers.js';

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

  const allSnapshots = await db
    .select({
      societal: snapshots.positionSocietal,
      economic: snapshots.positionEconomic,
      authority: snapshots.positionAuthority,
      ecology: snapshots.positionEcology,
      sovereignty: snapshots.positionSovereignty,
      isOrphan: snapshots.isOrphan,
    })
    .from(snapshots);

  const nebula = buildNebulaData(allSnapshots, xAxis as AxisId, yAxis as AxisId);
  res.json(nebula);
});

// GET /orphan-stats — statistiques orphelins uniquement
nebulaRouter.get('/orphan-stats', async (_req, res) => {
  const allSnapshots = await db
    .select({
      societal: snapshots.positionSocietal,
      economic: snapshots.positionEconomic,
      authority: snapshots.positionAuthority,
      ecology: snapshots.positionEcology,
      sovereignty: snapshots.positionSovereignty,
      isOrphan: snapshots.isOrphan,
    })
    .from(snapshots);

  const withAnswer = allSnapshots.filter((s) => s.isOrphan !== null && s.isOrphan !== undefined);
  const orphanCount = withAnswer.filter((s) => s.isOrphan === true).length;

  res.json({
    total: withAnswer.length,
    orphanCount,
    orphanPct: withAnswer.length > 0 ? Math.round((orphanCount / withAnswer.length) * 100) : null,
  });
});
