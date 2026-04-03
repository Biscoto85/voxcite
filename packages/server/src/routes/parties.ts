import { Router } from 'express';
import { db } from '../db/index.js';
import { parties } from '../db/schema.js';

export const partiesRouter = Router();

// GET / — tous les partis politiques
partiesRouter.get('/', async (_req, res) => {
  const allParties = await db.select().from(parties);

  const result = allParties.map((p) => ({
    id: p.id,
    label: p.label,
    abbreviation: p.abbreviation,
    position: {
      societal: p.positionSocietal,
      economic: p.positionEconomic,
    },
    color: p.color,
    leader: p.leader,
    visibleOnCompass: p.visibleOnCompass,
  }));

  res.json(result);
});
