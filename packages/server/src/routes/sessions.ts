import { Router } from 'express';
import { db } from '../db/index.js';
import { sessions, responses, questions } from '../db/schema.js';
import { eq } from 'drizzle-orm';
import type { AxisId } from '@partiprism/shared';
import { calculatePosition } from '../services/scoring.js';
import { geolocateIP, validatePostalCode } from '../services/geolocation.js';

export const sessionsRouter = Router();

// POST / — créer une session anonyme avec code postal obligatoire
sessionsRouter.post('/', async (req, res) => {
  const { postalCode, infoSource, perceivedBias } = req.body as {
    postalCode?: string;
    infoSource?: string;
    perceivedBias?: string;
  };

  // Postal code is required
  if (!postalCode || !/^\d{5}$/.test(postalCode)) {
    res.status(400).json({ error: 'Code postal requis (5 chiffres)' });
    return;
  }

  const ip = req.ip ?? req.socket.remoteAddress ?? '';
  const geo = await geolocateIP(ip);
  const validation = validatePostalCode(postalCode, geo);

  if (!validation.valid) {
    console.warn(`[partiprism-api] Postal/IP mismatch: postal=${postalCode} ip=${ip} country=${geo?.country} reason=${validation.reason}`);
    res.status(403).json({
      error: 'Code postal incohérent avec ta localisation',
      reason: validation.reason,
    });
    return;
  }

  const [session] = await db.insert(sessions).values({
    postalCode,
    infoSource: infoSource ?? null,
    perceivedBias: perceivedBias ?? null,
    ipCountry: geo?.country ?? null,
    ipRegion: geo?.region ?? null,
  }).returning();

  res.status(201).json({
    id: session.id,
    createdAt: session.createdAt,
  });
});

// POST /:id/responses — enregistrer des réponses et recalculer la position
sessionsRouter.post('/:id/responses', async (req, res) => {
  const sessionId = req.params.id;
  const { answers } = req.body as {
    answers: Array<{ questionId: string; value: number }>;
  };

  if (!answers || !Array.isArray(answers)) {
    res.status(400).json({ error: 'answers array required' });
    return;
  }

  // Insert responses
  for (const a of answers) {
    await db.insert(responses).values({
      sessionId,
      questionId: a.questionId,
      value: a.value,
    });
  }

  // Recalculate position from all responses
  const allResponses = await db
    .select()
    .from(responses)
    .where(eq(responses.sessionId, sessionId));

  const allQuestions = await db.select().from(questions);

  const mappedResponses = allResponses.map((r) => ({
    questionId: r.questionId,
    value: r.value,
  }));

  const mappedQuestions = allQuestions.map((q) => ({
    id: q.id,
    text: q.text,
    type: q.type as 'affirmation' | 'dilemme',
    axis: q.axis as 'societal' | 'economic' | 'authority' | 'ecology' | 'sovereignty' | 'both' | 'all',
    axes: (q.axes as AxisId[] | null) ?? undefined,
    polarity: q.polarity as -1 | 1,
    domain: q.domainId,
    phase: q.phase as 'onboarding' | 'deep',
    weight: q.weight,
  }));

  const position = calculatePosition(mappedResponses, mappedQuestions);

  // Update session position
  await db
    .update(sessions)
    .set({
      positionSocietal: position.societal,
      positionEconomic: position.economic,
      positionAuthority: position.authority,
      positionEcology: position.ecology,
      positionSovereignty: position.sovereignty,
      onboardingCompleted: allResponses.length >= 10,
    })
    .where(eq(sessions.id, sessionId));

  res.json({ position, totalResponses: allResponses.length });
});

// GET /:id — récupérer la session et sa position
sessionsRouter.get('/:id', async (req, res) => {
  const [session] = await db
    .select()
    .from(sessions)
    .where(eq(sessions.id, req.params.id));

  if (!session) {
    res.status(404).json({ error: 'Session not found' });
    return;
  }

  res.json({
    id: session.id,
    createdAt: session.createdAt,
    position: session.positionSocietal != null
      ? {
          societal: session.positionSocietal,
          economic: session.positionEconomic,
          authority: session.positionAuthority,
          ecology: session.positionEcology,
          sovereignty: session.positionSovereignty,
        }
      : null,
    onboardingCompleted: session.onboardingCompleted,
  });
});
