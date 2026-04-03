import { Router } from 'express';
import { db } from '../db/index.js';
import { questions } from '../db/schema.js';
import { eq } from 'drizzle-orm';

export const questionsRouter = Router();

// GET / — toutes les questions (filtrable par phase et domain)
questionsRouter.get('/', async (req, res) => {
  const { phase, domain } = req.query;

  let query = db.select().from(questions);

  if (phase && typeof phase === 'string') {
    query = query.where(eq(questions.phase, phase)) as typeof query;
  }

  const allQuestions = await query;

  let result = allQuestions;
  if (domain && typeof domain === 'string') {
    result = result.filter((q) => q.domainId === domain);
  }

  res.json(
    result.map((q) => ({
      id: q.id,
      text: q.text,
      type: q.type,
      axis: q.axis,
      polarity: q.polarity,
      domain: q.domainId,
      phase: q.phase,
      weight: q.weight,
      options: q.options,
    })),
  );
});

// GET /onboarding — raccourci pour les 10 questions d'onboarding
questionsRouter.get('/onboarding', async (_req, res) => {
  const onboarding = await db
    .select()
    .from(questions)
    .where(eq(questions.phase, 'onboarding'));

  res.json(
    onboarding.map((q) => ({
      id: q.id,
      text: q.text,
      type: q.type,
      axis: q.axis,
      polarity: q.polarity,
      domain: q.domainId,
      phase: q.phase,
      weight: q.weight,
      options: q.options,
    })),
  );
});
