import { Router } from 'express';
import { db } from '../db/index.js';
import { snapshots, votes, orphanReports } from '../db/schema.js';
import { geolocateIP, validatePostalCode } from '../services/geolocation.js';

export const sessionsRouter = Router();

// POST /snapshot — enregistrer un positionnement anonyme (pour la nébuleuse)
// Aucun identifiant de session, aucune IP stockée.
sessionsRouter.post('/snapshot', async (req, res) => {
  const { postalCode, position, infoSource, perceivedBias, infoFormats, mediaSources, infoDiversity, mediaRelationship, isOrphan } = req.body as {
    postalCode?: string;
    position: { societal: number; economic: number; authority: number; ecology: number; sovereignty: number };
    infoSource?: string;
    perceivedBias?: string;
    infoFormats?: string[];
    mediaSources?: string[];
    infoDiversity?: string;
    mediaRelationship?: string;
    isOrphan?: boolean;
  };

  if (!position || position.societal == null) {
    res.status(400).json({ error: 'position required' });
    return;
  }

  // Validate postal code vs IP (IP checked but NOT stored)
  if (postalCode) {
    const ip = req.ip ?? req.socket.remoteAddress ?? '';
    const geo = await geolocateIP(ip);
    const validation = validatePostalCode(postalCode, geo);

    if (!validation.valid) {
      console.warn(`[partiprism-api] Snapshot postal/IP mismatch: postal=${postalCode} reason=${validation.reason}`);
      res.status(403).json({ error: 'Code postal incohérent avec ta localisation' });
      return;
    }
  }

  await db.insert(snapshots).values({
    postalCode: postalCode ?? null,
    positionSocietal: position.societal,
    positionEconomic: position.economic,
    positionAuthority: position.authority,
    positionEcology: position.ecology,
    positionSovereignty: position.sovereignty,
    infoSource: infoSource ?? null,
    perceivedBias: perceivedBias ?? null,
    infoFormats: infoFormats ?? null,
    mediaSources: mediaSources ?? null,
    infoDiversity: infoDiversity ?? null,
    mediaRelationship: mediaRelationship ?? null,
    isOrphan: isOrphan ?? null,
  });

  res.status(201).json({ ok: true });
});

// POST /validate-postal — valider le code postal vs IP sans créer de snapshot
sessionsRouter.post('/validate-postal', async (req, res) => {
  const { postalCode } = req.body as { postalCode?: string };

  if (!postalCode) {
    res.status(400).json({ error: 'postalCode required' });
    return;
  }

  const ip = req.ip ?? req.socket.remoteAddress ?? '';
  const geo = await geolocateIP(ip);
  const validation = validatePostalCode(postalCode, geo);

  if (!validation.valid) {
    console.warn(`[partiprism-api] validate-postal mismatch: postal=${postalCode} reason=${validation.reason}`);
    res.status(403).json({ error: 'Code postal incohérent avec ta localisation' });
    return;
  }

  res.status(200).json({ ok: true });
});

// POST /orphan-report — déclarer son statut d'orphelin politique (anonyme, séparé des snapshots)
sessionsRouter.post('/orphan-report', async (req, res) => {
  const { isOrphan } = req.body as { isOrphan: unknown };

  if (typeof isOrphan !== 'boolean') {
    res.status(400).json({ error: 'isOrphan (boolean) required' });
    return;
  }

  await db.insert(orphanReports).values({ isOrphan });
  res.status(201).json({ ok: true });
});

// POST /vote — enregistrer un vote anonyme individuel
// Pas de session, pas d'IP, pas de lien entre les votes.
sessionsRouter.post('/vote', async (req, res) => {
  const { questionId, value } = req.body as {
    questionId: string;
    value: number;
  };

  if (!questionId || value == null) {
    res.status(400).json({ error: 'questionId and value required' });
    return;
  }

  await db.insert(votes).values({ questionId, value });
  res.status(201).json({ ok: true });
});
