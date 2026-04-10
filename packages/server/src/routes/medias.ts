import { Router } from 'express';
import { db } from '../db/index.js';
import { medias } from '../db/schema.js';
import { asc } from 'drizzle-orm';

export const mediasRouter = Router();

// GET / — liste des médias de référence (pour l'audit sources)
mediasRouter.get('/', async (_req, res) => {
  const list = await db.select({
    id: medias.id,
    label: medias.label,
    type: medias.type,
    independent: medias.independent,
    editorialLabel: medias.editorialLabel,
  }).from(medias).orderBy(asc(medias.type), asc(medias.label));

  res.json(list);
});
