import { Router } from 'express';
import { db } from '../db/index.js';
import { partis } from '../db/schema.js';

export const partisRouter = Router();

// GET / — tous les partis politiques
partisRouter.get('/', async (_req, res) => {
  const allParties = await db.select().from(partis);

  const result = allParties.map((p) => ({
    id: p.id,
    label: p.label,
    abbreviation: p.abbreviation,
    position1d: p.position1d,
    position: {
      societal: p.positionSocietal,
      economic: p.positionEconomic,
      authority: p.positionAuthority,
    },
    color: p.color,
    leader: p.leader,
    visibleOnCompass: p.visibleOnCompass,
  }));

  res.json(result);
});
