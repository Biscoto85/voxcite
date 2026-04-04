import { Router } from 'express';
import { db } from '../db/index.js';
import { sessions } from '../db/schema.js';
import { isNotNull } from 'drizzle-orm';
import { buildNebulaData } from '../services/nebula.js';
import type { AxisId } from '@voxcite/shared';

const VALID_AXES: AxisId[] = ['societal', 'economic', 'authority', 'ecology', 'sovereignty'];

export const nebulaRouter = Router();

// GET /?xAxis=societal&yAxis=economic — nebula data for 2D view
nebulaRouter.get('/', async (req, res) => {
  const xAxis = (req.query.xAxis as string) || 'societal';
  const yAxis = (req.query.yAxis as string) || 'economic';

  if (!VALID_AXES.includes(xAxis as AxisId) || !VALID_AXES.includes(yAxis as AxisId)) {
    res.status(400).json({ error: 'Invalid axis. Valid: ' + VALID_AXES.join(', ') });
    return;
  }

  // Fetch all completed sessions with positions
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

  const nebula = buildNebulaData(allSessions, xAxis as AxisId, yAxis as AxisId);
  res.json(nebula);
});
