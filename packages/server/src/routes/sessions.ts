import { Router } from 'express';
import { db } from '../db/index.js';
import { snapshots, votes } from '../db/schema.js';
import { geolocateIP, validatePostalCode } from '../services/geolocation.js';

export const sessionsRouter = Router();

// POST /snapshot — enregistrer un positionnement anonyme (pour la nébuleuse)
// Aucun identifiant de session, aucune IP stockée.
sessionsRouter.post('/snapshot', async (req, res) => {
  const { postalCode, position, infoSource, perceivedBias } = req.body as {
    postalCode?: string;
    position: { societal: number; economic: number; authority: number; ecology: number; sovereignty: number };
    infoSource?: string;
    perceivedBias?: string;
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
  });

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
