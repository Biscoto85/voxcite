import { Router } from 'express';
import { eq } from 'drizzle-orm';
import { db } from '../db/index.js';
import { snapshots, votes, orphanReports } from '../db/schema.js';
import { geolocateIP, validatePostalCode } from '../services/geolocation.js';

type AxisMap = { societal: number; economic: number; authority: number; ecology: number; sovereignty: number };

/** Validates that a compass position has all 5 axes in [-1, 1]. */
function isValidPosition(pos: unknown): pos is AxisMap {
  if (!pos || typeof pos !== 'object') return false;
  const p = pos as Record<string, unknown>;
  const axes: (keyof AxisMap)[] = ['societal', 'economic', 'authority', 'ecology', 'sovereignty'];
  return axes.every((a) => typeof p[a] === 'number' && p[a] >= -1.001 && p[a] <= 1.001);
}

export const sessionsRouter = Router();

// POST /snapshot — enregistrer un positionnement anonyme (pour la nébuleuse)
// Aucun identifiant de session, aucune IP stockée.
sessionsRouter.post('/snapshot', async (req, res) => {
  const { postalCode, position, infoSource, perceivedBias, infoFormats, mediaSources, infoDiversity, mediaRelationship, isOrphan, qualityScore } = req.body as {
    postalCode?: string;
    position: { societal: number; economic: number; authority: number; ecology: number; sovereignty: number };
    infoSource?: string;
    perceivedBias?: string;
    infoFormats?: string[];
    mediaSources?: string[];
    infoDiversity?: string;
    mediaRelationship?: string;
    isOrphan?: boolean;
    qualityScore?: number;
  };

  if (!position || !isValidPosition(position)) {
    res.status(400).json({ error: 'position required with all 5 axes in [-1, 1]' });
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

  const [row] = await db.insert(snapshots).values({
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
    qualityScore: qualityScore ?? null,
  }).returning({ id: snapshots.id });

  if (qualityScore !== undefined && qualityScore < 0.3) {
    console.warn(`[partiprism-api] Snapshot low quality score: ${qualityScore.toFixed(2)} — possible rage-fill or robot`);
  }

  // Return token so the client can PATCH the position after deep question refinement
  res.status(201).json({ ok: true, token: row.id });
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

// PATCH /snapshot/:token — affiner le positionnement après les questions approfondies
// Le token est un UUID retourné par POST /snapshot et stocké dans localStorage (jamais côté serveur).
// Seul le propriétaire du token (qui le détient dans son navigateur) peut mettre à jour son snapshot.
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

sessionsRouter.patch('/snapshot/:token', async (req, res) => {
  const { token } = req.params;
  const { position } = req.body as { position: unknown };

  if (!UUID_RE.test(token)) {
    res.status(400).json({ error: 'invalid token' });
    return;
  }

  if (!isValidPosition(position)) {
    res.status(400).json({ error: 'position required with all 5 axes in [-1, 1]' });
    return;
  }

  const updated = await db.update(snapshots)
    .set({
      positionSocietal: position.societal,
      positionEconomic: position.economic,
      positionAuthority: position.authority,
      positionEcology: position.ecology,
      positionSovereignty: position.sovereignty,
    })
    .where(eq(snapshots.id, token))
    .returning({ id: snapshots.id });

  if (updated.length === 0) {
    res.status(404).json({ error: 'snapshot not found' });
    return;
  }

  res.status(200).json({ ok: true });
});

// POST /vote — enregistrer un vote anonyme individuel
// Pas de session, pas d'IP, pas de lien entre les votes.
sessionsRouter.post('/vote', async (req, res) => {
  const { questionId, value, durationMs } = req.body as {
    questionId: string;
    value: number;
    durationMs?: number;
  };

  if (!questionId || value == null) {
    res.status(400).json({ error: 'questionId and value required' });
    return;
  }

  if (durationMs !== undefined && durationMs < 300) {
    console.warn(`[partiprism-api] Vote suspiciously fast: questionId=${questionId} durationMs=${durationMs}`);
  }

  await db.insert(votes).values({ questionId, value });
  res.status(201).json({ ok: true });
});
