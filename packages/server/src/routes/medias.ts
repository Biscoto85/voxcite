import { Router } from 'express';
import { db } from '../db/index.js';
import { medias } from '../db/schema.js';
import { asc } from 'drizzle-orm';

export const mediasRouter = Router();

// GET / — liste des médias de référence (pour l'audit sources)
// Inclut les positions éditoriales sur les 5 axes pour le calcul des gaps côté client
mediasRouter.get('/', async (_req, res) => {
  const list = await db.select({
    id: medias.id,
    label: medias.label,
    type: medias.type,
    independent: medias.independent,
    editorialLabel: medias.editorialLabel,
    positionSocietal: medias.positionSocietal,
    positionEconomic: medias.positionEconomic,
    positionAuthority: medias.positionAuthority,
    positionEcology: medias.positionEcology,
    positionSovereignty: medias.positionSovereignty,
  }).from(medias).orderBy(asc(medias.type), asc(medias.label));

  res.json(list);
});
