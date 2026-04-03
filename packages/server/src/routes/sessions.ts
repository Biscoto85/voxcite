import { Router } from 'express';
import { db } from '../db/index.js';
import { sessions, responses, questions } from '../db/schema.js';
import { eq } from 'drizzle-orm';
import { calculatePosition } from '../services/scoring.js';

export const sessionsRouter = Router();

// POST / — créer une session anonyme
sessionsRouter.post('/', async (_req, res) => {
  const [session] = await db.insert(sessions).values({}).returning();
  res.status(201).json({ id: session.id, createdAt: session.createdAt });
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
    axis: q.axis as 'societal' | 'economic' | 'both',
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
      ? { societal: session.positionSocietal, economic: session.positionEconomic }
      : null,
    onboardingCompleted: session.onboardingCompleted,
  });
});
